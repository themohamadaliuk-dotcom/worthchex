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
assert.equal(Math.round(W.sdlt(500000, { firstTime: true, nonResident: true })), 14000);

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


const affordabilityCash = W.affordabilityPlan({
  income: 3000,
  purchase: 12000,
  purchaseType: "cash",
  housing: 900,
  bills: 300,
  food: 350,
  transport: 200,
  childcare: 0,
  debt: 150,
  subscriptions: 100,
  irregular: 50,
  savings: 20000,
  emergency: 5000,
  hasSavings: true,
  hasEmergency: true
});
assert.ok(affordabilityCash);
assert.equal(affordabilityCash.valid, true);
assert.equal(affordabilityCash.existingSpending, 2050);
assert.equal(affordabilityCash.ratios.existingSpending, 2050 / 3000 * 100);
assert.equal(affordabilityCash.ratios.housing, 900 / 3000 * 100);
assert.equal(affordabilityCash.ratios.debt, 150 / 3000 * 100);
assert.equal(affordabilityCash.savingsAfterPurchase, 8000);
assert.equal(affordabilityCash.ratios.upfrontCashOfSavings, 60);
assert.equal(affordabilityCash.ratios.reserveCoverage, 160);

const affordabilityFinance = W.affordabilityPlan({
  income: 3000,
  purchase: 20000,
  purchaseType: "finance",
  housing: 900,
  bills: 300,
  food: 350,
  transport: 200,
  childcare: 0,
  debt: 150,
  subscriptions: 100,
  irregular: 50,
  savings: 10000,
  emergency: 5000,
  hasSavings: true,
  hasEmergency: true,
  deposit: 2000,
  financeRate: 8.9,
  financeTerm: 5,
  financeExtra: 0
});
assert.ok(affordabilityFinance);
assert.equal(affordabilityFinance.valid, true);
assert.equal(affordabilityFinance.deposit, 2000);
assert.equal(affordabilityFinance.financedAmount, 18000);
assert.ok(affordabilityFinance.payment > 0);
assert.ok(affordabilityFinance.financeInterest > 0);
assert.ok(Math.abs(affordabilityFinance.ratios.payment - affordabilityFinance.payment / 3000 * 100) < 1e-12);
assert.ok(Math.abs(affordabilityFinance.ratios.totalCommitments - (2050 + affordabilityFinance.payment) / 3000 * 100) < 1e-12);
assert.ok(Math.abs(affordabilityFinance.ratios.remainingIncome - (3000 - 2050 - affordabilityFinance.payment) / 3000 * 100) < 1e-12);
assert.equal(affordabilityFinance.ratios.upfrontCashOfSavings, 20);

assert.equal(W.affordabilityPlan({ income: 3000, purchase: 10000, purchaseType: "finance", financeTerm: 0 }).valid, false);

console.log("WorthChex final calculator suite tests passed.");
