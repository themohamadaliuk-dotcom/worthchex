const assert = require("node:assert/strict");
const W = require("../calculator-suite-final.js");

assert.equal(Math.round(W.annuityPayment(100000, 0, 120)), 833);
assert.ok(W.annuityPayment(300000, 4.5, 300) > 0);

const debt = W.debtPlan(5000, 20, 200);
assert.ok(debt);
assert.ok(debt.months > 0);
assert.ok(debt.interest > 0);
assert.equal(W.debtPlan(5000, 20, 83.3333333333), null);

assert.equal(W.sdlt(300000), 5000);
assert.equal(W.sdlt(500000, { firstTime: true }), 10000);
assert.ok(W.sdlt(500000, { additional: true }) > W.sdlt(500000));
assert.ok(W.sdlt(500000, { nonResident: true }) > W.sdlt(500000));
assert.equal(Math.round(W.sdlt(500000, { firstTime: true, nonResident: true }).tax), 14000);

assert.equal(W.incomeTax(0), 0);
assert.ok(W.employeeNI(40000) > 2000);
assert.ok(W.takeHome(60000).net > W.takeHome(40000).net);
assert.ok(W.takeHome(40000, { studentPlan: "plan2" }).net < W.takeHome(40000).net);
assert.ok(W.takeHome(40000, { postgraduate: true }).net < W.takeHome(40000).net);

assert.equal(W.futureValue(2000, 250, 0, 10), 32000);
assert.ok(W.futureValue(2000, 250, 4.5, 10) > 32000);
assert.ok(W.requiredMonthlySaving(2000, 10000, 0, 24) > 0);

const mortgage = W.mortgagePlan(250000, 4.5, 25, 0, "repayment");
assert.ok(mortgage);
assert.ok(mortgage.payment > 0);
assert.ok(mortgage.interest > 0);

const loan = W.amortise(10000, 8.9, 60, 50);
assert.ok(loan);
assert.ok(loan.payment > 0);
assert.ok(loan.total > 10000);

console.log("WorthChex final calculator suite tests passed.");
