/* WorthChex — reliable calculator reset behaviour */
(function () {
  "use strict";

  function initialiseResets() {
    document.querySelectorAll(".calculator-card").forEach(card => {
      const controls = Array.from(card.querySelectorAll("input, select, textarea"));
      const initial = controls.map(control => ({
        control,
        value: control.value,
        checked: control.type === "checkbox" || control.type === "radio" ? control.checked : null
      }));

      const resetButton = card.querySelector(
        "#resetButton, #savingsResetButton, #debtResetButton, #mortgageResetButton, #salaryResetButton, #compoundResetButton, #sdltResetButton, #loanResetButton"
      );

      if (!resetButton) return;

      resetButton.addEventListener("click", function () {
        initial.forEach(({ control, value, checked }) => {
          if (!control.isConnected) return;
          if (control.type === "checkbox" || control.type === "radio") {
            control.checked = Boolean(checked);
          } else {
            control.value = value;
          }
        });

        card.querySelectorAll(".result").forEach(result => {
          result.innerHTML = "";
          result.classList.add("hidden");
        });

        ["savingsMode", "debtMode", "purchaseType", "salaryFrequency", "taxRegion", "niCategory", "studentPlan", "compoundContributionFrequency", "compoundCompounding", "sdltFirstTime", "sdltAdditional", "sdltReplacing", "sdltNonResident", "mortgageType"].forEach(id => {
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
