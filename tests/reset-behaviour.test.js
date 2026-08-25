const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("reset-fixes.js", "utf8");

function makeControl(type, value) {
  return {
    type,
    value,
    checked: type === "checkbox" ? true : false,
    isConnected: true,
    listeners: {},
    addEventListener(name, handler) { this.listeners[name] = handler; },
    dispatchEvent() {},
  };
}

const controls = [
  makeControl("number", "40000"),
  makeControl("text", "hello"),
  makeControl("date", "2026-08-25"),
  makeControl("checkbox", ""),
  makeControl("select-one", "option"),
];

const result = {
  innerHTML: "previous result",
  classList: {
    hidden: false,
    add(name) { if (name === "hidden") this.hidden = true; },
  },
};

const button = makeControl("button", "");
const card = {
  dataset: {},
  contains(node) { return node === button || controls.includes(node) || node === result; },
  querySelectorAll(selector) {
    if (selector === "input, select, textarea") return controls;
    if (selector === ".result") return [result];
    return [];
  },
  querySelector(selector) {
    return selector === ".reset-button" ? button : null;
  },
};

const document = {
  readyState: "complete",
  querySelectorAll(selector) {
    return selector === ".calculator-card" ? [card] : [];
  },
  getElementById() { return null; },
};

vm.runInNewContext(source, { document, Event: function Event() {} }, { filename: "reset-fixes.js" });

assert.ok(button.listeners.click, "reset handler must be attached");
button.listeners.click();

for (const control of controls) {
  if (control.type === "checkbox" || control.type === "radio") {
    assert.equal(control.checked, false, `${control.type} should be unchecked`);
  } else {
    assert.equal(control.value, "", `${control.type} should be blank`);
  }
}

assert.equal(result.innerHTML, "", "result HTML should be cleared");
assert.equal(result.classList.hidden, true, "result should be hidden");

console.log("WorthChex blank-reset regression test passed.");
