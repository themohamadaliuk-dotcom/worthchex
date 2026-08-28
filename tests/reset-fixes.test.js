const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("reset-fixes.js", "utf8");

function makeControl(type, value, checked = false, tagName = "INPUT") {
  return {
    type,
    tagName,
    value,
    checked,
    selectedIndex: tagName === "SELECT" ? 0 : undefined,
    isConnected: true,
    dispatchCount: 0,
    dispatchEvent() { this.dispatchCount += 1; }
  };
}

const input = makeControl("number", "40000");
const select = makeControl("select-one", "rUK", false, "SELECT");
const checkbox = makeControl("checkbox", "on", true);
const date = makeControl("date", "2026-08-25");
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
  addEventListener(type, handler, capture) {
    this.listeners[type] = { handler, capture };
  },
  click() {
    const event = {
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.stopped = true; }
    };
    this.listeners.click.handler(event);
    this.lastEvent = event;
  }
};

const card = {
  dataset: {},
  controls: [input, select, checkbox, date],
  querySelectorAll(selector) {
    if (selector === "input, select, textarea") return this.controls;
    if (selector === ".result") return [result];
    return [];
  },
  querySelector(selector) {
    return selector === ".reset-button" ? resetButton : null;
  }
};

const document = {
  readyState: "complete",
  querySelectorAll(selector) {
    return selector === ".calculator-card" ? [card] : [];
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

assert.equal(resetButton.listeners.click.capture, true, "reset handler must run in capture phase");

input.value = "99999";
select.value = "scotland";
select.selectedIndex = 1;
checkbox.checked = false;
date.value = "2030-01-01";
result.innerHTML = "<p>new result</p>";
result.classList.remove("hidden");

resetButton.click();

assert.equal(resetButton.lastEvent.prevented, true, "reset should prevent the native click action");
assert.equal(resetButton.lastEvent.stopped, true, "reset should stop older reset handlers");
assert.equal(input.value, "", "number field should be blank after reset");
assert.equal(select.value, "", "select should be blank after reset");
assert.equal(select.selectedIndex, -1, "select should have no selected option after reset");
assert.equal(checkbox.checked, false, "checkbox should be unchecked after reset");
assert.equal(date.value, "", "date field should be blank after reset");
assert.equal(result.innerHTML, "", "result HTML should be cleared");
assert.equal(result.classList.contains("hidden"), true, "result should be hidden after reset");
assert.ok(select.dispatchCount > 0, "conditional UI should be refreshed");

console.log("WorthChex blank-reset regression test passed.");
