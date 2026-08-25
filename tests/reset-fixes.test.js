const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("reset-fixes.js", "utf8");

function makeControl(type, value, checked = false) {
  return {
    type,
    value,
    checked,
    isConnected: true,
    dispatchCount: 0,
    dispatchEvent() { this.dispatchCount += 1; }
  };
}

const input = makeControl("number", "40000");
const select = makeControl("select-one", "rUK");
const checkbox = makeControl("checkbox", "on", true);
const result = {
  innerHTML: "<p>old result</p>",
  classList: {
    classes: new Set(["result"]),
    add(name) { this.classes.add(name); },
    remove(name) { this.classes.delete(name); },
    contains(name) { return this.classes.has(name); }
  }
};

const resetButton = {
  listeners: {},
  addEventListener(type, handler) { this.listeners[type] = handler; },
  click() { this.listeners.click(); }
};

const card = {
  dataset: {},
  controls: [input, select, checkbox],
  querySelectorAll(selector) {
    if (selector === "input, select, textarea") return this.controls;
    if (selector === ".result") return [result];
    return [];
  },
  querySelector(selector) {
    return selector === ".reset-button" ? resetButton : null;
  },
  contains(control) {
    return this.controls.includes(control);
  }
};

const elements = {
  savingsMode: select
};

const document = {
  readyState: "complete",
  querySelectorAll(selector) {
    return selector === ".calculator-card" ? [card] : [];
  },
  getElementById(id) {
    return elements[id] || null;
  }
};

const context = {
  document,
  Event: class Event {
    constructor(type, options) {
      this.type = type;
      this.bubbles = options?.bubbles;
    }
  },
  console
};

vm.runInNewContext(source, context, { filename: "reset-fixes.js" });

input.value = "99999";
select.value = "scotland";
checkbox.checked = false;
result.innerHTML = "<p>new result</p>";
result.classList.remove("hidden");

resetButton.click();

assert.equal(input.value, "40000");
assert.equal(select.value, "rUK");
assert.equal(checkbox.checked, true);
assert.equal(result.innerHTML, "");
assert.equal(result.classList.contains("hidden"), true);
assert.ok(select.dispatchCount > 0);

console.log("WorthChex reset regression test passed.");
