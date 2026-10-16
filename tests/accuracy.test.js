// Known-answer tests: each figure below was worked out by hand from the
// published 2026/27 UK rules, so a change in the engine that moves any of
// these numbers is a real behaviour change, not noise.
const assert = require("node:assert/strict");
const F = require("../financial-suite-v4.js");
const S = require("../calculator-suite-final.js");

const near = (actual, expected, label, tolerance = 0.005) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);

// ---------- Income Tax and National Insurance (England, Wales, NI)
let r = F.takeHomePay(40000);
near(r.tax, 5486, "£40k tax");
near(r.ni, 2194.4, "£40k NI");
near(r.net, 32319.6, "£40k net");

r = F.takeHomePay(60000);
near(r.tax, 11432, "£60k tax");
near(r.ni, 3210.6, "£60k NI");

r = F.takeHomePay(120000);
near(r.allowance, 2570, "£120k tapered personal allowance");
near(r.tax, 39432, "£120k tax");

r = F.takeHomePay(150000);
near(r.allowance, 0, "£150k personal allowance");
near(r.tax, 53703, "£150k tax incl. additional rate");

// ---------- Scotland (2026/27 bands)
near(F.takeHomePay(40000, { region: "scotland" }).tax, 5551.07, "Scotland £40k tax");

// ---------- Student loans (2026/27 thresholds)
near(F.takeHomePay(40000, { studentPlan: "plan2" }).student, 955.35, "Plan 2 at £40k");
near(F.takeHomePay(40000, { studentPlan: "plan1" }).student, 1179, "Plan 1 at £40k");
near(F.takeHomePay(40000, { postgraduate: true }).postgrad, 1140, "Postgraduate loan at £40k");

// ---------- Pensions
const ss = F.takeHomePay(40000, { pensionMethod: "salary-sacrifice", pensionPercent: 5, studentPlan: "plan2" });
near(ss.student, 775.35, "student loan is worked out after salary sacrifice");
near(ss.ni, 2034.4, "NI is worked out after salary sacrifice");
const netPay = F.takeHomePay(40000, { pensionMethod: "net-pay", pensionPercent: 5 });
const ras = F.takeHomePay(40000, { pensionMethod: "relief-at-source", pensionPercent: 5 });
near(netPay.net, 30719.6, "net pay arrangement");
near(ras.pension, 1600, "relief at source takes 80% from pay");
near(ras.pensionGross, 2000, "relief at source pays 100% into the pension");
near(ras.net, netPay.net, "basic-rate payer: net pay and relief at source match");
assert.equal(F.takeHomePay(40000, { pensionMethod: "none", pensionPercent: 5 }).pension, 0, "no pension method means no deduction");

// ---------- Stamp Duty Land Tax (England & NI, from 1 April 2025)
near(F.sdlt(300000).tax, 5000, "SDLT £300k");
near(F.sdlt(300000, { firstTime: true }).tax, 0, "SDLT first-time buyer £300k");
near(F.sdlt(500000, { firstTime: true }).tax, 10000, "SDLT first-time buyer £500k");
near(F.sdlt(510000, { firstTime: true }).tax, 15500, "SDLT first-time buyer above £500k pays standard rates");
near(F.sdlt(300000, { additional: true }).tax, 20000, "SDLT additional property £300k");
near(F.sdlt(300000, { additional: true, replacing: true }).tax, 5000, "SDLT replacing main residence");
near(F.sdlt(300000, { nonResident: true }).tax, 11000, "SDLT non-UK resident £300k");
near(F.sdlt(39000, { additional: true }).tax, 0, "SDLT surcharge does not apply under £40k");
near(F.sdlt(300000, { firstTime: true, additional: true }).tax, 20000, "no first-time relief on an additional property");
near(F.sdlt(2000000).tax, 153750, "SDLT £2m");

// ---------- Land and Buildings Transaction Tax (Scotland)
near(F.lbtt(300000).tax, 4600, "LBTT £300k");
near(F.lbtt(300000, { firstTime: true }).tax, 4000, "LBTT first-time buyer £300k");
near(F.lbtt(300000, { additional: true }).tax, 28600, "LBTT + 8% ADS £300k");
near(F.lbtt(800000).tax, 54350, "LBTT £800k");

// ---------- Land Transaction Tax (Wales)
near(F.ltt(300000).tax, 4500, "LTT £300k");
near(F.ltt(500000).tax, 18000, "LTT £500k");
near(F.ltt(300000, { additional: true }).tax, 19950, "LTT higher rates £300k");
near(F.ltt(300000, { firstTime: true }).tax, 4500, "no first-time buyer relief in Wales");

// ---------- VAT
near(F.vatFromNet(1000, 20).gross, 1200, "add VAT");
near(F.vatFromGross(1200, 20).vat, 200, "remove VAT");

// ---------- APR handling (UK APR is an annual effective rate)
near(F.aprToMonthly(12.6825), 0.01, "12.68% APR is 1% a month", 1e-6);
near(S.amortise(10000, S.aprToNominal(8.9), 60).payment, 205.44, "£10k over 5 years at 8.9% APR");
near(F.carFinance({ vehiclePrice: 25000, deposit: 2500, apr: 8, termMonths: 48 }).payment, 546.35, "car finance at 8% APR");
near(F.carFinance({ vehiclePrice: 25000, deposit: 2500, apr: 0, termMonths: 48 }).payment, 468.75, "0% car finance");

// ---------- Mortgage (nominal rate, monthly payments)
near(S.mortgagePlan(250000, 4.5, 25, 0, "repayment").payment, 1389.58, "£250k at 4.5% over 25 years");
near(S.mortgagePlan(200000, 5, 25, 0, "interest-only").payment, 833.33, "interest-only £200k at 5%");
const over = S.mortgagePlan(250000, 4.5, 25, 200, "repayment");
const base = S.mortgagePlan(250000, 4.5, 25, 0, "repayment");
assert.ok(over.periods < base.periods && over.interest < base.interest, "overpaying shortens the term and cuts interest");

// ---------- Money formatting
assert.equal(F.money(-1234.5), "-£1,234.50");
assert.equal(S.money(-1234.5), "-£1,234.50");

console.log("WorthChex accuracy tests passed.");
