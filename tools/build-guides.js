#!/usr/bin/env node
/* Generates the data-driven money guides (salary after tax, property tax, student loans)
   from the same engine the calculators use, so the figures always match.
   Run from the repository root:  node tools/build-guides.js && python3 tools/apply-layout.py */
"use strict";
const fs = require("fs");
const path = require("path");
const F = require("../financial-suite-v4.js");

const ROOT = path.join(__dirname, "..");
const YEAR = "2026/27";
const REVIEWED = "October 2026";
const m0 = v => F.money(v, 0);
const m2 = v => F.money(v, 2);
const k = n => `£${(n / 1000).toLocaleString("en-GB")}k`;
const comma = n => `£${n.toLocaleString("en-GB")}`;

function page({ slug, title, description, eyebrow, h1, lead, body, meta }) {
  const reviewed = meta === "evergreen"
    ? `<span><strong>Last reviewed:</strong> ${REVIEWED}</span><span><strong>Figures:</strong> worked out with the WorthChex calculators</span>`
    : `<span><strong>Tax year:</strong> ${YEAR}</span><span><strong>Last reviewed:</strong> ${REVIEWED}</span>`;
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${description}"><meta name="robots" content="index, follow"><meta name="theme-color" content="#635bff"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/site.webmanifest"><link rel="canonical" href="https://worthchex.com/money-guides/${slug}/"><title>${title}</title>
</head><body>
<nav class="navbar" aria-label="Main navigation"></nav>
<main id="main"><section class="about-section"><div class="about-inner"><div class="breadcrumbs"><a href="/">WorthChex</a> &nbsp;›&nbsp; <a href="/money-guides/">Money guides</a></div><span class="step">${eyebrow}</span><h1>${h1}</h1><p>${lead}</p><div class="reviewed-line">${reviewed}</div></div></section>
${body}
</main>
<footer></footer>
</body></html>
`;
  const dir = path.join(ROOT, "money-guides", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  return slug;
}

const section = (inner, alt = false) => `<section class="editorial-section${alt ? " alt" : ""}"><div class="editorial-inner">${inner}</div></section>`;
const table = (head, rows, foot) => `<div class="table-scroll"><table class="band-table guide-table${head.length >= 4 ? " wide" : ""}"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>${foot ? `<tfoot><tr>${foot.map(c => `<td>${c}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
const faq = items => `<div class="faq-list">${items.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
const stats = items => `<div class="guide-stats">${items.map(([label, value, note]) => `<div class="guide-stat"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`).join("")}</div>`;

// ---------------------------------------------------------------- salary after tax
const SALARIES = [30000, 35000, 40000, 50000, 60000, 100000];
const salarySlug = s => s === 40000 ? "40000-salary-take-home-pay" : `${s / 1000}k-after-tax`;
const salaryLinks = s => SALARIES.filter(x => x !== s).map(x => `<a href="/money-guides/${salarySlug(x)}/">${k(x)} after tax</a>`).join(" · ");

function salaryGuide(salary) {
  const r = F.takeHomePay(salary);
  const sc = F.takeHomePay(salary, { region: "scotland" });
  const pen = F.takeHomePay(salary, { pensionMethod: "net-pay", pensionPercent: 5 });
  const ss = F.takeHomePay(salary, { pensionMethod: "salary-sacrifice", pensionPercent: 5 });
  const p2 = F.takeHomePay(salary, { studentPlan: "plan2" });
  const p5 = F.takeHomePay(salary, { studentPlan: "plan5" });
  const taxable = r.taxableIncome;
  const basic = Math.min(taxable, 37700), higher = Math.max(0, Math.min(taxable, 125140) - 37700);
  const niMain = Math.max(0, Math.min(salary, 50270) - 12570), niUpper = Math.max(0, salary - 50270);
  const effective = (r.tax + r.ni) / salary * 100;
  const label = comma(salary);
  const rate = salary > 50270 ? "higher-rate" : "basic-rate";

  const steps = [
    r.allowance < 12570
      ? `<li><strong>Personal Allowance:</strong> it normally covers the first £12,570, but it shrinks by £1 for every £2 earned over £100,000. At ${label} your allowance is ${m0(r.allowance)}, leaving ${m0(taxable)} to tax.</li>`
      : `<li><strong>Personal Allowance:</strong> the first £12,570 is tax-free, leaving ${m0(taxable)} of taxable income.</li>`,
    `<li><strong>Income Tax:</strong> 20% on ${m0(basic)}${higher ? ` and 40% on ${m0(higher)}` : ""}${taxable > 125140 ? ` and 45% on ${m0(taxable - 125140)}` : ""} = <strong>${m0(r.tax)}</strong>.</li>`,
    `<li><strong>National Insurance:</strong> 8% on the ${m0(niMain)} you earn between £12,570 and £50,270${niUpper ? `, plus 2% on the ${m0(niUpper)} above £50,270` : ""} = <strong>${m0(r.ni)}</strong>.</li>`,
    `<li><strong>Take-home pay:</strong> ${label} − ${m0(r.tax)} − ${m0(r.ni)} = <strong>${m0(r.net)}</strong> a year.</li>`,
  ];

  let special = "";
  if (salary === 100000) {
    const r110 = F.takeHomePay(110000);
    const extra = r110.net - r.net;
    special = section(`<span class="step">THE £100,000 TAX TRAP</span><h2>Why earning just over £100,000 costs so much.</h2><p>Between £100,000 and £125,140 you lose £1 of Personal Allowance for every £2 you earn. That makes the effective tax rate on this slice 60%, plus 2% National Insurance.</p><div class="example-box"><strong>Example:</strong> a pay rise from £100,000 to £110,000 adds only <strong>${m0(extra)}</strong> to take-home pay. That is ${(extra / 10000 * 100).toFixed(0)}p of every extra pound.</div><p>Many people at this level use salary sacrifice into a pension to bring their adjusted net income back to £100,000 or below, which keeps the full allowance. A 5% salary-sacrifice contribution at ${label} would leave take-home pay of ${m0(ss.net)} while putting ${m0(ss.salarySacrifice)} into your pension.</p>`, true);
  } else if (salary > 50270) {
    special = section(`<span class="step">HIGHER-RATE TAX</span><h2>Only part of ${label} is taxed at 40%.</h2><p>Crossing the £50,270 threshold does not make your whole salary taxed at 40%. Only the ${m0(higher)} above that point is taxed at the higher rate, and National Insurance drops from 8% to 2% on the same slice.</p><p>Pension contributions are especially valuable here: each £100 paid in through salary sacrifice costs you only about £58 in take-home pay, because you save 40% tax and 2% National Insurance (about £60 through a net pay scheme, which saves the tax only).</p>`, true);
  }

  return page({
    slug: salarySlug(salary),
    title: `${label} After Tax UK ${YEAR}: ${m0(r.monthly)} a Month | WorthChex`,
    description: `On a ${label} salary in ${YEAR} you take home about ${m0(r.net)} a year or ${m0(r.monthly)} a month after Income Tax and National Insurance. See the full breakdown, Scotland, pension and student loan figures.`,
    eyebrow: "PAY GUIDE",
    h1: `${label} after tax: how much will you take home?`,
    lead: `On a ${label} salary in England, Wales or Northern Ireland, you take home about <strong>${m0(r.net)} a year</strong>, which is <strong>${m0(r.monthly)} a month</strong>, after Income Tax and National Insurance in the ${YEAR} tax year.`,
    body:
      section(`<span class="step">THE ANSWER</span><h2>${label} take-home pay at a glance.</h2>${stats([["Per year", m0(r.net)], ["Per month", m0(r.monthly)], ["Per week", m0(r.weekly)], ["Per hour", m2(r.hourly), "37.5-hour week"]])}
${table(["", "Year", "Month", "Week"], [
  ["Gross salary", m2(salary), m2(salary / 12), m2(salary / 52)],
  ["Income Tax", `−${m2(r.tax)}`, `−${m2(r.tax / 12)}`, `−${m2(r.tax / 52)}`],
  ["National Insurance", `−${m2(r.ni)}`, `−${m2(r.ni / 12)}`, `−${m2(r.ni / 52)}`],
], ["Take-home pay", m2(r.net), m2(r.monthly), m2(r.weekly)])}
<p class="source-note">Assumes a standard 1257L tax code, National Insurance category A, no pension or student loan, and England, Wales or Northern Ireland tax rates. Your overall deduction rate is ${effective.toFixed(1)}%.</p>`) +
      section(`<span class="step">HOW IT IS WORKED OUT</span><h2>The ${label} calculation, step by step.</h2><ol class="guide-steps">${steps.join("")}</ol><p>You are a ${rate} taxpayer: ${salary > 50270 ? "part of your income falls in the 40% band, which starts above £50,270." : "all of your taxable income falls in the 20% basic-rate band."}</p>`, true) +
      section(`<span class="step">YOUR SITUATION</span><h2>How common deductions change ${label}.</h2><p>Most employees have at least one extra deduction. Here is the monthly take-home pay on ${label} in some common situations:</p>
${table(["Situation", "Take-home a month", "Difference"], [
  ["No pension or student loan", m2(r.monthly), "—"],
  ["Living in Scotland", m2(sc.monthly), `${sc.monthly >= r.monthly ? "+" : "−"}${m2(Math.abs(sc.monthly - r.monthly))}`],
  ["5% workplace pension (net pay)", m2(pen.monthly), `−${m2(r.monthly - pen.monthly)}`],
  ["5% pension by salary sacrifice", m2(ss.monthly), `−${m2(r.monthly - ss.monthly)}`],
  ["Plan 2 student loan (England/Wales, 2012–2023)", m2(p2.monthly), p2.student ? `−${m2(p2.student / 12)}` : "£0.00"],
  ["Plan 5 student loan (England, from 2023)", m2(p5.monthly), p5.student ? `−${m2(p5.student / 12)}` : "£0.00"],
])}
<p>A 5% pension contribution of ${m0(salary * 0.05)} a year only reduces take-home pay by about ${m0(r.net - pen.net)}, because the contribution gets tax relief. Salary sacrifice also saves National Insurance, so it costs even less: ${m0(r.net - ss.net)}.</p>
<div class="content-callout"><strong>Get your exact figure</strong><p>Enter your own pension, student loan and region in the <a href="/take-home-pay-calculator/">take-home pay calculator</a>, or compare a pay rise in the <a href="/salary-calculator/">salary calculator</a>.</p></div>`) +
      special +
      section(`<span class="step">FREQUENT QUESTIONS</span><h2>${label} salary FAQs</h2>${faq([
        [`How much is ${label} a month after tax?`, `About ${m0(r.monthly)} a month in England, Wales or Northern Ireland, and ${m0(sc.monthly)} in Scotland, before any pension or student loan deductions.`],
        [`What is ${label} a year as an hourly rate?`, `Based on a 37.5-hour week, ${label} is about ${m2(salary / 1950)} an hour before tax and ${m2(r.hourly)} an hour after tax.`],
        [`How much tax do I pay on ${label}?`, `${m2(r.tax)} in Income Tax and ${m2(r.ni)} in National Insurance a year, a total of ${m2(r.tax + r.ni)}.`],
        ["Why is my payslip slightly different?", "Payroll works each pay period separately and rounds figures, and your tax code, benefits in kind, pension method or student loan can change the result. An emergency tax code can also cause temporary differences."],
      ])}<p>Other salaries: ${salaryLinks(salary)}</p><p class="source-note">Rates: <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noopener noreferrer">GOV.UK Income Tax rates</a> · <a href="https://www.gov.uk/national-insurance/how-much-you-pay" target="_blank" rel="noopener noreferrer">GOV.UK National Insurance</a> · <a href="https://www.gov.uk/scottish-income-tax" target="_blank" rel="noopener noreferrer">Scottish Income Tax</a>. Estimates for planning only, not tax advice.</p>`, true),
  });
}

// ---------------------------------------------------------------- property tax guides
const bandRows = bands => bands.map(([lo, hi, rate]) => [hi === Infinity ? `Above ${comma(lo)}` : `${comma(lo)} to ${comma(hi)}`, `${(rate * 100).toLocaleString("en-GB")}%`]);

function lbttGuide() {
  const prices = [200000, 300000, 450000, 750000];
  return page({
    slug: "stamp-duty-scotland-lbtt",
    title: "Stamp Duty in Scotland 2026: LBTT Rates & Calculator | WorthChex",
    description: "How Land and Buildings Transaction Tax (LBTT) works in Scotland in 2026: current rates, first-time buyer relief, the 8% Additional Dwelling Supplement and worked examples.",
    eyebrow: "PROPERTY GUIDE",
    h1: "Stamp Duty in Scotland: how LBTT works",
    lead: "Scotland does not use Stamp Duty. Home buyers pay <strong>Land and Buildings Transaction Tax (LBTT)</strong> instead, with different bands, its own first-time buyer relief and an 8% supplement on additional homes.",
    body:
      section(`<span class="step">CURRENT RATES</span><h2>LBTT residential rates.</h2><p>Like Stamp Duty, LBTT is charged in slices: each rate applies only to the part of the price inside that band.</p>${table(["Price band", "Rate"], bandRows([[0, 145000, 0], [145000, 250000, 0.02], [250000, 325000, 0.05], [325000, 750000, 0.10], [750000, Infinity, 0.12]]))}
<p><strong>First-time buyers</strong> get a larger 0% band, up to £175,000. That saves up to £600 and there is no price cap.</p><p><strong>Additional homes</strong> pay the Additional Dwelling Supplement (ADS): 8% of the <em>whole</em> price, on top of normal LBTT, for purchases of £40,000 or more.</p>`) +
      section(`<span class="step">WORKED EXAMPLES</span><h2>How much LBTT will you pay?</h2>${table(["Price", "Standard buyer", "First-time buyer", "Additional home (with ADS)"], prices.map(p => [comma(p), m0(F.lbtt(p).tax), m0(F.lbtt(p, { firstTime: true }).tax), m0(F.lbtt(p, { additional: true }).tax)]))}
<div class="example-box"><strong>Example, £300,000:</strong> 0% on the first £145,000, 2% on the next £105,000 (£2,100) and 5% on the last £50,000 (£2,500) = <strong>£4,600</strong>. A first-time buyer pays £4,000. If it is a second home, the 8% ADS adds £24,000, making £28,600.</div>
<div class="content-callout"><strong>Work out your own figure</strong><p>Choose Scotland in the <a href="/stamp-duty-calculator/">Stamp Duty calculator</a> for a band-by-band breakdown.</p></div>`, true) +
      section(`<span class="step">GOOD TO KNOW</span><h2>LBTT rules that catch people out.</h2><ul><li><strong>Replacing your main home:</strong> if you buy a new main home before selling your old one, you usually pay ADS up front and can reclaim it if you sell the previous home within 36 months.</li><li><strong>Joint buyers:</strong> first-time buyer relief needs every buyer to be a first-time buyer.</li><li><strong>Deadline:</strong> the return and payment are due within 30 days of the effective date, usually completion. Your solicitor normally handles this.</li><li><strong>Compared with England:</strong> on cheaper homes LBTT can be lower than SDLT, but above about £325,000 it rises faster because of the 10% band.</li></ul>`) +
      section(`<span class="step">FREQUENT QUESTIONS</span><h2>LBTT FAQs</h2>${faq([
        ["Is LBTT the same as Stamp Duty?", "It does the same job, but it is a separate Scottish tax with different bands, administered by Revenue Scotland rather than HMRC."],
        ["Do first-time buyers pay LBTT?", "Only on the part of the price above £175,000. A first-time buyer paying £175,000 or less pays no LBTT."],
        ["What is the Additional Dwelling Supplement?", "An extra 8% of the whole purchase price when you buy an additional home for £40,000 or more, such as a second home or buy-to-let."],
      ])}<p><a href="/money-guides/stamp-duty-wales-ltt/">Stamp Duty in Wales (LTT) →</a> · <a href="/money-guides/stamp-duty-second-home/">Stamp Duty on a second home →</a> · <a href="/money-guides/first-time-buyer-stamp-duty/">First-time buyers in England →</a></p><p class="source-note">Source: <a href="https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property" target="_blank" rel="noopener noreferrer">Revenue Scotland residential LBTT</a>. Estimates for planning only.</p>`, true),
  });
}

function lttGuide() {
  const prices = [200000, 300000, 450000, 750000];
  return page({
    slug: "stamp-duty-wales-ltt",
    title: "Stamp Duty in Wales 2026: LTT Rates & Calculator | WorthChex",
    description: "How Land Transaction Tax (LTT) works in Wales in 2026: current main and higher rates, why there is no first-time buyer relief, and worked examples.",
    eyebrow: "PROPERTY GUIDE",
    h1: "Stamp Duty in Wales: how LTT works",
    lead: "Wales replaced Stamp Duty with <strong>Land Transaction Tax (LTT)</strong>. Its 0% band is the most generous in the UK at £225,000, but there is no separate relief for first-time buyers.",
    body:
      section(`<span class="step">CURRENT RATES</span><h2>LTT main residential rates.</h2>${table(["Price band", "Rate"], bandRows([[0, 225000, 0], [225000, 400000, 0.06], [400000, 750000, 0.075], [750000, 1500000, 0.10], [1500000, Infinity, 0.12]]))}
<h3>Higher rates for additional homes</h3><p>If you will own more than one home and are not replacing your main residence, a separate higher-rates table applies from the first pound:</p>${table(["Price band", "Higher rate"], bandRows([[0, 180000, 0.05], [180000, 250000, 0.085], [250000, 400000, 0.10], [400000, 750000, 0.125], [750000, 1500000, 0.15], [1500000, Infinity, 0.17]]))}`) +
      section(`<span class="step">WORKED EXAMPLES</span><h2>How much LTT will you pay?</h2>${table(["Price", "Main home", "Additional home"], prices.map(p => [comma(p), m0(F.ltt(p).tax), m0(F.ltt(p, { additional: true }).tax)]))}
<div class="example-box"><strong>Example, £300,000:</strong> 0% on the first £225,000 and 6% on the remaining £75,000 = <strong>£4,500</strong>. As an additional home, the higher rates give £19,950.</div>
<div class="content-callout"><strong>Work out your own figure</strong><p>Choose Wales in the <a href="/stamp-duty-calculator/">Stamp Duty calculator</a>.</p></div>`, true) +
      section(`<span class="step">FREQUENT QUESTIONS</span><h2>LTT FAQs</h2>${faq([
        ["Do first-time buyers pay LTT?", "First-time buyers pay the same main rates as everyone else, but nothing is due on homes up to £225,000, which covers many first purchases."],
        ["When is LTT paid?", "The return and payment are due to the Welsh Revenue Authority within 30 days of completion. Your solicitor usually files it."],
        ["Can I reclaim the higher rates?", "If you bought a new main home before selling your old one, you can usually reclaim the difference if you sell the previous main home within three years."],
      ])}<p><a href="/money-guides/stamp-duty-scotland-lbtt/">Stamp Duty in Scotland (LBTT) →</a> · <a href="/money-guides/stamp-duty-second-home/">Stamp Duty on a second home →</a></p><p class="source-note">Source: <a href="https://www.gov.wales/land-transaction-tax-rates-and-bands" target="_blank" rel="noopener noreferrer">Welsh Revenue Authority LTT rates</a>. Estimates for planning only.</p>`, true),
  });
}

function secondHomeGuide() {
  const prices = [200000, 300000, 500000];
  return page({
    slug: "stamp-duty-second-home",
    title: "Stamp Duty on a Second Home 2026: England, Scotland & Wales | WorthChex",
    description: "How much Stamp Duty you pay on a second home or buy-to-let in 2026: the 5% SDLT surcharge, Scotland's 8% ADS and Wales's higher LTT rates, with examples and refund rules.",
    eyebrow: "PROPERTY GUIDE",
    h1: "Stamp Duty on a second home or buy-to-let",
    lead: "Buying a home when you already own one usually means paying extra property tax. How much depends on where in the UK the property is.",
    body:
      section(`<span class="step">THE EXTRA CHARGES</span><h2>What each nation adds for additional homes.</h2><div class="content-grid"><article class="content-card"><h3>England &amp; NI</h3><p>A 5% surcharge on every band of Stamp Duty Land Tax.</p></article><article class="content-card"><h3>Scotland</h3><p>The Additional Dwelling Supplement: 8% of the whole price on top of LBTT.</p></article><article class="content-card"><h3>Wales</h3><p>A separate higher-rates table, from 5% to 17%.</p></article></div><p>The extra charges apply to purchases of £40,000 or more, when you will own more than one residential property after completion and you are not replacing your main home.</p>`) +
      section(`<span class="step">WORKED EXAMPLES</span><h2>Second-home property tax compared.</h2>${table(["Price", "England & NI", "Scotland", "Wales"], prices.map(p => [comma(p), m0(F.sdlt(p, { additional: true }).tax), m0(F.lbtt(p, { additional: true }).tax), m0(F.ltt(p, { additional: true }).tax)]))}
<p>For comparison, a main home at £300,000 costs ${m0(F.sdlt(300000).tax)} in England, ${m0(F.lbtt(300000).tax)} in Scotland and ${m0(F.ltt(300000).tax)} in Wales.</p>
<div class="content-callout"><strong>Check your purchase</strong><p>Choose the nation and answer “yes” to owning more than one home in the <a href="/stamp-duty-calculator/">Stamp Duty calculator</a>.</p></div>`, true) +
      section(`<span class="step">REFUNDS</span><h2>Moving home before you have sold?</h2><p>If you buy a new main home before selling your old one, you usually have to pay the higher rates at completion. In all three nations you can normally claim the extra back if you sell your previous main home within three years (36 months).</p><p>If you are replacing your main residence and sell the old one on or before completion, the higher rates usually do not apply at all.</p>`) +
      section(`<span class="step">FREQUENT QUESTIONS</span><h2>Second-home Stamp Duty FAQs</h2>${faq([
        ["Does a buy-to-let count as a second home?", "Yes. Buying any additional residential property, including a buy-to-let or holiday home, usually triggers the higher rates."],
        ["What if I own a share of another property?", "Owning part of another home, including inherited shares above certain values, can count. Check the official guidance or ask your solicitor."],
        ["Do married couples count as one?", "Yes. Spouses and civil partners are usually treated as one unit, so a property owned by either of you counts."],
      ])}<p><a href="/money-guides/stamp-duty-scotland-lbtt/">LBTT in Scotland →</a> · <a href="/money-guides/stamp-duty-wales-ltt/">LTT in Wales →</a> · <a href="/money-guides/stamp-duty-300000-house/">Stamp Duty on £300,000 →</a></p><p class="source-note">Sources: <a href="https://www.gov.uk/stamp-duty-land-tax/residential-property-rates" target="_blank" rel="noopener noreferrer">GOV.UK SDLT</a> · <a href="https://revenue.scot/taxes/land-buildings-transaction-tax/additional-dwelling-supplement-ads" target="_blank" rel="noopener noreferrer">Revenue Scotland ADS</a> · <a href="https://www.gov.wales/land-transaction-tax-rates-and-bands" target="_blank" rel="noopener noreferrer">Welsh Revenue Authority</a>. Estimates for planning only.</p>`, true),
  });
}

// ---------------------------------------------------------------- student loans
function studentLoanGuide() {
  const plans = [["plan1", "Plan 1", "£26,900"], ["plan2", "Plan 2", "£29,385"], ["plan4", "Plan 4", "£33,795"], ["plan5", "Plan 5", "£25,000"], ["postgraduate", "Postgraduate", "£21,000"]];
  const salaries = [25000, 30000, 40000, 50000];
  const monthly = (plan, s) => F.studentLoan(s, plan) / 12;
  return page({
    slug: "student-loan-repayments",
    title: "Student Loan Repayments 2026/27: Thresholds & Monthly Amounts | WorthChex",
    description: "Student loan repayment thresholds for 2026/27 for Plan 1, 2, 4, 5 and Postgraduate loans, with how much you repay each month at common salaries.",
    eyebrow: "PAY GUIDE",
    h1: "Student loan repayments in 2026/27",
    lead: "You repay 9% of what you earn above your plan's threshold (6% for Postgraduate Loans). Below the threshold you pay nothing, and repayments come straight out of your pay.",
    body:
      section(`<span class="step">THRESHOLDS</span><h2>2026/27 repayment thresholds.</h2>${table(["Plan", "Who has it", "Annual threshold", "Rate"], [
        ["Plan 1", "England/Wales before 2012; Northern Ireland", "£26,900", "9%"],
        ["Plan 2", "England/Wales from 2012 to July 2023", "£29,385", "9%"],
        ["Plan 4", "Scotland", "£33,795", "9%"],
        ["Plan 5", "England, courses starting from August 2023", "£25,000", "9%"],
        ["Postgraduate", "Master's or Doctoral loan", "£21,000", "6%"],
      ])}<p>Repayments are worked out on pay after any salary sacrifice. If you have more than one plan, your employer applies them together; a Postgraduate Loan is repaid on top of an undergraduate plan.</p>`) +
      section(`<span class="step">HOW MUCH YOU REPAY</span><h2>Monthly repayments at common salaries.</h2>${table(["Salary", ...plans.map(p => p[1])], salaries.map(s => [comma(s), ...plans.map(([key]) => m2(monthly(key, s)))]))}
<div class="example-box"><strong>Example:</strong> on £40,000 with a Plan 2 loan you repay 9% of £10,615 (the amount above £29,385) = £955.35 a year, or about £79.61 a month.</div>
<div class="content-callout"><strong>See it on your payslip</strong><p>Add your plan in the <a href="/take-home-pay-calculator/">take-home pay calculator</a> to see your full monthly pay after tax, National Insurance and student loan.</p></div>`, true) +
      section(`<span class="step">FREQUENT QUESTIONS</span><h2>Student loan FAQs</h2>${faq([
        ["Is the threshold based on my annual salary?", "Payroll uses your pay in each period. The monthly threshold is the annual figure divided by 12, so a one-off bonus month can trigger a repayment even if your annual pay is below the threshold."],
        ["Does a pension reduce my student loan repayments?", "Only salary sacrifice does, because it lowers your pay. Net pay and relief-at-source pensions do not change the repayment."],
        ["Is the student loan like other debt?", "Not really. Repayments depend on income rather than the balance, and any balance left is written off after the plan's set period."],
      ])}<p><a href="/money-guides/40000-salary-take-home-pay/">£40k after tax →</a> · <a href="/money-guides/salary-after-tax/">Salary after tax explained →</a></p><p class="source-note">Source: <a href="https://www.gov.uk/repaying-your-student-loan/what-you-pay" target="_blank" rel="noopener noreferrer">GOV.UK: what you pay</a>. Estimates for planning only.</p>`, true),
  });
}

// ---------------------------------------------------------------- salary after tax hub
function salaryHub() {
  const list = [15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 80000, 90000, 100000, 110000, 125000, 150000];
  const rows = list.map(s => {
    const r = F.takeHomePay(s), sc = F.takeHomePay(s, { region: "scotland" });
    const label = SALARIES.includes(s) ? `<a href="/money-guides/${salarySlug(s)}/">${comma(s)}</a>` : comma(s);
    return [label, m0(r.tax + r.ni), m0(r.net), m0(r.monthly), m0(r.weekly), m0(sc.monthly)];
  });
  return page({
    slug: "salary-after-tax",
    title: `Salary After Tax UK ${YEAR}: Take-Home Pay Table £15k to £150k | WorthChex`,
    description: `UK salary after tax table for ${YEAR}: yearly, monthly and weekly take-home pay from £15,000 to £150,000, with Scotland figures, tax bands and how it is worked out.`,
    eyebrow: "PAY GUIDE",
    h1: `Salary after tax: UK take-home pay table for ${YEAR}`,
    lead: `Find your salary below to see what you take home each year, month and week after Income Tax and National Insurance. Figures are for the ${YEAR} tax year with a standard tax code and no pension or student loan.`,
    body:
      section(`<span class="step">TAKE-HOME PAY TABLE</span><h2>How much you take home at each salary.</h2>${table(["Salary", "Tax + NI a year", "Take-home a year", "A month", "A week", "A month in Scotland"], rows)}
<p class="source-note">England, Wales and Northern Ireland unless stated. Assumes tax code 1257L, National Insurance category A, and no pension, student loan or benefits in kind. Click a highlighted salary for a full breakdown.</p>
<div class="content-callout"><strong>Your exact take-home pay</strong><p>Add your pension, student loan and region in the <a href="/take-home-pay-calculator/">take-home pay calculator</a>.</p></div>`) +
      section(`<span class="step">THE RATES</span><h2>${YEAR} Income Tax and National Insurance rates.</h2><h3>Income Tax (England, Wales and Northern Ireland)</h3>${table(["Band", "Taxable income", "Rate"], [["Personal Allowance", "Up to £12,570", "0%"], ["Basic rate", "£12,571 to £50,270", "20%"], ["Higher rate", "£50,271 to £125,140", "40%"], ["Additional rate", "Over £125,140", "45%"]])}
<p>The Personal Allowance shrinks by £1 for every £2 of income over £100,000, so it is gone completely at £125,140.</p>
<h3>Income Tax in Scotland</h3>${table(["Band", "Income", "Rate"], [["Starter", "£12,571 to £16,537", "19%"], ["Basic", "£16,538 to £29,526", "20%"], ["Intermediate", "£29,527 to £43,662", "21%"], ["Higher", "£43,663 to £75,000", "42%"], ["Advanced", "£75,001 to £125,140", "45%"], ["Top", "Over £125,140", "48%"]])}
<h3>Employee National Insurance (category A)</h3>${table(["Earnings", "Rate"], [["Up to £12,570 a year", "0%"], ["£12,570 to £50,270", "8%"], ["Over £50,270", "2%"]])}`, true) +
      section(`<span class="step">HOW IT WORKS</span><h2>How take-home pay is worked out.</h2><ol class="guide-steps"><li>Take off the tax-free Personal Allowance (£12,570 for most people).</li><li>Tax the rest in slices: 20% on the first £37,700 of taxable income, then 40%, then 45%. Only the slice in each band is taxed at that rate.</li><li>Work out National Insurance separately: 8% between £12,570 and £50,270, then 2% above.</li><li>Take off any pension contribution and student loan repayment.</li><li>What is left is your take-home pay.</li></ol>
<div class="example-box"><strong>Example, £40,000:</strong> £27,430 is taxable, so Income Tax is £5,486. National Insurance is 8% of £27,430 = £2,194. Take-home pay is £32,320 a year, or £2,693 a month.</div>`) +
      section(`<span class="step">FREQUENT QUESTIONS</span><h2>Salary after tax FAQs</h2>${faq([
        ["Why is my take-home pay lower than this table?", "The table has no pension or student loan. A 5% workplace pension and a student loan can each reduce monthly pay by £100 or more. Your tax code, benefits in kind or other payroll deductions can also make a difference."],
        ["Does a pay rise ever reduce take-home pay?", "No. Tax is charged in bands, so moving into a higher band only affects the money above the threshold. Every pay rise increases take-home pay, although between £100,000 and £125,140 you keep only about 38p of each extra pound."],
        ["Is take-home pay different in Scotland?", "Yes. Scotland has six Income Tax bands. People earning under about £30,000 pay slightly less than elsewhere in the UK, and people earning more pay more. National Insurance is the same across the UK."],
        ["How do I work out my hourly rate?", "Divide your annual salary by the number of hours you work in a year. For a 37.5-hour week that is 1,950 hours, so £30,000 is about £15.38 an hour before tax."],
      ])}<p>Detailed guides: ${SALARIES.map(x => `<a href="/money-guides/${salarySlug(x)}/">${k(x)} after tax</a>`).join(" · ")} · <a href="/money-guides/student-loan-repayments/">Student loan repayments</a></p><p class="source-note">Sources: <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noopener noreferrer">GOV.UK Income Tax rates</a> · <a href="https://www.gov.uk/scottish-income-tax" target="_blank" rel="noopener noreferrer">Scottish Income Tax</a> · <a href="https://www.gov.uk/national-insurance/how-much-you-pay" target="_blank" rel="noopener noreferrer">GOV.UK National Insurance</a>. Estimates for planning only, not tax advice.</p>`, true),
  });
}

// ---------------------------------------------------------------- contact page
// Set the public contact address here (or pass CONTACT_EMAIL=...) to publish /contact/.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "worthchex.contact@gmail.com";
function contactPage(email) {
  const dir = path.join(ROOT, "contact");
  if (!email) return null;
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Contact WorthChex about a calculator result, a correction, a suggestion for a new tool or guide, or advertising and privacy questions."><meta name="robots" content="index, follow"><link rel="canonical" href="https://worthchex.com/contact/"><title>Contact WorthChex | WorthChex</title>
</head><body>
<nav class="navbar" aria-label="Main navigation"></nav>
<main id="main"><section class="about-section"><div class="about-inner"><div class="breadcrumbs"><a href="/">WorthChex</a> &nbsp;›&nbsp; Contact</div><span class="step">CONTACT</span><h1>Contact WorthChex</h1><p>Spotted a figure that looks wrong, or have an idea for a calculator or guide? We read every message.</p></div></section>
${section(`<span class="step">EMAIL</span><h2>Get in touch.</h2><p class="contact-email"><a href="mailto:${email}">${email}</a></p><p>We aim to reply within 3 working days.</p><div class="content-grid"><article class="content-card"><h3>Corrections</h3><p>Tell us which page, the figures you entered and what you expected. Accuracy matters to us: we check every report against the official source and fix confirmed errors quickly.</p></article><article class="content-card"><h3>Suggestions</h3><p>Ideas for new calculators, guides or features are very welcome, especially questions you could not find an answer to.</p></article><article class="content-card"><h3>Privacy and advertising</h3><p>Questions about cookies or ads? Read our <a href="/privacy/">privacy policy</a> first; it explains how Google advertising works on this site.</p></article></div>`)}
${section(`<span class="step">PLEASE NOTE</span><h2>What we can and cannot help with.</h2><ul><li>We cannot give personal financial, tax or legal advice, or comment on your individual situation. For free, impartial help, try <a href="https://www.moneyhelper.org.uk/" target="_blank" rel="noopener noreferrer">MoneyHelper</a> or <a href="https://www.citizensadvice.org.uk/" target="_blank" rel="noopener noreferrer">Citizens Advice</a>.</li><li>For questions about your own tax, contact <a href="https://www.gov.uk/contact-hmrc" target="_blank" rel="noopener noreferrer">HMRC</a>.</li><li>Please never send us bank details, passwords or other sensitive personal information.</li></ul>`, true)}
</main>
<footer></footer>
</body></html>
`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  return "contact";
}

const made = [salaryHub(), ...SALARIES.map(salaryGuide), lbttGuide(), lttGuide(), secondHomeGuide(), studentLoanGuide(),
  ...require("./guides-evergreen.js")({ page, section, table, faq, stats, F, m0, m2, comma }), contactPage(CONTACT_EMAIL)].filter(Boolean);
console.log("Built guides:", made.join(", "));
