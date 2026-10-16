#!/usr/bin/env node
/* Builds the WorthChex homepage body from the calculator engine, so every
   figure on the homepage matches the calculators and guides.
   Run from the repository root:  node tools/build-home.js && python3 tools/apply-layout.py */
"use strict";
const fs = require("fs");
const path = require("path");
const F = require("../financial-suite-v4.js");
const S = require("../calculator-suite-final.js");

const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "index.html");
const m0 = v => F.money(v, 0);

const guideCount = fs.readdirSync(path.join(ROOT, "money-guides"), { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(ROOT, "money-guides", d.name, "index.html"))).length;

const t30 = F.takeHomePay(30000), t100 = F.takeHomePay(100000), t35 = F.takeHomePay(35000);
const mort = S.mortgagePlan(200000, 4.5, 25, 0);
const save = S.monthlyFutureValue(0, 500, 4, 12);
const card = 3000 * S.aprMonthly(24.9);
const ftb = F.sdlt(300000, { firstTime: true }).tax, std = F.sdlt(300000).tax;

const answers = [
  ["£30,000 salary after tax", `${m0(t30.monthly)}`, "a month in England, Wales or NI", "/money-guides/30k-after-tax/"],
  ["Stamp Duty on a £300,000 home", m0(std), `${m0(ftb)} for first-time buyers`, "/money-guides/stamp-duty-300000-house/"],
  ["£200,000 mortgage at 4.5%", m0(mort.payment), "a month over 25 years", "/money-guides/how-much-mortgage-can-i-afford/"],
  ["Saving £500 a month at 4%", m0(save), "after one year", "/money-guides/how-long-save-500-per-month/"],
  ["£3,000 on a 24.9% credit card", m0(card), "a month in interest alone", "/money-guides/how-does-debt-interest-work/"],
  ["£100,000 salary after tax", m0(t100.monthly), "a month, and the 60% tax trap", "/money-guides/100k-after-tax/"],
];

const calcs = [
  ["/take-home-pay-calculator/", "Take-home pay", "Your pay after tax, NI, pension and student loan."],
  ["/mortgage-calculator/", "Mortgage", "Monthly payments, total interest and overpayments."],
  ["/stamp-duty-calculator/", "Stamp Duty", "England, Scotland, Wales and NI, every buyer type."],
  ["/salary-calculator/", "Salary & pay rise", "What a new salary or pay rise is worth each month."],
  ["/savings-calculator/", "Savings goal", "How long to reach a target, or how much to save."],
  ["/debt-payoff-calculator/", "Debt payoff", "Your debt-free date and how to get there sooner."],
  ["/affordability-calculator/", "Affordability", "Check a new payment against your whole budget."],
  ["/car-finance-calculator/", "Car finance", "HP and PCP payments, interest and total cost."],
  ["/personal-loan-calculator/", "Personal loan", "Monthly cost and total repaid at any APR."],
  ["/compound-interest-calculator/", "Compound interest", "Watch savings grow year by year."],
  ["/vat-calculator/", "VAT", "Add or remove VAT at 20%, 5% or any rate."],
];

const guides = [
  ["PAY", "Salary after tax: the full UK table", `Take-home pay for every salary from £15,000 to £150,000 in 2026/27.`, "/money-guides/salary-after-tax/"],
  ["PROPERTY", "How much mortgage can I afford?", "What you could borrow on your salary, and what it would cost each month.", "/money-guides/how-much-mortgage-can-i-afford/"],
  ["PROPERTY", "First-time buyer Stamp Duty", "Pay nothing up to £300,000. See exactly what you would owe above that.", "/money-guides/first-time-buyer-stamp-duty/"],
  ["MORTGAGE", "Is overpaying your mortgage worth it?", "£100 a month extra can save over £20,000 in interest.", "/money-guides/mortgage-overpayment-worth-it/"],
  ["PAY", "Salary sacrifice explained", "Why £100 into your pension can cost you as little as £58.", "/money-guides/salary-sacrifice-explained/"],
  ["SAVING", "How much emergency fund do I need?", "A simple target based on your bills, and how fast to build it.", "/money-guides/emergency-fund-how-much/"],
];

const faqs = [
  ["Are the calculators really free?", "Yes. Every calculator and guide is free, with no sign-up. The site is funded by advertising."],
  ["Are the figures up to date?", "The tax calculators use 2026/27 rules for Income Tax, National Insurance, student loans and Stamp Duty across England, Scotland, Wales and Northern Ireland. Every page shows when it was last reviewed and links to the official source."],
  ["Do you store the numbers I type in?", "No. Calculations run in your browser and your figures are not sent to WorthChex. See the privacy policy for how cookies and ads work."],
  ["Is this financial advice?", "No. WorthChex gives estimates to help you plan and compare. For big decisions, check with the official source or a regulated adviser."],
];

const tick = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.5 3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const arrow = '<span aria-hidden="true">→</span>';

const body = `<!-- home:start -->
<main id="main" class="hp">
<section class="hp-hero">
  <div class="hp-hero-inner">
    <div class="hp-hero-copy">
      <span class="hp-badge">Free UK money calculators · 2026/27</span>
      <h1>Know your money numbers <span>in seconds.</span></h1>
      <p class="hp-lead">Work out your take-home pay, mortgage costs, Stamp Duty, savings and debt with up-to-date UK rules, and see exactly how each figure is worked out.</p>
      <ul class="hp-ticks">
        <li>${tick}Free, no sign-up</li>
        <li>${tick}Updated for 2026/27</li>
        <li>${tick}Figures stay in your browser</li>
        <li>${tick}Plain-English guides</li>
      </ul>
      <div class="hp-chips" aria-label="Popular calculators">
        <a href="/mortgage-calculator/">Mortgage</a><a href="/stamp-duty-calculator/">Stamp Duty</a><a href="/salary-calculator/">Pay rise</a><a href="/savings-calculator/">Savings</a><a href="/debt-payoff-calculator/">Debt</a>
      </div>
    </div>

    <form class="hp-quick" id="hp-quick" aria-labelledby="hp-quick-title" onsubmit="return false">
      <div class="hp-quick-head"><h2 id="hp-quick-title">What will I take home?</h2><span>2026/27</span></div>
      <label for="hp-salary">Your yearly salary</label>
      <div class="hp-money"><span>£</span><input id="hp-salary" type="number" inputmode="numeric" min="0" step="500" value="35000" aria-describedby="hp-note"></div>
      <div class="hp-row">
        <div><label for="hp-region">Where you live</label><select id="hp-region"><option value="rUK">England, Wales, NI</option><option value="scotland">Scotland</option></select></div>
        <div><label for="hp-loan">Student loan</label><select id="hp-loan"><option value="none">None</option><option value="plan1">Plan 1</option><option value="plan2">Plan 2</option><option value="plan4">Plan 4</option><option value="plan5">Plan 5</option></select></div>
      </div>
      <div class="hp-result" aria-live="polite">
        <span class="hp-result-label">Take-home pay a month</span>
        <strong id="hp-month">${m0(t35.monthly)}</strong>
        <div class="hp-split"><span><b id="hp-year">${m0(t35.net)}</b> a year</span><span><b id="hp-week">${m0(t35.weekly)}</b> a week</span></div>
        <div class="hp-bar" aria-hidden="true"><i id="hp-bar-net"></i><i id="hp-bar-tax"></i><i id="hp-bar-ni"></i><i id="hp-bar-sl"></i></div>
        <ul class="hp-legend">
          <li><i class="k-net"></i>Take-home</li>
          <li><i class="k-tax"></i>Income Tax <b id="hp-tax">${m0(t35.tax)}</b></li>
          <li><i class="k-ni"></i>NI <b id="hp-ni">${m0(t35.ni)}</b></li>
          <li id="hp-sl-row" hidden><i class="k-sl"></i>Student loan <b id="hp-sl">£0</b></li>
        </ul>
      </div>
      <a class="hp-cta" href="/take-home-pay-calculator/">Full breakdown with pension &amp; more ${arrow}</a>
      <p class="hp-note" id="hp-note">Standard 1257L tax code, no pension.</p>
    </form>
  </div>
</section>

<section class="hp-section">
  <div class="hp-wrap">
    <div class="hp-head"><span class="step">QUICK ANSWERS</span><h2>The numbers people look up most.</h2><p>Real 2026/27 figures, worked out with the same calculators you can use below.</p></div>
    <div class="hp-answers">
${answers.map(([q, v, note, href]) => `      <a class="hp-answer" href="${href}"><span>${q}</span><strong>${v}</strong><small>${note}</small><em>See the working ${arrow}</em></a>`).join("\n")}
    </div>
  </div>
</section>

<section class="hp-section hp-alt" id="calculators">
  <div class="hp-wrap">
    <div class="hp-head"><span class="step">CALCULATORS</span><h2>Pick the question you need answered.</h2><p>${calcs.length} free calculators covering pay, property, borrowing and saving.</p></div>
    <div class="tool-grid hp-tools">
${calcs.map(([href, name, desc]) => `      <a href="${href}" class="tool-card"><span class="tool-card-icon"></span><strong>${name}</strong><span>${desc}</span></a>`).join("\n")}
      <a href="/calculators/" class="tool-card hp-tool-all"><span class="tool-card-icon"></span><strong>All calculators</strong><span>Browse everything in one place.</span></a>
    </div>
  </div>
</section>

<section class="hp-section">
  <div class="hp-wrap">
    <div class="hp-head hp-head-row"><div><span class="step">MONEY GUIDES</span><h2>Clear answers, with real numbers.</h2></div><a class="hp-more" href="/money-guides/">All ${guideCount} guides ${arrow}</a></div>
    <div class="hp-guides">
${guides.map(([tag, title, desc, href]) => `      <a class="hp-guide" href="${href}"><span class="hp-tag">${tag}</span><strong>${title}</strong><span>${desc}</span></a>`).join("\n")}
    </div>
  </div>
</section>

<section class="hp-section hp-alt">
  <div class="hp-wrap">
    <div class="hp-head"><span class="step">WHY WORTHCHEX</span><h2>Built to be trusted with your numbers.</h2></div>
    <div class="hp-why">
      <article><h3>Shows its working</h3><p>Every result comes with the steps, the rates used and a link to the official source, so you can check it yourself.</p></article>
      <article><h3>Tested on every change</h3><p>Automated checks compare our calculators with answers worked out by hand, such as ${m0(F.takeHomePay(40000).net)} take-home on a £40,000 salary. <a href="/methodology/">How we check</a>.</p></article>
      <article><h3>Private by design</h3><p>No account, no bank details. The numbers you type are worked out in your browser and never sent to us.</p></article>
    </div>
  </div>
</section>

<section class="hp-section">
  <div class="hp-wrap hp-narrow">
    <div class="hp-head"><span class="step">QUESTIONS</span><h2>Frequently asked questions</h2></div>
    <div class="faq-list">
${faqs.map(([q, a]) => `      <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
    </div>
  </div>
</section>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) })}</script>
</main>
<script src="/financial-suite-v4.js?v=20261016b"></script>
<script>
(function () {
  var F = window.WorthChexFinancial; if (!F) return;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (v) { return "£" + Math.round(v).toLocaleString("en-GB"); };
  function run() {
    var salary = Math.max(0, Math.min(10000000, parseFloat($("hp-salary").value) || 0));
    var loan = $("hp-loan").value;
    var r = F.takeHomePay(salary, { region: $("hp-region").value, studentPlan: loan === "none" ? undefined : loan });
    var sl = (r.student || 0) + (r.postgrad || 0);
    $("hp-month").textContent = fmt(r.net / 12);
    $("hp-year").textContent = fmt(r.net);
    $("hp-week").textContent = fmt(r.net / 52);
    $("hp-tax").textContent = fmt(r.tax);
    $("hp-ni").textContent = fmt(r.ni);
    $("hp-sl").textContent = fmt(sl);
    $("hp-sl-row").hidden = sl <= 0;
    var total = salary || 1;
    $("hp-bar-net").style.width = (r.net / total * 100) + "%";
    $("hp-bar-tax").style.width = (r.tax / total * 100) + "%";
    $("hp-bar-ni").style.width = (r.ni / total * 100) + "%";
    $("hp-bar-sl").style.width = (sl / total * 100) + "%";
  }
  ["hp-salary", "hp-region", "hp-loan"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
  run();
})();
</script>
<!-- home:end -->`;

let html = fs.readFileSync(FILE, "utf8");
const start = html.indexOf("<!-- /wc:header -->") + "<!-- /wc:header -->".length;
const end = html.indexOf("<!-- wc:footer -->");
if (start < 20 || end < start) throw new Error("index.html markers not found");
html = html.slice(0, start) + "\n" + body + "\n" + html.slice(end);
html = html.replace(/<title>[^<]*<\/title>/, "<title>Free UK Money Calculators 2026/27: Take-Home Pay, Mortgage &amp; Stamp Duty | WorthChex</title>");
html = html.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="Free UK money calculators for 2026/27: take-home pay, salary, mortgage, Stamp Duty, savings, debt, car finance and VAT. Instant answers with the working shown and plain-English guides."');
fs.writeFileSync(FILE, html);
console.log(`Homepage built (${guideCount} guides).`);
