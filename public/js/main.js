(function () {
  "use strict";

  /* ============== Mobile nav toggle ============== */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      navToggle.classList.toggle("active");
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  /* ============== Scroll reveal ============== */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ============== Typewriter ============== */
  const typewriterEl = document.getElementById("typewriter");
  if (typewriterEl) {
    let words = [];
    try {
      words = JSON.parse(typewriterEl.dataset.words || "[]");
    } catch (e) {
      words = [];
    }
    if (!words.length) words = ["Full-Stack Developer"];

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const currentWord = words[wordIndex];
      if (!deleting) {
        charIndex++;
        typewriterEl.textContent = currentWord.slice(0, charIndex);
        if (charIndex === currentWord.length) {
          deleting = true;
          setTimeout(tick, 1600);
          return;
        }
      } else {
        charIndex--;
        typewriterEl.textContent = currentWord.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }
      }
      setTimeout(tick, deleting ? 40 : 85);
    }
    tick();
  }

  /* ============== Animated stat counters ============== */
  const statEls = document.querySelectorAll(".stat-num[data-count]");
  if (statEls.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const duration = 1400;
      const start = performance.now();
      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      }
      requestAnimationFrame(frame);
    };

    if ("IntersectionObserver" in window) {
      const statObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              statObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      statEls.forEach((el) => statObserver.observe(el));
    } else {
      statEls.forEach(animateCount);
    }
  }

  /* ============== Project tabs ============== */
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.querySelector(`.tab-panel[data-panel="${target}"]`);
      if (panel) panel.classList.add("active");
    });
  });

  /* ============== Tilt effect on project cards ============== */
  const tiltCards = document.querySelectorAll(".tilt");
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / rect.height) * -6;
      const rotateY = ((x - rect.width / 2) / rect.width) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  /* ============== Nav background on scroll ============== */
  const siteNav = document.getElementById("siteNav");
  if (siteNav) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) siteNav.style.padding = "10px 0";
      else siteNav.style.padding = "16px 0";
    });
  }
})();
