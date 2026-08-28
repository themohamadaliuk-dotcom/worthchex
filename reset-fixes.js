/* WorthChex — reliable calculator reset behaviour */
(function () {
  "use strict";

  function initialiseResets() {
    document.querySelectorAll(".calculator-card").forEach(card => {
      if (card.dataset.worthchexResetBound === "true") return;

      const controls = Array.from(card.querySelectorAll("input, select, textarea"));
      const resetButton = card.querySelector(".reset-button");
      if (!resetButton) return;

      card.dataset.worthchexResetBound = "true";

      // Capture-phase handler makes this the single authoritative reset.
      // It runs before older inline reset handlers and prevents those handlers
      // from restoring example values after we have cleared the form.
      resetButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        controls.forEach(control => {
          if (!control.isConnected) return;

          if (control.tagName === "SELECT") {
            control.selectedIndex = -1;
          } else if (control.type === "checkbox" || control.type === "radio") {
            control.checked = false;
          } else {
            control.value = "";
          }
        });

        card.querySelectorAll(".result").forEach(result => {
          result.innerHTML = "";
          result.classList.add("hidden");
        });

        controls.forEach(control => {
          if (control.isConnected && control.tagName === "SELECT") {
            control.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      }, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseResets);
  } else {
    initialiseResets();
  }
})();
