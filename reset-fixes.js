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

      resetButton.addEventListener("click", function () {
        // Final reset state: every user-editable field is blank.
        controls.forEach(control => {
          if (!control.isConnected) return;

          if (control.type === "checkbox" || control.type === "radio") {
            control.checked = false;
          } else {
            control.value = "";
          }
        });

        // Clear every generated result on the calculator page.
        card.querySelectorAll(".result").forEach(result => {
          result.innerHTML = "";
          result.classList.add("hidden");
        });

        // Re-run conditional UI logic after clearing values.
        [
          "savingsMode", "debtMode", "purchaseType", "salaryFrequency", "taxRegion", "niCategory",
          "studentPlan", "thRegion", "thNI", "thPensionMethod", "thStudent", "ciContributionFreq",
          "ciCompounding", "sdFirst", "sdAdditional", "sdReplacing", "sdResident", "mortgageType",
          "mortgageFirstTime", "mortgageAdditional", "mortgageReplacing", "vatMode", "vatRate", "carTerm"
        ].forEach(id => {
          const control = document.getElementById(id);
          if (control && card.contains(control)) {
            control.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseResets);
  } else {
    initialiseResets();
  }
})();
