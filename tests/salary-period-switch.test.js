const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("reset-fixes.js", "utf8");

const salaryInput = {
  value: "48000",
  dataset: {},
  isConnected: true
};

const salaryPeriod = {
  value: "annual",
  dataset: {},
  listeners: {},
  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }
};

const document = {
  readyState: "complete",
  getElementById(id) {
    return id === "salaryInput" ? salaryInput : id === "salaryPeriod" ? salaryPeriod : null;
  },
  querySelectorAll() {
    return [];
  }
};

vm.runInNewContext(source, { document, console }, { filename: "reset-fixes.js" });

assert.equal(typeof salaryPeriod.listeners.change, "function", "salary period change handler should be installed");

salaryPeriod.value = "monthly";
salaryPeriod.listeners.change();
assert.equal(salaryInput.value, "4000", "annual salary should convert to monthly when period changes");

salaryPeriod.value = "annual";
salaryPeriod.listeners.change();
assert.equal(salaryInput.value, "48000", "monthly salary should convert back to annual");

salaryInput.value = "";
salaryPeriod.value = "monthly";
salaryPeriod.listeners.change();
assert.equal(salaryInput.value, "", "blank salary should stay blank when switching period");

console.log("WorthChex salary period-switch regression test passed.");
