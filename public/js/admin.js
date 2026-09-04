(function () {
  "use strict";

  const editorTabs = document.querySelectorAll(".editor-tab");
  const editorPanes = document.querySelectorAll(".editor-pane");
  const contentField = document.getElementById("contentField");
  const previewBox = document.getElementById("previewBox");

  if (editorTabs.length) {
    editorTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.editorTab;

        editorTabs.forEach((t) => t.classList.remove("active"));
        editorPanes.forEach((p) => p.classList.remove("active"));

        tab.classList.add("active");
        const pane = document.querySelector(`.editor-pane[data-editor-pane="${target}"]`);
        if (pane) pane.classList.add("active");

        if (target === "preview" && previewBox && contentField) {
          previewBox.innerHTML = contentField.value || "<p style='color:#666'>Nothing to preview yet — write some HTML on the left.</p>";
        }
      });
    });
  }

  // Auto-grow the content textarea a little as the user types
  if (contentField) {
    contentField.addEventListener("input", () => {
      contentField.style.height = "auto";
      contentField.style.height = Math.max(420, contentField.scrollHeight) + "px";
    });
  }
})();
