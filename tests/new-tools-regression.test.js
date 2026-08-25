const assert = require("node:assert/strict");
const W = require("../financial-suite-v4.js");

const vat = W.vatFromNet(1000, 20);
assert.equal(vat.net, 1000);
assert.equal(vat.vat, 200);
assert.equal(vat.gross, 1200);

const reverseVat = W.vatFromGross(1200, 20);
assert.ok(Math.abs(reverseVat.net - 1000) < 1e-9);
assert.ok(Math.abs(reverseVat.vat - 200) < 1e-9);

const zeroVat = W.vatFromGross(1200, 0);
assert.equal(zeroVat.net, 1200);
assert.equal(zeroVat.vat, 0);

const salary = W.takeHomePay(40000);
assert.ok(Math.abs(salary.tax - 5486) < 1e-9);
assert.ok(Math.abs(salary.ni - 2194.4) < 1e-9);
assert.ok(Math.abs(salary.net - 32319.6) < 1e-9);
assert.ok(Math.abs(salary.monthly - 2693.3) < 1e-9);

assert.ok(W.takeHomePay(40000, { studentPlan: "plan2" }).net < salary.net);
assert.ok(W.takeHomePay(40000, { postgraduate: true }).net < salary.net);
assert.ok(W.takeHomePay(40000, { region: "scotland" }).net !== salary.net);

assert.equal(W.sdlt(300000).tax, 5000);
assert.equal(W.sdlt(500000, { firstTime: true }).tax, 10000);
assert.equal(W.sdlt(500000, { firstTime: true, nonResident: true }).tax, 14000);
assert.ok(W.sdlt(500000, { additional: true }).tax > W.sdlt(500000).tax);

const compound = W.compoundGrowth({
  starting: 2000,
  contribution: 250,
  annualRate: 0,
  years: 10,
  contributionFrequency: 12,
  compoundingFrequency: 12
});
assert.equal(compound.totalPrincipal, 32000);
assert.equal(compound.finalValue, 32000);
assert.equal(compound.interest, 0);

const compoundWithGrowth = W.compoundGrowth({
  starting: 2000,
  contribution: 250,
  annualRate: 4.5,
  years: 10,
  contributionFrequency: 12,
  compoundingFrequency: 12
});
assert.ok(compoundWithGrowth.finalValue > 32000);
assert.ok(compoundWithGrowth.interest > 0);

const car = W.carFinance({
  vehiclePrice: 25000,
  deposit: 2500,
  partExchange: 0,
  fees: 0,
  apr: 0,
  termMonths: 48,
  balloon: 0
});
assert.equal(car.financed, 22500);
assert.ok(Math.abs(car.payment - 468.75) < 1e-9);
assert.equal(car.financeInterest, 0);
assert.equal(car.totalPaid, 25000);

console.log("WorthChex new calculator regression tests passed.");
