const crypto = require("crypto");
const SecurityBlock = require("../models/SecurityBlock");

const WINDOW_MS = 60 * 1000;
const LONG_WINDOW_MS = 10 * WINDOW_MS;
const requests = new Map();
const cachedBlocks = new Map();

const configuredRequestLimit = Number(process.env.SECURITY_REQUEST_LIMIT);
const configuredLongRequestLimit = Number(process.env.SECURITY_LONG_REQUEST_LIMIT);
const REQUEST_LIMIT = Number.isFinite(configuredRequestLimit) && configuredRequestLimit > 0
  ? configuredRequestLimit
  : 120;
const LONG_REQUEST_LIMIT = Number.isFinite(configuredLongRequestLimit) && configuredLongRequestLimit > 0
  ? configuredLongRequestLimit
  : 600;
const DEVICE_COOKIE = "devlogr_device";

function normaliseIp(ip) {
  if (!ip) return "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

function networkFor(ip) {
  if (ip.includes(".")) {
    const octets = ip.split(".");
    return octets.length === 4 ? `${octets.slice(0, 3).join(".")}.0/24` : ip;
  }

  const groups = ip.split(":");
  return `${groups.slice(0, 4).join(":")}::/64`;
}

function deviceFor(req) {
  const cookies = (req.get("cookie") || "").split(";").reduce((values, pair) => {
    const separator = pair.indexOf("=");
    if (separator > 0) values[pair.slice(0, separator).trim()] = pair.slice(separator + 1).trim();
    return values;
  }, {});
  if (!cookies[DEVICE_COOKIE]) return null;

  const userAgent = req.get("user-agent") || "missing";
  const language = req.get("accept-language") || "missing";
  return crypto
    .createHash("sha256")
    .update(`${cookies[DEVICE_COOKIE]}|${userAgent}|${language}`)
    .digest("hex");
}

function signatures(req) {
  const ip = normaliseIp(req.ip || req.socket.remoteAddress);
  const result = [
    { kind: "ip", value: ip },
    { kind: "network", value: networkFor(ip) },
  ];
  const device = deviceFor(req);
  if (device) result.push({ kind: "device", value: device });
  return result;
}

function isSuspiciousRequest(req) {
  const userAgent = (req.get("user-agent") || "").toLowerCase();
  return !userAgent || /(?:bot|crawler|spider|scrapy|curl|wget|httpclient|headless)/i.test(userAgent);
}

function record(signature, now, suspicious) {
  const existing = requests.get(`${signature.kind}:${signature.value}`) || {
    startedAt: now,
    longStartedAt: now,
    count: 0,
    longCount: 0,
  };

  if (now - existing.startedAt >= WINDOW_MS) {
    existing.startedAt = now;
    existing.count = 0;
  }
  if (now - existing.longStartedAt >= LONG_WINDOW_MS) {
    existing.longStartedAt = now;
    existing.longCount = 0;
  }

  existing.count += 1;
  existing.longCount += 1;
  requests.set(`${signature.kind}:${signature.value}`, existing);
  if (requests.size > 10000) {
    for (const [key, entry] of requests) {
      if (now - entry.longStartedAt >= LONG_WINDOW_MS) requests.delete(key);
    }
  }
  const requestLimit = suspicious ? Math.min(REQUEST_LIMIT, 30) : REQUEST_LIMIT;
  const longRequestLimit = suspicious ? Math.min(LONG_REQUEST_LIMIT, 150) : LONG_REQUEST_LIMIT;
  return existing.count > requestLimit || existing.longCount > longRequestLimit;
}

async function activeBlock(signaturesToCheck, now) {
  const uncached = signaturesToCheck.filter((signature) => {
    const cached = cachedBlocks.get(`${signature.kind}:${signature.value}`);
    return !cached || cached <= now;
  });

  for (const signature of signaturesToCheck) {
    const expiresAt = cachedBlocks.get(`${signature.kind}:${signature.value}`);
    if (expiresAt && expiresAt > now) return expiresAt;
  }

  if (!uncached.length) return null;
  const blocks = await SecurityBlock.find({
    $or: uncached,
    expiresAt: { $gt: new Date(now) },
  })
    .select("kind value expiresAt")
    .lean();

  for (const block of blocks) {
    cachedBlocks.set(`${block.kind}:${block.value}`, block.expiresAt.getTime());
  }
  return blocks[0] ? blocks[0].expiresAt.getTime() : null;
}

async function createBlocks(signaturesToBlock, reason, now) {
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 4);
  await SecurityBlock.bulkWrite(
    signaturesToBlock.map((signature) => ({
      updateOne: {
        filter: signature,
        update: {
          $set: { reason, expiresAt, lastSeenAt: new Date(now) },
          $setOnInsert: signature,
        },
        upsert: true,
      },
    }))
  );
  for (const signature of signaturesToBlock) {
    cachedBlocks.set(`${signature.kind}:${signature.value}`, expiresAt.getTime());
  }
  return expiresAt;
}

async function securityGuard(req, res, next) {
  const now = Date.now();
  const requestSignatures = signatures(req);
  const suspicious = isSuspiciousRequest(req);

  if (!req.get("cookie")?.includes(`${DEVICE_COOKIE}=`)) {
    const deviceToken = crypto.randomBytes(18).toString("base64url");
    res.append(
      "Set-Cookie",
      `${DEVICE_COOKIE}=${deviceToken}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax`
    );
  }

  try {
    if (await activeBlock(requestSignatures, now)) {
      return res.status(429).send("Too many requests. Access is temporarily blocked.");
    }

    const shouldBlock = requestSignatures.some((signature) => record(signature, now, suspicious));
    if (shouldBlock) {
      await createBlocks(
        requestSignatures,
        suspicious ? "automated traffic" : "request rate exceeded",
        now
      );
      return res.status(429).send("Too many requests. Access is temporarily blocked.");
    }
  } catch (error) {
    console.error("Security guard unavailable:", error.message);
  }

  return next();
}

module.exports = securityGuard;