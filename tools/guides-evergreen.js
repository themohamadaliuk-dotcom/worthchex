/* Evergreen money guides (mortgages, loans, savings, budgeting, pay).
   Every £ figure on these pages is computed from the same engine the
   calculators use, so the guides and the tools can never disagree.
   Called from tools/build-guides.js. */
"use strict";
const S = require("../calculator-suite-final.js");

module.exports = function buildEvergreen(h) {
  const { page, section, table, faq, stats, F, m0, m2, comma } = h;
  const pct = (v, d = 0) => `${Number(v).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
  const dur = months => {
    const y = Math.floor(months / 12), mo = months % 12;
    const ys = y ? `${y} year${y === 1 ? "" : "s"}` : "";
    const ms = mo ? `${mo} month${mo === 1 ? "" : "s"}` : "";
    return [ys, ms].filter(Boolean).join(" ") || "0 months";
  };
  const loan = (p, apr, months) => S.amortise(p, S.aprToNominal(apr), months);
  const take = (s, o) => F.takeHomePay(s, o);
  const src = links => `<p class="source-note">${links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`).join(" · ")}. Figures are worked examples for planning, not financial advice.</p>`;
  const related = links => `<p class="related-links">${links.map(([t, u]) => `<a href="${u}">${t} →</a>`).join(" · ")}</p>`;
  const callout = (title, html) => `<div class="content-callout"><strong>${title}</strong><p>${html}</p></div>`;
  const example = html => `<div class="example-box">${html}</div>`;
  const G = opts => page({ meta: "evergreen", ...opts });
  // Months to reach a target saving a fixed amount each month at a nominal annual rate (monthly compounding).
  const monthsToTarget = (target, monthly, rate, start = 0) => {
    let b = start, n = 0; const r = rate / 100 / 12;
    while (b < target && n < 1200) { b = b * (1 + r) + monthly; n += 1; }
    return n;
  };
  const built = [];

  // ------------------------------------------------------------ 1. mortgage affordability
  {
    const RATE = 4.5, TERM = 25, MULT = 4.5;
    const sal = [25000, 30000, 40000, 50000, 60000, 80000];
    const rows = sal.map(s => {
      const borrow = s * MULT, pay = S.mortgagePlan(borrow, RATE, TERM, 0).payment, hi = S.mortgagePlan(borrow, RATE + 2, TERM, 0).payment, th = take(s).monthly;
      return [comma(s), m0(borrow), m0(pay), m0(th), pct(pay / th * 100), m0(hi)];
    });
    const b40 = 40000 * MULT, p40 = S.mortgagePlan(b40, RATE, TERM, 0).payment, t40 = take(40000).monthly;
    const joint = 35000 + 30000, jb = joint * MULT, jp = S.mortgagePlan(jb, RATE, TERM, 0).payment, jt = take(35000).monthly + take(30000).monthly;
    const deps = [0.05, 0.1, 0.15, 0.25].map(d => { const price = Math.floor(b40 / (1 - d)); return [pct(d * 100), comma(price), m0(price - b40), m0(F.sdlt(price, { firstTime: true }).tax), m0(F.sdlt(price).tax)]; });
    built.push(G({
      slug: "how-much-mortgage-can-i-afford",
      title: "How Much Mortgage Can I Afford in the UK? 2026 Examples by Salary | WorthChex",
      description: `How much can you borrow on a mortgage in the UK? Lenders often lend about 4.5 times income: £180,000 on a £40,000 salary, costing about ${m0(p40)} a month at 4.5%. See figures for £25k to £80k.`,
      eyebrow: "MORTGAGE GUIDE",
      h1: "How much mortgage can I afford?",
      lead: `Most UK lenders will lend around <strong>4 to 4.5 times your yearly income</strong>. On a £40,000 salary that is about <strong>${m0(b40)}</strong>, which costs roughly <strong>${m0(p40)} a month</strong> at 4.5% over 25 years. Whether that is <em>comfortable</em> depends on your take-home pay and other costs.`,
      body:
        section(`<span class="step">THE QUICK ANSWER</span><h2>A £40,000 salary, worked through.</h2>${stats([["Typical maximum loan", m0(b40), "4.5 × £40,000"], ["Monthly payment", m0(p40), `${RATE}% over ${TERM} years`], ["Take-home pay", `${m0(t40)}/mo`, "after tax and NI"], ["Share of take-home", pct(p40 / t40 * 100), "mortgage payment"]])}
<p>A lender's maximum is a ceiling, not a target. Many people aim to keep the mortgage payment below roughly <strong>30–35% of take-home pay</strong>, so there is room for bills, food, childcare, saving and the occasional surprise.</p>`) +
        section(`<span class="step">BY SALARY</span><h2>How much you could borrow on different salaries.</h2><p>Single applicant, 4.5 × income, repayment mortgage over ${TERM} years. The last column shows the payment if rates were 2 percentage points higher, a useful stress test when your fixed deal ends.</p>
${table(["Salary", "Borrow (4.5×)", `Payment at ${RATE}%`, "Take-home a month", "Payment ÷ take-home", `Payment at ${RATE + 2}%`], rows)}
<p>Notice the pattern: borrowing the full 4.5× puts every salary above the 30–35% comfort zone, and the share rises with income because higher earners lose more of each extra pound to tax. That is why a lender can say “yes” to an amount that would leave a household stretched.</p>
${example(`<strong>Joint example:</strong> two buyers earning £35,000 and £30,000 have a combined income of ${comma(joint)}. At 4.5× they could borrow about <strong>${m0(jb)}</strong>, costing ${m0(jp)} a month. Their combined take-home pay is about ${m0(jt)} a month, so the mortgage would be ${pct(jp / jt * 100)} of it.`)}`, true) +
        section(`<span class="step">DEPOSIT</span><h2>What price can you buy with a ${m0(b40)} mortgage?</h2><p>Your deposit adds to the amount you can borrow. Here is what a ${m0(b40)} mortgage buys with different deposits, and the Stamp Duty you would pay in England or Northern Ireland:</p>
${table(["Deposit", "Property price", "Deposit needed", "Stamp Duty (first-time buyer)", "Stamp Duty (home mover)"], deps)}
<p>A bigger deposit also lowers your <strong>loan-to-value (LTV)</strong>. Rates usually improve at each 5% step, most noticeably below 90%, 85%, 75% and 60% LTV, which can cut the monthly payment further.</p>`) +
        section(`<span class="step">WHAT LENDERS CHECK</span><h2>It is not just the income multiple.</h2><ul><li><strong>Your outgoings:</strong> lenders look at bank statements for childcare, loans, car finance, credit cards and regular spending. A £300 a month car payment can reduce the maximum loan by tens of thousands of pounds.</li><li><strong>A stressed rate:</strong> lenders check you could still pay if rates rose above your starting rate.</li><li><strong>Credit history:</strong> missed payments, high card balances and recent applications can reduce what you are offered.</li><li><strong>Income type:</strong> bonuses, overtime and self-employed income are often only partly counted, or averaged over two years.</li><li><strong>Higher multiples:</strong> some lenders go to 5 or 5.5 times income for higher earners or certain professions, usually with a bigger deposit.</li></ul>`, true) +
        section(`<span class="step">THE OTHER COSTS</span><h2>Budget for more than the deposit.</h2>${table(["Cost", "Typical range", "When"], [["Stamp Duty", "£0 for many first-time buyers; see table above", "On completion"], ["Conveyancing (solicitor)", "about £1,000–£2,000", "During the purchase"], ["Survey", "about £400–£1,500", "Before exchange"], ["Mortgage arrangement fee", "£0–£1,500", "With the application or added to the loan"], ["Moving and furnishing", "varies widely", "First few months"]])}
<p>Once you own the home, set aside money for buildings insurance, maintenance and repairs. A common rule of thumb is around 1% of the property's value a year.</p>${callout("Test your own numbers", `Use the <a href="/mortgage-calculator/">mortgage calculator</a> to try different rates and terms, the <a href="/affordability-calculator/">affordability calculator</a> to check your whole budget, and the <a href="/stamp-duty-calculator/">Stamp Duty calculator</a> for the tax.`)}`) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Mortgage affordability FAQs</h2>${faq([
          ["How much can I borrow on a £30,000 salary?", `At 4.5 times income, about ${m0(135000)}. At ${RATE}% over ${TERM} years that costs ${m0(S.mortgagePlan(135000, RATE, TERM, 0).payment)} a month, against take-home pay of about ${m0(take(30000).monthly)}.`],
          ["Does a longer term help?", `It lowers the payment but costs more overall. ${m0(b40)} at ${RATE}% costs ${m0(S.mortgagePlan(b40, RATE, 25, 0).payment)} a month over 25 years (${m0(S.mortgagePlan(b40, RATE, 25, 0).interest)} interest) or ${m0(S.mortgagePlan(b40, RATE, 35, 0).payment)} over 35 years (${m0(S.mortgagePlan(b40, RATE, 35, 0).interest)} interest).`],
          ["Should I use gross or take-home pay?", "Lenders use gross income for the multiple. For your own budget, take-home pay is what matters, because that is the money you actually have each month."],
          ["Can WorthChex tell me what a lender will offer?", "No. Each lender has its own criteria. Our figures show what a loan would cost so you can decide what is comfortable before you speak to a lender or broker."],
        ])}${related([["Mortgage calculator", "/mortgage-calculator/"], ["Is overpaying worth it?", "/money-guides/mortgage-overpayment-worth-it/"], ["10% deposit on £300,000", "/money-guides/what-is-10-percent-deposit-300000-house/"], ["First-time buyer Stamp Duty", "/money-guides/first-time-buyer-stamp-duty/"]])}${src([["MoneyHelper: how much can I borrow?", "https://www.moneyhelper.org.uk/en/homes/buying-a-home/how-much-can-i-afford-to-borrow-for-a-mortgage"], ["GOV.UK Stamp Duty rates", "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 2. mortgage overpayment
  {
    const P = 200000, R = 4.5, T = 25;
    const base = S.mortgagePlan(P, R, T, 0);
    const rows = [50, 100, 200, 300, 500].map(x => { const o = S.mortgagePlan(P, R, T, x); return [`£${x}`, m2(o.payment), dur(o.periods), m0(o.interest), m0(base.interest - o.interest), dur(base.periods - o.periods)]; });
    const o100 = S.mortgagePlan(P, R, T, 100), o200 = S.mortgagePlan(P, R, T, 200);
    // £10,000 lump sum after 5 years, keeping the same payment.
    const sched = (lumpMonth, lump) => { let b = P, i = 0, n = 0; const r = R / 100 / 12; while (b > 0.005 && n < 600) { const int = b * r; i += int; b = b + int - Math.min(base.payment, b + int); n += 1; if (n === lumpMonth) b = Math.max(0, b - lump); } return { interest: i, months: n }; };
    const lump = sched(60, 10000);
    const gross = (rate, tax) => rate / (1 - tax);
    built.push(G({
      slug: "mortgage-overpayment-worth-it",
      title: "Is Overpaying Your Mortgage Worth It? Real UK Examples | WorthChex",
      description: `Overpaying £100 a month on a £200,000 mortgage at 4.5% saves about ${m0(base.interest - o100.interest)} in interest and clears it ${dur(base.periods - o100.periods)} early. See £50 to £500 examples, lump sums and when saving is better.`,
      eyebrow: "MORTGAGE GUIDE",
      h1: "Is overpaying your mortgage worth it?",
      lead: `Usually, yes, if you have no expensive debts and a cash buffer. On a ${m0(P)} mortgage at ${R}% over ${T} years, an extra <strong>£100 a month saves about ${m0(base.interest - o100.interest)}</strong> in interest and clears the loan <strong>${dur(base.periods - o100.periods)} early</strong>.`,
      body:
        section(`<span class="step">THE NUMBERS</span><h2>What regular overpayments save.</h2>${stats([["Normal payment", m2(base.payment), `${m0(P)}, ${R}%, ${T} years`], ["Total interest", m0(base.interest), "with no overpayments"], ["Overpay £200 a month", `−${m0(base.interest - o200.interest)}`, "interest saved"], ["Mortgage-free", `${dur(base.periods - o200.periods)} sooner`, "with £200 a month"]])}
${table(["Extra a month", "New payment", "Paid off in", "Total interest", "Interest saved", "Time saved"], rows)}
<p class="source-note">Assumes the rate stays at ${R}% for the whole term and the overpayment starts from month one. In real life your rate will change when deals end, but the pattern holds: money paid early saves interest for every remaining year.</p>`) +
        section(`<span class="step">LUMP SUMS</span><h2>What about a one-off payment?</h2>${example(`<strong>Example:</strong> paying a <strong>£10,000</strong> lump sum after 5 years, while keeping the same monthly payment, saves about <strong>${m0(base.interest - lump.interest)}</strong> in interest and finishes the mortgage ${dur(base.periods - lump.months)} early.`)}
<p>Most lenders let you overpay up to <strong>10% of the balance each year</strong> without a charge during a fixed or tracker deal. Go above that and you may pay an <strong>early repayment charge (ERC)</strong>, often 1–5% of the excess. Check your mortgage offer, or wait until your deal ends, when overpayments are usually unlimited.</p>
<p>When you overpay, many lenders ask whether you want to <strong>shorten the term</strong> or <strong>lower the monthly payment</strong>. Shortening the term saves the most interest; lowering the payment gives you more breathing room each month.</p>`, true) +
        section(`<span class="step">OVERPAY OR SAVE?</span><h2>Compare it with what your savings earn after tax.</h2><p>Overpaying a ${R}% mortgage is like earning a guaranteed, tax-free ${R}% return. To beat it, a savings account would need to pay more than this <em>after tax</em>:</p>
${table(["Your situation", "Savings rate needed to beat overpaying"], [["Interest still within your Personal Savings Allowance, or in an ISA", pct(R, 1)], ["Basic-rate taxpayer, allowance used up (20% tax)", pct(gross(R, 0.2), 2)], ["Higher-rate taxpayer, allowance used up (40% tax)", pct(gross(R, 0.4), 2)]])}
<p>The Personal Savings Allowance lets basic-rate taxpayers earn £1,000 of interest a year tax-free, and higher-rate taxpayers £500. Interest inside an ISA is always tax-free.</p>`) +
        section(`<span class="step">WHEN NOT TO OVERPAY</span><h2>Do these first.</h2><ol class="guide-steps"><li><strong>Clear expensive debt.</strong> A credit card at 24.9% APR costs far more than a ${R}% mortgage. Every £100 there saves much more.</li><li><strong>Build an emergency fund.</strong> Money paid into a mortgage is hard to get back. Keep 3–6 months of essential costs in easy-access savings. See <a href="/money-guides/emergency-fund-how-much/">how much to keep</a>.</li><li><strong>Take any free pension money.</strong> If your employer matches extra contributions, that match usually beats overpaying.</li><li><strong>Check the ERC.</strong> Stay within the 10% allowance unless the saving clearly outweighs the charge.</li></ol>${callout("Try your own mortgage", `Enter your balance, rate and overpayment in the <a href="/mortgage-calculator/">mortgage calculator</a> to see your exact interest and time saved.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Mortgage overpayment FAQs</h2>${faq([
          ["Is it better to overpay monthly or in a lump sum?", "The earlier money goes in, the more it saves. A regular monthly overpayment from today usually saves more than saving up and paying a lump sum later, as long as you stay within your lender's limit."],
          ["Does overpaying reduce my monthly payment?", "Only if you ask the lender to recalculate. Otherwise most lenders keep the payment the same and the mortgage simply ends sooner."],
          ["Does overpaying help when I remortgage?", "Yes. A lower balance means a lower loan-to-value, which can qualify you for better rates at your next deal."],
          ["Can I get overpayments back?", "Some flexible mortgages let you borrow back overpayments, but most do not. Treat overpaid money as locked away."],
        ])}${related([["Mortgage calculator", "/mortgage-calculator/"], ["Cost of a £300,000 mortgage", "/money-guides/how-much-does-300000-mortgage-cost/"], ["How much mortgage can I afford?", "/money-guides/how-much-mortgage-can-i-afford/"]])}${src([["MoneyHelper: overpaying your mortgage", "https://www.moneyhelper.org.uk/en/homes/buying-a-home/should-you-pay-off-your-mortgage-early"], ["GOV.UK Personal Savings Allowance", "https://www.gov.uk/apply-tax-free-interest-on-savings"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 3. loan costs
  {
    const P = 10000;
    const aprs = [5.9, 7.9, 9.9, 14.9, 19.9, 29.9];
    const byApr = aprs.map(a => { const l = loan(P, a, 60); return [pct(a, 1), m2(l.payment), m0(l.interest), m0(l.total)]; });
    const terms = [24, 36, 48, 60, 84];
    const byTerm = terms.map(t => { const l = loan(P, 7.9, t); return [dur(t), m2(l.payment), m0(l.interest), m0(l.total)]; });
    const l5 = loan(P, 7.9, 60), l7 = loan(P, 7.9, 84);
    const l79 = loan(P, 7.9, 60), l149 = loan(P, 14.9, 60);
    built.push(G({
      slug: "understanding-loan-costs",
      title: "How Much Does a £10,000 Loan Cost? APR, Term & Fees Explained | WorthChex",
      description: `A £10,000 loan over 5 years at 7.9% APR costs about ${m2(l5.payment)} a month and ${m0(l5.interest)} in interest. See how APR, term and fees change the total cost of UK personal loans.`,
      eyebrow: "BORROWING GUIDE",
      h1: "Understanding loan costs: APR, term and total repayment",
      lead: `A loan's real cost is the <strong>total you repay</strong>, not the monthly payment. A ${m0(P)} loan over 5 years at 7.9% APR costs <strong>${m2(l5.payment)} a month</strong> and <strong>${m0(l5.interest)} in interest</strong>. Stretch it to 7 years and the payment falls to ${m2(l7.payment)}, but interest rises to ${m0(l7.interest)}.`,
      body:
        section(`<span class="step">APR MATTERS</span><h2>${m0(P)} over 5 years at different APRs.</h2>${table(["APR", "Monthly payment", "Total interest", "Total repaid"], byApr)}
<p>The difference between a good and a poor rate is large. At 14.9% APR you would pay ${m0(l149.interest - l79.interest)} more in interest than at 7.9%, for exactly the same loan.</p>`) +
        section(`<span class="step">TERM MATTERS</span><h2>${m0(P)} at 7.9% APR over different terms.</h2>${table(["Term", "Monthly payment", "Total interest", "Total repaid"], byTerm)}
<p>A longer term makes each payment smaller but keeps the debt for longer, so you pay interest for more months. Choose the shortest term whose payment fits comfortably in your <a href="/money-guides/how-to-build-a-household-budget/">budget</a>.</p>`, true) +
        section(`<span class="step">READING A LOAN ADVERT</span><h2>What the terms mean.</h2><ul><li><strong>APR (Annual Percentage Rate):</strong> the yearly cost including interest and any compulsory fees, so it is the fairest way to compare loans.</li><li><strong>Representative APR:</strong> the rate at least 51% of successful applicants get. Up to 49% can be offered a higher rate, so always check your personal quote.</li><li><strong>Soft search / eligibility checker:</strong> shows likely rates without affecting your credit score. Use it before a full application.</li><li><strong>Total amount repayable:</strong> everything you will pay back. Compare this figure between offers.</li><li><strong>Early settlement:</strong> you have a legal right to repay early. Lenders can charge a limited amount of extra interest, usually up to 58 days' worth.</li></ul>
<p>Rates are often lowest for loans between about £7,500 and £25,000. Borrowing slightly more to reach a cheaper rate band can occasionally cost less overall, but only borrow what you need.</p>${callout("Compare your own loan", `Try different amounts, APRs and terms in the <a href="/personal-loan-calculator/">personal loan calculator</a>.`)}`) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Loan cost FAQs</h2>${faq([
          ["How is the monthly payment worked out?", `Personal loans use a fixed payment that covers that month's interest plus some of the balance. In month one on ${m0(P)} at 7.9% APR, about ${m2(P * S.aprMonthly(7.9))} of the ${m2(l5.payment)} payment is interest; by the final year almost all of it repays the balance.`],
          ["Is it cheaper to pay a loan off early?", "Usually yes. You stop paying interest on the money you repay, minus any early settlement charge, which is capped by law."],
          ["What is the difference between APR and interest rate?", "The interest rate is just the charge on the money borrowed. APR also includes compulsory fees and shows the cost as a yearly rate, so two loans with the same interest rate can have different APRs."],
          ["Is a 0% credit card cheaper than a loan?", "It can be, if you clear the balance before the 0% period ends and the transfer fee is low. If not, the rate afterwards is often much higher than a personal loan."],
        ])}${related([["Personal loan calculator", "/personal-loan-calculator/"], ["How debt interest works", "/money-guides/how-does-debt-interest-work/"], ["Paying off £5,000 of debt", "/money-guides/how-long-to-pay-off-5000-debt/"]])}${src([["FCA: understanding APR", "https://www.fca.org.uk/consumers/credit-cards"], ["MoneyHelper: personal loans", "https://www.moneyhelper.org.uk/en/everyday-money/credit/personal-loans"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 4. compound interest
  {
    const cg = (starting, contribution, annualRate, years, cf = 12) => F.compoundGrowth({ starting, contribution, annualRate, years, compoundingFrequency: cf });
    const lumpRows = [1, 5, 10, 20, 30].map(y => { const r = cg(10000, 0, 4, y); return [`${y} year${y > 1 ? "s" : ""}`, m0(r.finalValue), m0(r.interest)]; });
    const regRows = [10, 20, 30].map(y => { const a = cg(0, 200, 4, y), b = cg(0, 200, 7, y); return [`${y} years`, m0(a.totalContributions), m0(a.finalValue), m0(b.finalValue), pct(b.interest / b.finalValue * 100)]; });
    const simple = 10000 * (1 + 0.05 * 20), annual = cg(10000, 0, 5, 20, 1).finalValue, monthly = cg(10000, 0, 5, 20, 12).finalValue;
    // Early starter: £200 a month for 10 years then stops; late starter: £200 a month for 30 years. 6% a year, monthly compounding.
    const r6 = 0.06 / 12; let early = 0, late = 0;
    for (let m = 1; m <= 480; m++) { early = early * (1 + r6) + (m <= 120 ? 200 : 0); late = late * (1 + r6) + (m > 120 ? 200 : 0); }
    const doubling = rate => (Math.log(2) / Math.log(1 + rate / 100)).toFixed(1);
    built.push(G({
      slug: "compound-interest-explained",
      title: "Compound Interest Explained With Real UK Examples | WorthChex",
      description: `Compound interest means earning interest on your interest. £10,000 at 4% grows to about ${m0(cg(10000, 0, 4, 20).finalValue)} in 20 years, and £200 a month at 7% becomes ${m0(cg(0, 200, 7, 30).finalValue)} in 30 years. See the tables and the rule of 72.`,
      eyebrow: "SAVINGS GUIDE",
      h1: "Compound interest explained, with real numbers",
      lead: `Compound interest is interest earned on your interest. Each year's growth is added to the balance, so next year you earn on a bigger amount. <strong>£10,000 at 4% becomes about ${m0(cg(10000, 0, 4, 20).finalValue)} after 20 years</strong> without adding another penny.`,
      body:
        section(`<span class="step">SIMPLE VS COMPOUND</span><h2>£10,000 at 5% for 20 years.</h2>${stats([["Simple interest", m0(simple), "5% of £10,000 each year"], ["Compounded yearly", m0(annual), `+${m0(annual - simple)} more`], ["Compounded monthly", m0(monthly), `+${m0(monthly - simple)} more`]])}
<p>With simple interest you only ever earn on the original £10,000, so you get £500 a year. With compound interest, year two earns 5% on £10,500, year three on £11,025, and so on. The gap grows every year.</p>`) +
        section(`<span class="step">A LUMP SUM</span><h2>£10,000 left to grow at 4% a year.</h2>${table(["After", "Balance", "Interest earned"], lumpRows)}
<p>Notice how the interest speeds up: the first 10 years add ${m0(cg(10000, 0, 4, 10).interest)}, but the next 10 add ${m0(cg(10000, 0, 4, 20).finalValue - cg(10000, 0, 4, 10).finalValue)}.</p>`, true) +
        section(`<span class="step">REGULAR SAVING</span><h2>Saving £200 a month.</h2>${table(["Saving for", "You pay in", "Value at 4%", "Value at 7%", "Share that is growth (7%)"], regRows)}
<p>Over 30 years at 7%, most of the final pot is growth, not money you paid in. That is why time matters more than almost anything else. (7% is an illustration of long-term investing; investments can fall as well as rise and are not guaranteed.)</p>
${example(`<strong>Starting early:</strong> Alex saves £200 a month from age 25 to 35, then stops. Sam saves £200 a month from 35 to 65. At 6% a year, at 65 Alex has about <strong>${m0(early)}</strong> from ${m0(24000)} paid in. Sam has about <strong>${m0(late)}</strong> from ${m0(72000)} paid in. Alex's 10 early years do almost as much work as Sam's 30.`)}`) +
        section(`<span class="step">RULE OF 72</span><h2>A quick way to estimate doubling time.</h2><p>Divide 72 by the yearly rate to estimate how many years it takes money to double.</p>${table(["Rate", "Rule of 72 estimate", "Actual (yearly compounding)"], [3, 4, 6, 8].map(r => [pct(r), `${(72 / r).toFixed(1)} years`, `${doubling(r)} years`]))}
<p>Inflation works the same way in reverse. At 3% inflation, prices double in about 24 years, so savings earning less than inflation lose buying power over time.</p>`, true) +
        section(`<span class="step">MAKE IT WORK FOR YOU</span><h2>Practical ways to use compounding.</h2><ul><li><strong>Keep interest in the account</strong> rather than paying it out, so it compounds.</li><li><strong>Use your ISA allowance:</strong> you can put up to £20,000 a year into ISAs in 2026/27 and the growth is tax-free.</li><li><strong>Watch the Personal Savings Allowance:</strong> outside an ISA, basic-rate taxpayers can earn £1,000 of interest a year tax-free, higher-rate £500 and additional-rate £0.</li><li><strong>Compounding works against you on debt:</strong> unpaid credit card interest is added to the balance and then charged interest too. See <a href="/money-guides/how-does-debt-interest-work/">how debt interest works</a>.</li></ul>${callout("Run your own figures", `The <a href="/compound-interest-calculator/">compound interest calculator</a> shows the year-by-year growth for any amount, rate and time.`)}`) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Compound interest FAQs</h2>${faq([
          ["How often is interest compounded?", "Savings accounts usually calculate interest daily and pay it monthly or yearly. The AER (Annual Equivalent Rate) already includes the effect of compounding, so you can compare accounts directly."],
          ["Is compound interest guaranteed?", "On a fixed-rate savings account the rate is fixed for the term. Variable rates can change, and investment returns are not guaranteed at all."],
          ["What is the difference between AER and APR?", "AER shows what you earn on savings, including compounding. APR shows what you pay on borrowing, including fees."],
        ])}${related([["Compound interest calculator", "/compound-interest-calculator/"], ["How much should I save each month?", "/money-guides/how-much-should-i-save-each-month/"], ["Saving £500 a month", "/money-guides/how-long-save-500-per-month/"]])}${src([["MoneyHelper: savings basics", "https://www.moneyhelper.org.uk/en/savings/how-to-save"], ["GOV.UK ISAs", "https://www.gov.uk/individual-savings-accounts"], ["GOV.UK tax on savings interest", "https://www.gov.uk/apply-tax-free-interest-on-savings"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 5. car affordability
  {
    const APR = 9.9, TERM = 48, RUN = 230, PAYCAP = 0.10, TOTCAP = 0.20;
    const prices = [8000, 12000, 16000, 20000, 25000, 30000];
    const fin = p => F.carFinance({ vehiclePrice: p, deposit: p * 0.1, apr: APR, termMonths: TERM });
    const rows = prices.map(p => { const f = fin(p); return [comma(p), m0(p * 0.1), m2(f.payment), m0(f.financeInterest), m0(f.payment + RUN)]; });
    const sals = [22000, 25000, 30000, 40000, 50000];
    const sRows = sals.map(s => { const t = take(s).monthly; const pay = Math.min(t * PAYCAP, t * TOTCAP - RUN); const budget = pay; let best = 0; for (let p = 1000; p <= 80000; p += 500) if (fin(p).payment <= pay) best = p; return [comma(s), m0(t), m0(t * TOTCAP), m0(budget), best ? `about ${comma(best)}` : "Under £1,000"]; });
    const f16 = fin(16000);
    built.push(G({
      slug: "how-much-car-can-i-afford",
      title: "How Much Car Can I Afford? UK Guide by Salary 2026 | WorthChex",
      description: `How much should you spend on a car in the UK? Keep the finance payment to about 10% of take-home pay and all car costs under about 20%. See monthly costs for £8,000 to £30,000 cars and what each salary can afford.`,
      eyebrow: "CAR GUIDE",
      h1: "How much car can I afford?",
      lead: `A useful rule: keep the <strong>finance payment to about 10%</strong> of your take-home pay, and <strong>all car costs</strong> (finance, insurance, fuel, tax, servicing) <strong>under about 20%</strong>. On a £30,000 salary that means a payment of up to about ${m0(take(30000).monthly * 0.1)} and no more than ${m0(take(30000).monthly * 0.2)} a month in total.`,
      body:
        section(`<span class="step">FINANCE COSTS</span><h2>Monthly cost by car price.</h2><p>Hire purchase with a 10% deposit, ${APR}% APR over ${TERM} months. The last column adds an example ${m0(RUN)} a month for running costs (insurance, fuel, tax, servicing and MOT); yours may be higher or lower.</p>
${table(["Car price", "Deposit (10%)", "Finance payment", "Total interest", "With running costs"], rows)}`) +
        section(`<span class="step">BY SALARY</span><h2>What each salary can comfortably afford.</h2><p>The finance payment is capped at 10% of take-home pay, and also at 20% minus ${m0(RUN)} of running costs, whichever is lower. This is roughly the car price (10% deposit, ${APR}% APR, ${TERM} months) whose payment fits:</p>
${table(["Salary", "Take-home a month", "All car costs (20%)", "Finance payment", "Car price that fits"], sRows)}
<p>If your rent or mortgage is already high, or you pay for childcare or other debts, aim lower. Buying a cheaper car outright, or saving up for one, avoids interest altogether.</p>`, true) +
        section(`<span class="step">RUNNING COSTS</span><h2>The costs that are easy to forget.</h2>${table(["Cost", "How to estimate it"], [["Insurance", "Get real quotes before you buy. Age, postcode and car group change it hugely."], ["Fuel or charging", "Yearly miles ÷ miles per gallon × fuel price per gallon, or kWh used × your electricity rate."], ["Vehicle tax (VED)", "Depends on the car's age, CO₂ and list price. Electric cars now pay VED too."], ["Servicing, MOT and tyres", "Set aside a monthly amount; older cars usually need more."], ["Depreciation", "Most new cars lose a large part of their value in the first three years."]])}
${example(`<strong>Example:</strong> a ${comma(16000)} car with a ${m0(1600)} deposit costs ${m2(f16.payment)} a month on finance. Add ${m0(RUN)} of running costs and the real monthly cost is about <strong>${m0(f16.payment + RUN)}</strong>.`)}${callout("Check your own budget", `The <a href="/car-finance-calculator/">car finance calculator</a> works out payments and total cost; the <a href="/affordability-calculator/">affordability calculator</a> checks it against your whole budget.`)}`) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Car affordability FAQs</h2>${faq([
          ["Should my car cost less than half my salary?", "That is a common rule for the purchase price. The monthly test (finance under about 10% and all car costs under about 20% of take-home pay) is usually more useful, because it includes running costs."],
          ["Is a longer finance term better?", `Lower payments, more interest. ${comma(16000)} at ${APR}% APR with a 10% deposit costs ${m2(F.carFinance({ vehiclePrice: 16000, deposit: 1600, apr: APR, termMonths: 36 }).payment)} a month over 36 months or ${m2(F.carFinance({ vehiclePrice: 16000, deposit: 1600, apr: APR, termMonths: 60 }).payment)} over 60 months.`],
          ["Is PCP cheaper than hire purchase?", "PCP has lower monthly payments because a large final ‘balloon’ payment is left at the end. If you want to keep the car, the total cost is often higher."],
        ])}${related([["Cash or finance?", "/money-guides/cash-or-finance-car/"], ["Car finance calculator", "/car-finance-calculator/"], ["Understanding loan costs", "/money-guides/understanding-loan-costs/"]])}${src([["MoneyHelper: buying a car", "https://www.moneyhelper.org.uk/en/everyday-money/buying-and-running-a-car/how-to-buy-a-car-and-get-the-best-deal"], ["GOV.UK vehicle tax rates", "https://www.gov.uk/vehicle-tax-rate-tables"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 6. salary sacrifice
  {
    const sals = [25000, 30000, 40000, 60000, 100000];
    const rows = sals.map(s => { const n = take(s), np = take(s, { pensionMethod: "net-pay", pensionPercent: 5 }), ss = take(s, { pensionMethod: "salary-sacrifice", pensionPercent: 5 }); const c = s * 0.05; return [comma(s), m0(c), m0((n.net - np.net) / 12), m0((n.net - ss.net) / 12), `£${(100 * (n.net - ss.net) / c).toFixed(0)}`]; });
    const at = take(110000), fix = take(110000, { pensionMethod: "salary-sacrifice", pensionPercent: 10000 / 110000 * 100 });
    const e40 = take(40000), ss40 = take(40000, { pensionMethod: "salary-sacrifice", pensionPercent: 5 });
    built.push(G({
      slug: "salary-sacrifice-explained",
      title: "Salary Sacrifice Explained UK 2026/27: How Much You Save | WorthChex",
      description: `With salary sacrifice, £100 into your pension costs a basic-rate taxpayer about £72 in take-home pay and a higher-rate taxpayer about £58. See worked 2026/27 examples, the £100,000 trap and the 2029 changes.`,
      eyebrow: "PAY GUIDE",
      h1: "Salary sacrifice explained",
      lead: `Salary sacrifice means giving up part of your salary in exchange for an employer benefit, usually a pension contribution. Because your pay is lower, you pay less <strong>Income Tax and National Insurance</strong>. For a basic-rate taxpayer, each <strong>£100 into the pension costs about £72</strong> of take-home pay.`,
      body:
        section(`<span class="step">THE EXAMPLE</span><h2>A 5% pension on £40,000.</h2>${stats([["Pension contribution", m0(2000), "5% of salary a year"], ["Take-home falls by", m0(e40.net - ss40.net), "a year"], ["Tax and NI saved", m0(2000 - (e40.net - ss40.net)), "a year"], ["Cost per £100", `£${(100 * (e40.net - ss40.net) / 2000).toFixed(0)}`, "of take-home pay"]])}
<p>Your contract salary goes from £40,000 to £38,000 and your employer pays the £2,000 into your pension. You pay no Income Tax (20%) or National Insurance (8%) on that £2,000, so your take-home pay drops by only ${m0(e40.net - ss40.net)}.</p>`) +
        section(`<span class="step">BY SALARY</span><h2>Salary sacrifice vs a normal workplace pension.</h2><p>Monthly cost to your take-home pay of a 5% pension contribution in ${"2026/27"}:</p>
${table(["Salary", "5% contribution a year", "Cost a month (net pay pension)", "Cost a month (salary sacrifice)", "Cost per £100 (sacrifice)"], rows)}
<p>A net pay pension already saves Income Tax. Salary sacrifice adds the National Insurance saving on top: 8% for most earners, 2% on pay above £50,270. Some employers also pass on part of their own 15% National Insurance saving, which makes it even better.</p>`, true) +
        section(`<span class="step">THE £100,000 TRAP</span><h2>Where salary sacrifice is most powerful.</h2>${example(`<strong>Example:</strong> on £110,000 you lose £5,000 of Personal Allowance. Sacrificing <strong>£10,000</strong> into your pension brings your pay back to £100,000. Your take-home pay falls by only <strong>${m0(at.net - fix.net)}</strong> (from ${m0(at.net)} to ${m0(fix.net)}), while ${m0(10000)} goes into your pension. That is about ${(100 * (at.net - fix.net) / 10000).toFixed(0)}p per £1 saved.`)}
<p>Bringing income below £100,000 can also keep access to Tax-Free Childcare and 30 hours of funded childcare, which are lost if either parent's adjusted net income is over £100,000.</p>`) +
        section(`<span class="step">BEFORE YOU SIGN UP</span><h2>Things to check.</h2><ul><li><strong>Minimum wage:</strong> sacrifice cannot take your pay below the National Minimum Wage.</li><li><strong>Mortgages:</strong> some lenders use the lower, post-sacrifice salary when working out how much you can borrow.</li><li><strong>Linked benefits:</strong> life cover, pay rises, overtime rates and some statutory payments can be based on the lower salary. Ask your employer which salary they use.</li><li><strong>Student loans:</strong> repayments are worked out on the lower pay, so you repay a little less each month.</li><li><strong>Coming change:</strong> from 6 April 2029, only the first £2,000 a year of pension salary sacrifice will be free of National Insurance. Income Tax relief is not affected.</li></ul>
<p>Other common schemes include Cycle to Work and electric car schemes. Childcare vouchers closed to new joiners in 2018.</p>${callout("See your own figures", `Choose “salary sacrifice” in the <a href="/take-home-pay-calculator/">take-home pay calculator</a> to compare pension methods on your salary.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Salary sacrifice FAQs</h2>${faq([
          ["Is salary sacrifice worth it?", "For pension saving it is usually the cheapest way to contribute, because you save National Insurance as well as tax. The main downsides are the lower contractual salary and its knock-on effects listed above."],
          ["Can I change my mind?", "Usually only once a year or after a ‘lifestyle event’ such as a new baby or a change of job. Check your employer's scheme rules."],
          ["Does salary sacrifice affect my State Pension?", "Not as long as your pay stays above the Lower Earnings Limit, which it will for most full-time employees."],
        ])}${related([["Take-home pay calculator", "/take-home-pay-calculator/"], ["£100k after tax", "/money-guides/100k-after-tax/"], ["£60k after tax", "/money-guides/60k-after-tax/"]])}${src([["GOV.UK salary sacrifice for employers", "https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye"], ["GOV.UK: salary sacrifice changes from April 2029", "https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029/changes-to-salary-sacrifice-for-pensions-from-april-2029"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 7. emergency fund
  {
    const ess = [1200, 1600, 2000, 2500, 3000];
    const rows = ess.map(e => [m0(e), m0(e * 3), m0(e * 6)]);
    const target = 6000;
    const build = [100, 200, 300, 500].map(x => [`£${x}`, dur(monthsToTarget(target, x, 0)), dur(monthsToTarget(target, x, 4))]);
    built.push(G({
      slug: "emergency-fund-how-much",
      title: "How Much Emergency Fund Do I Need? UK Examples | WorthChex",
      description: "How much should be in your emergency fund? Aim for 3 to 6 months of essential costs: £4,800 to £9,600 if your essentials are £1,600 a month. See the table, how long it takes to build and where to keep it.",
      eyebrow: "SAVINGS GUIDE",
      h1: "How much should my emergency fund be?",
      lead: "Aim for <strong>3 to 6 months of essential costs</strong>, not of income. If your rent or mortgage, bills, food, transport and minimum debt payments come to £1,600 a month, that means <strong>£4,800 to £9,600</strong>. Start with a first goal of £1,000.",
      body:
        section(`<span class="step">YOUR TARGET</span><h2>Emergency fund by monthly essentials.</h2>${table(["Essential costs a month", "3 months", "6 months"], rows)}
<p><strong>Essential costs</strong> are what you must pay to keep a roof over your head and get to work: rent or mortgage, Council Tax, energy, water, phone and broadband, food, transport, insurance and minimum debt payments. Leave out things you would cut in an emergency, such as eating out and subscriptions.</p>`) +
        section(`<span class="step">3 OR 6 MONTHS?</span><h2>Choosing your number.</h2><div class="content-grid"><article class="content-card"><h3>3 months is often enough if…</h3><p>You have a secure job, two incomes in the household, no dependants and good sick pay from your employer.</p></article><article class="content-card"><h3>Aim for 6 months or more if…</h3><p>You are self-employed, the only earner, have children, own an older home or car, or would only get Statutory Sick Pay, which is far below most salaries.</p></article></div>`, true) +
        section(`<span class="step">BUILDING IT</span><h2>How long it takes to save ${m0(target)}.</h2>${table(["Saving each month", "No interest", "At 4% interest"], build)}
<ol class="guide-steps"><li><strong>Start with £1,000.</strong> That covers most car repairs, boiler call-outs and broken phones.</li><li><strong>Automate it.</strong> Set a standing order for payday so the money moves before you can spend it.</li><li><strong>Use windfalls.</strong> Tax refunds, bonuses and birthday money can jump you forward.</li><li><strong>Then build to 3 months</strong>, and on to 6 if your situation calls for it.</li></ol>`) +
        section(`<span class="step">WHERE TO KEEP IT</span><h2>Safe, separate and quick to reach.</h2><ul><li><strong>Easy-access savings account or cash ISA:</strong> you can withdraw the same or next day, and it earns interest. ${m0(target)} at 4% earns about ${m0(target * 0.04)} a year.</li><li><strong>Keep it separate</strong> from your current account so it is not spent by accident.</li><li><strong>Protected:</strong> money in UK banks and building societies is protected by the FSCS up to £120,000 per person, per banking licence.</li><li><strong>Not invested:</strong> shares can fall just when you need the money.</li></ul>${callout("Plan your savings", `The <a href="/savings-calculator/">savings calculator</a> shows how fast you will reach your target with your own monthly amount and rate.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Emergency fund FAQs</h2>${faq([
          ["Should I save an emergency fund or pay off debt first?", "Most people do both: build a small buffer of about £1,000 first, so a surprise bill does not go on a credit card, then focus on expensive debt, then grow the fund."],
          ["What counts as an emergency?", "Something necessary, urgent and unexpected: job loss, illness, urgent home or car repairs. A holiday or Christmas is not an emergency; save for those separately."],
          ["What if I use it?", "That is what it is for. Pause other saving goals and top it back up first."],
        ])}${related([["How much should I save each month?", "/money-guides/how-much-should-i-save-each-month/"], ["How to save £5,000", "/money-guides/how-to-save-5000/"], ["Savings calculator", "/savings-calculator/"]])}${src([["MoneyHelper: emergency savings", "https://www.moneyhelper.org.uk/en/savings/how-to-save/building-an-emergency-savings-fund"], ["FSCS deposit protection", "https://www.fscs.org.uk/what-we-cover/banks-building-societies-credit-unions/"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 8. monthly budget checklist
  {
    const th = take(30000).monthly;
    const lines = [["Rent", 850], ["Council Tax", 130], ["Energy (gas and electricity)", 110], ["Water", 40], ["Phone and broadband", 45], ["Food shopping", 260], ["Transport (bus pass or fuel)", 120], ["Insurance (contents, phone)", 20], ["Subscriptions", 25], ["Eating out and social", 150], ["Clothes and personal care", 60], ["Annual costs pot (see below)", 70], ["Savings", 200]];
    const total = lines.reduce((a, l) => a + l[1], 0);
    const annual = [["Car insurance", 600], ["Car service and MOT", 300], ["TV licence", 180], ["Christmas and birthdays", 480], ["Dentist and glasses", 180], ["Holiday", 900]];
    built.push(G({
      slug: "monthly-budget-what-to-include",
      title: "What to Include in a Monthly Budget: UK Checklist & Example | WorthChex",
      description: `A complete UK monthly budget checklist, with a worked example for a £30,000 salary (${m0(th)} take-home), the 50/30/20 split and how to turn yearly bills into a monthly amount.`,
      eyebrow: "BUDGETING GUIDE",
      h1: "What to include in a monthly budget",
      lead: `A good budget lists <strong>every</strong> regular cost, including the ones that only come once a year. Below is a full checklist and a worked example for someone on a £30,000 salary, who takes home about <strong>${m0(th)} a month</strong>.`,
      body:
        section(`<span class="step">THE CHECKLIST</span><h2>Everything to put in your budget.</h2><div class="content-grid"><article class="content-card"><h3>Home</h3><p>Rent or mortgage, Council Tax, gas, electricity, water, buildings or contents insurance, service charge or ground rent.</p></article><article class="content-card"><h3>Everyday</h3><p>Food shopping, toiletries, phone, broadband, TV licence, streaming and app subscriptions, gym.</p></article><article class="content-card"><h3>Getting around</h3><p>Fuel or charging, car finance, insurance, tax, parking, train or bus fares.</p></article><article class="content-card"><h3>Family</h3><p>Childcare, school costs, pocket money, pet food and insurance.</p></article><article class="content-card"><h3>Debts</h3><p>Loans, credit cards, car finance, Buy Now Pay Later, overdraft interest.</p></article><article class="content-card"><h3>Future you</h3><p>Emergency fund, savings goals, pension top-ups, annual costs pot.</p></article></div>`) +
        section(`<span class="step">A WORKED EXAMPLE</span><h2>Monthly budget on ${m0(th)} take-home.</h2><p>Example figures for a single renter outside London. Swap in your own numbers.</p>
${table(["Item", "Per month"], lines.map(([a, b]) => [a, m0(b)]), ["Total planned", m0(total)])}
<p>That leaves <strong>${m0(th - total)}</strong> unallocated. Give it a job, such as extra savings or a buffer for the month, rather than leaving it to drift.</p>`, true) +
        section(`<span class="step">ANNUAL COSTS</span><h2>Turn yearly bills into a monthly amount.</h2><p>Irregular costs are the main reason budgets fail. Add them up and divide by 12:</p>
${table(["Yearly cost (example)", "Per year", "Per month"], annual.map(([a, b]) => [a, m0(b), m0(b / 12)]), ["Total", m0(annual.reduce((a, l) => a + l[1], 0)), m0(annual.reduce((a, l) => a + l[1], 0) / 12)])}
<p>Paying that monthly figure into a separate “bills pot” means the money is there when the bill arrives.</p>`) +
        section(`<span class="step">A SIMPLE SPLIT</span><h2>The 50/30/20 rule on ${m0(th)}.</h2>${stats([["Needs (50%)", m0(th * 0.5), "housing, bills, food, transport"], ["Wants (30%)", m0(th * 0.3), "eating out, hobbies, holidays"], ["Saving & debt (20%)", m0(th * 0.2), "savings and extra repayments"]])}
<p>It is a starting point, not a rule. With high rent, needs may take 60–70%; that is common, and the answer is to keep wants lower rather than skip saving entirely.</p>${callout("Build yours", `See <a href="/money-guides/how-to-build-a-household-budget/">how to build a household budget</a> step by step, or check how much room you have in the <a href="/affordability-calculator/">affordability calculator</a>.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Monthly budget FAQs</h2>${faq([
          ["Should I budget from gross or take-home pay?", "Take-home pay: the amount that actually lands in your account after tax, National Insurance, pension and student loan."],
          ["How do I budget with irregular income?", "Base your budget on your lowest typical month, and put anything above that into a buffer account you draw from in quieter months."],
          ["How often should I review my budget?", "Check it monthly for the first few months, then whenever something changes: a pay rise, a new bill, or a deal ending."],
        ])}${related([["How to build a household budget", "/money-guides/how-to-build-a-household-budget/"], ["What is disposable income?", "/money-guides/what-is-disposable-income/"], ["£30k after tax", "/money-guides/30k-after-tax/"]])}${src([["MoneyHelper budget planner", "https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 9. disposable income
  {
    const sals = [20000, 25000, 30000, 40000, 50000, 60000];
    const rows = sals.map(s => { const r = take(s); return [comma(s), m0(r.tax + r.ni), m0(r.net), m0(r.monthly)]; });
    const t = take(35000).monthly, essentials = 1650, disc = t - essentials;
    built.push(G({
      slug: "what-is-disposable-income",
      title: "What Is Disposable Income? UK Meaning, Examples & Table | WorthChex",
      description: `Disposable income is the money you have after Income Tax and National Insurance. On a £35,000 salary that is about ${m0(take(35000).net)} a year. Learn the difference from discretionary income, with UK tables.`,
      eyebrow: "BUDGETING GUIDE",
      h1: "What is disposable income?",
      lead: `<strong>Disposable income</strong> is what you have left after Income Tax and National Insurance, in other words your take-home pay. On a £35,000 salary that is about <strong>${m0(take(35000).net)} a year</strong> or <strong>${m0(t)} a month</strong>. What is left after essential bills is called <strong>discretionary income</strong>.`,
      body:
        section(`<span class="step">TWO MEANINGS</span><h2>Disposable vs discretionary income.</h2><div class="content-grid"><article class="content-card"><h3>Disposable income</h3><p>Gross pay minus tax and National Insurance. This is the official meaning used by the ONS and economists.</p></article><article class="content-card"><h3>Discretionary income</h3><p>Disposable income minus essentials like housing, bills and food. This is the money you can choose how to spend or save.</p></article></div><p>People often say “disposable income” when they mean the second one. Lenders, for example, look at what is left after your commitments when deciding what you can afford.</p>`) +
        section(`<span class="step">BY SALARY</span><h2>Disposable income at common salaries, ${"2026/27"}.</h2>${table(["Salary", "Tax and NI a year", "Disposable a year", "Disposable a month"], rows)}
<p class="source-note">England, Wales and Northern Ireland; standard tax code; no pension or student loan. A workplace pension and student loan would reduce these figures.</p>`, true) +
        section(`<span class="step">WORKED EXAMPLE</span><h2>From salary to spending money.</h2><ol class="guide-steps"><li><strong>Gross salary:</strong> £35,000 a year, or ${m0(35000 / 12)} a month.</li><li><strong>Disposable income:</strong> after ${m0(take(35000).tax / 12)} Income Tax and ${m0(take(35000).ni / 12)} National Insurance, ${m0(t)} a month.</li><li><strong>Essentials:</strong> rent, Council Tax, energy, food, transport and phone add up to an example ${m0(essentials)}.</li><li><strong>Discretionary income:</strong> ${m0(t)} − ${m0(essentials)} = <strong>${m0(disc)} a month</strong> for saving, debt repayments and spending.</li></ol>
${example(`<strong>Why it matters:</strong> a ${m0(250)} car finance payment looks small against a ${m0(35000 / 12)} gross salary. Against ${m0(disc)} of discretionary income, it is ${pct(250 / disc * 100)} of everything you have left.`)}`) +
        section(`<span class="step">INCREASE IT</span><h2>Ways to raise your disposable income.</h2><ul><li><strong>Check your tax code</strong> on your payslip. A wrong code (like an emergency code) can overtax you; HMRC refunds overpaid tax.</li><li><strong>Use salary sacrifice</strong> for pension saving to cut tax and National Insurance. See <a href="/money-guides/salary-sacrifice-explained/">salary sacrifice explained</a>.</li><li><strong>Claim what you are owed:</strong> Marriage Allowance, uniform tax relief, working-from-home relief where eligible, and benefits like Child Benefit.</li><li><strong>Cut essentials:</strong> switch energy tariffs, broadband and insurance at renewal, and check whether you qualify for a Council Tax discount.</li></ul>${callout("Work out yours", `Get your exact figure in the <a href="/take-home-pay-calculator/">take-home pay calculator</a>, then see what is left after bills in the <a href="/affordability-calculator/">affordability calculator</a>.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Disposable income FAQs</h2>${faq([
          ["Is disposable income the same as net income?", "For most employees, yes. Both mean pay after Income Tax and National Insurance. Some definitions also take off pension contributions and student loan repayments."],
          ["Do benefits count as disposable income?", "In official statistics, yes: the ONS includes benefits and tax credits in household disposable income."],
          ["What is a good amount of discretionary income?", "There is no fixed figure, but if less than about 10–20% of take-home pay is left after essentials, it is hard to save and any price rise hurts. That is a sign to look at the biggest costs first."],
        ])}${related([["Salary after tax table", "/money-guides/salary-after-tax/"], ["What to include in a monthly budget", "/money-guides/monthly-budget-what-to-include/"], ["Pay rise after tax", "/money-guides/pay-rise-calculator/"]])}${src([["ONS: household disposable income", "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth"], ["GOV.UK Income Tax rates", "https://www.gov.uk/income-tax-rates"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 10. cash or finance a car
  {
    const PRICE = 18000, DEP = 1800, TERM = 48;
    const aprRows = [0, 6.9, 9.9, 12.9].map(a => { const f = F.carFinance({ vehiclePrice: PRICE, deposit: DEP, apr: a, termMonths: TERM }); return [pct(a, 1), m2(f.payment), m0(f.financeInterest), m0(f.totalPaid)]; });
    const hp = F.carFinance({ vehiclePrice: PRICE, deposit: DEP, apr: 9.9, termMonths: TERM });
    const pcp = F.carFinance({ vehiclePrice: PRICE, deposit: DEP, apr: 9.9, termMonths: TERM, balloon: 7500 });
    // Finance and pay each instalment from savings that earn 4%: what is left in savings at the end? Cash leaves £0.
    const leftover = apr => { const pay = F.carFinance({ vehiclePrice: PRICE, deposit: DEP, apr, termMonths: TERM }).payment; let b = PRICE - DEP; for (let m = 0; m < TERM; m++) b = b * (1 + 0.04 / 12) - pay; return b; };
    const kept = F.compoundGrowth({ starting: PRICE - DEP, annualRate: 4, years: 4 }).interest;
    built.push(G({
      slug: "cash-or-finance-car",
      title: "Should I Pay Cash or Finance a Car? UK Cost Comparison | WorthChex",
      description: `Paying cash for an £18,000 car saves about ${m0(hp.financeInterest)} of interest compared with 9.9% APR finance over 4 years. See HP vs PCP vs cash, 0% deals and when finance makes sense.`,
      eyebrow: "CAR GUIDE",
      h1: "Should I pay cash or finance a car?",
      lead: `Cash is usually cheapest. On an ${comma(PRICE)} car, finance at 9.9% APR over 4 years adds about <strong>${m0(hp.financeInterest)} of interest</strong>. Finance can make sense when the APR is very low (or 0%) or when paying cash would empty your emergency fund.`,
      body:
        section(`<span class="step">THE COMPARISON</span><h2>An ${comma(PRICE)} car, ${m0(DEP)} deposit, ${TERM} months.</h2>${table(["APR", "Monthly payment", "Interest", "Total cost of car"], aprRows)}
<p>Paying cash, the car costs ${comma(PRICE)}. Each step up in APR adds hundreds of pounds.</p>`) +
        section(`<span class="step">THE HIDDEN COST OF CASH</span><h2>What your savings could earn instead.</h2><p>Paying cash means giving up the interest that money would earn. A fair test: keep the ${m0(PRICE - DEP)} in a savings account paying 4%, and pay each finance instalment out of it. Whatever is left after 4 years is what finance gained you (or cost you, if negative):</p>
${table(["Finance APR", "Interest paid on finance", "Left in savings after 4 years", "Better option"], [0, 2.9, 4, 6.9, 9.9].map(a => { const f = F.carFinance({ vehiclePrice: PRICE, deposit: DEP, apr: a, termMonths: TERM }); const l = leftover(a); return [pct(a, 1), m0(f.financeInterest), (l < 0 ? "−" : "") + m0(Math.abs(l)), Math.abs(l) < 50 ? "About the same" : l > 0 ? "Finance" : "Cash"]; }))}
<p>The rule is simple: <strong>finance only wins when its APR is lower than what your savings earn after tax</strong>. A genuine 0% deal can beat cash, as long as there are no fees and the car's price was not raised to pay for it. At typical APRs, cash wins. (Savings interest above your Personal Savings Allowance is taxed, which tips the balance further towards cash.)</p>`, true) +
        section(`<span class="step">HP OR PCP?</span><h2>The two main types of car finance.</h2><div class="content-grid"><article class="content-card"><h3>Hire purchase (HP)</h3><p>You pay off the whole car over the term and own it at the end. Example: ${m2(hp.payment)} a month, ${m0(hp.financeInterest)} interest.</p></article><article class="content-card"><h3>PCP</h3><p>Lower payments because ${m0(7500)} is left as a final ‘balloon’. Example: ${m2(pcp.payment)} a month, then pay ${m0(7500)} to keep the car, or hand it back. Interest: ${m0(pcp.financeInterest)}.</p></article></div>
<p>Under both, you can hand the car back once you have paid half the total amount payable (‘voluntary termination’). PCP also comes with mileage limits and charges for damage.</p>`) +
        section(`<span class="step">DECIDE</span><h2>A quick checklist.</h2><ol class="guide-steps"><li><strong>Would cash leave you with less than 3 months of essential costs?</strong> Keep the buffer and borrow, or buy a cheaper car.</li><li><strong>Is the finance APR lower than your savings rate after tax?</strong> Finance may be cheaper.</li><li><strong>Do you have higher-interest debt?</strong> Use spare cash to clear that first.</li><li><strong>Will you keep the car long term?</strong> HP or cash usually costs less than PCP.</li><li><strong>Ask for the cash price.</strong> Dealers sometimes offer bigger discounts on finance deals; compare the total cost, not the monthly payment.</li></ol>${callout("Compare your own deal", `Enter the price, deposit, APR and balloon in the <a href="/car-finance-calculator/">car finance calculator</a>.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Cash or finance FAQs</h2>${faq([
          ["Does car finance affect my credit score?", "Applying creates a hard search, and the agreement appears on your credit file. Paying on time can help your history; missed payments harm it."],
          ["Is a personal loan better than dealer finance?", "Sometimes. With a loan you own the car from day one and can compare lenders. Check the APR and total cost of both."],
          ["Can I pay off car finance early?", "Yes. You have a legal right to settle early, and the lender must give you a settlement figure."],
        ])}${related([["How much car can I afford?", "/money-guides/how-much-car-can-i-afford/"], ["Car finance calculator", "/car-finance-calculator/"], ["Understanding loan costs", "/money-guides/understanding-loan-costs/"]])}${src([["MoneyHelper: car finance explained", "https://www.moneyhelper.org.uk/en/everyday-money/buying-and-running-a-car/car-finance-explained"], ["FCA: motor finance", "https://www.fca.org.uk/consumers/car-motor-finance"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 11. pay rise after tax
  {
    const cases = [[25000, 26000], [30000, 31500], [30000, 33000], [40000, 44000], [48000, 52000], [50000, 55000], [100000, 110000]];
    const rows = cases.map(([a, b]) => { const ra = take(a), rb = take(b); const kept = rb.net - ra.net; return [`${comma(a)} → ${comma(b)}`, m0(b - a), m0(kept), m0(kept / 12), `${Math.round(kept / (b - a) * 100)}p`]; });
    const ra = take(30000), rb = take(33000);
    const p2a = take(30000, { studentPlan: "plan2" }), p2b = take(33000, { studentPlan: "plan2" });
    built.push(G({
      slug: "pay-rise-calculator",
      title: "Pay Rise After Tax UK 2026/27: How Much Will I Actually Get? | WorthChex",
      description: `A £3,000 pay rise on £30,000 adds about ${m0((rb.net - ra.net) / 12)} a month to take-home pay in 2026/27. See how much of each pay rise you keep at every tax band, with a student loan example.`,
      eyebrow: "PAY GUIDE",
      h1: "Pay rise after tax: how much will you actually get?",
      lead: `You keep less of a pay rise than the headline figure. A <strong>£3,000 rise on £30,000</strong> adds about <strong>${m0(rb.net - ra.net)} a year</strong> to take-home pay, or <strong>${m0((rb.net - ra.net) / 12)} a month</strong>, because 20% Income Tax and 8% National Insurance come off the extra.`,
      body:
        section(`<span class="step">THE TABLE</span><h2>What you keep from common pay rises.</h2>${table(["Pay rise", "Extra gross", "Extra take-home a year", "Extra a month", "Kept per £1"], rows)}
<p class="source-note">${"2026/27"} rates for England, Wales and Northern Ireland, no pension or student loan.</p>`) +
        section(`<span class="step">WHY IT VARIES</span><h2>How much of each extra pound you keep.</h2>${table(["Your salary", "Deductions on extra pay", "You keep"], [["£12,570 to £50,270", "20% tax + 8% NI", "72p"], ["£50,270 to £100,000", "40% tax + 2% NI", "58p"], ["£100,000 to £125,140", "60% effective tax + 2% NI", "38p"], ["Over £125,140", "45% tax + 2% NI", "53p"]])}
<p>A pay rise never reduces your take-home pay, because tax is charged in bands: only the money above each threshold is taxed at the higher rate. But a rise that crosses £50,270 or £100,000 is worth noticeably less than one below.</p>`, true) +
        section(`<span class="step">OTHER DEDUCTIONS</span><h2>Student loans and pensions take a share too.</h2>${example(`<strong>Plan 2 student loan:</strong> on the £30,000 → £33,000 rise, you repay an extra 9%, so you keep about <strong>${m0((p2b.net - p2a.net) / 12)} a month</strong> instead of ${m0((rb.net - ra.net) / 12)}. That is ${Math.round((p2b.net - p2a.net) / 3000 * 100)}p of each extra pound.`)}
<p>If you pay a percentage of salary into a workplace pension, that grows with your pay too. It is still your money, just saved for later.</p>`) +
        section(`<span class="step">REAL TERMS</span><h2>Is your pay rise beating inflation?</h2><p>If prices rise 3% and your pay rises 3%, you can buy the same as last year: a <strong>real-terms</strong> pay rise of zero. To be better off, your take-home pay needs to grow faster than your costs. Compare your percentage rise with the latest CPI inflation figure from the ONS.</p>${callout("Try your own pay rise", `Enter your current and new salary in the <a href="/salary-calculator/">salary calculator</a>, including pension and student loan, to see the exact monthly difference.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Pay rise FAQs</h2>${faq([
          ["Can a pay rise put me in a worse position?", "Not through Income Tax or National Insurance alone. It can affect means-tested benefits like Universal Credit, the High Income Child Benefit Charge (from £60,000) and funded childcare (lost above £100,000)."],
          ["How do I ask for a pay rise?", "Gather evidence: what you have achieved, extra responsibilities you have taken on, and what similar jobs pay. Ask for a specific figure."],
          ["When will I see it on my payslip?", "From the next payroll after the change takes effect. Backdated rises are usually paid as a lump sum, which can be taxed at a higher rate in that one month but evens out over the tax year."],
        ])}${related([["Salary calculator", "/salary-calculator/"], ["Salary after tax table", "/money-guides/salary-after-tax/"], ["£50k after tax", "/money-guides/50k-after-tax/"], ["£100k after tax", "/money-guides/100k-after-tax/"]])}${src([["GOV.UK Income Tax rates", "https://www.gov.uk/income-tax-rates"], ["ONS: CPI inflation", "https://www.ons.gov.uk/economy/inflationandpriceindices"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 12. debt interest
  {
    const BAL = 3000, APR = 24.9;
    const mi = BAL * S.aprMonthly(APR);
    const payRows = [75, 100, 150, 200, 300].map(p => { const d = S.debtPlan(BAL, APR, p); return [`£${p}`, dur(d.months), m0(d.interest), m0(d.total)]; });
    const aprRows = [0, 9.9, 19.9, 24.9, 34.9].map(a => { const d = S.debtPlan(BAL, a, 100); return [pct(a, 1), dur(d.months), m0(d.interest)]; });
    const d100 = S.debtPlan(BAL, APR, 100), d150 = S.debtPlan(BAL, APR, 150);
    built.push(G({
      slug: "how-does-debt-interest-work",
      title: "How Does Debt Interest Work? Credit Card Examples UK | WorthChex",
      description: `£3,000 on a credit card at 24.9% APR costs about ${m0(mi)} a month in interest. Paying £100 a month takes ${dur(d100.months)} and costs ${m0(d100.interest)}; £150 cuts that to ${m0(d150.interest)}. See how APR and payments change the total.`,
      eyebrow: "DEBT GUIDE",
      h1: "How does debt interest work?",
      lead: `Each month, interest is added to what you owe and your payment clears that interest first. On <strong>${m0(BAL)} at ${APR}% APR</strong>, about <strong>${m2(mi)}</strong> of your first payment is interest. Pay £100 a month and only ${m2(100 - mi)} reduces the debt.`,
      body:
        section(`<span class="step">PAYMENT SIZE</span><h2>${m0(BAL)} at ${APR}% APR: what different payments cost.</h2>${table(["Monthly payment", "Debt-free in", "Total interest", "Total repaid"], payRows)}
<p>Raising the payment from £100 to £150 saves <strong>${m0(d100.interest - d150.interest)}</strong> and clears the debt ${dur(d100.months - d150.months)} sooner. The first extra pounds make the biggest difference.</p>`) +
        section(`<span class="step">APR</span><h2>The same ${m0(BAL)} at £100 a month, different APRs.</h2>${table(["APR", "Debt-free in", "Total interest"], aprRows)}
<p>Moving a balance from 24.9% to 0% means every payment goes on the debt itself. Balance transfer cards usually charge a fee of around 3% of the balance; on ${m0(BAL)} that would be about ${m0(BAL * 0.03)}, still far less than the interest.</p>`, true) +
        section(`<span class="step">HOW IT IS CALCULATED</span><h2>Interest, step by step.</h2><ol class="guide-steps"><li><strong>Monthly rate:</strong> a ${APR}% APR is roughly ${pct(S.aprMonthly(APR) * 100, 2)} a month.</li><li><strong>Interest this month:</strong> ${m0(BAL)} × ${pct(S.aprMonthly(APR) * 100, 2)} = ${m2(mi)}.</li><li><strong>Your payment:</strong> £100 first covers the ${m2(mi)} interest, and the remaining ${m2(100 - mi)} reduces the balance to ${m2(BAL - (100 - mi))}.</li><li><strong>Next month:</strong> interest is worked out on the new, slightly lower balance, so a little more of each payment goes on the debt.</li></ol>
<p>Card companies usually calculate interest daily on the balance, but the result is close to this monthly picture. Purchases paid off in full by the due date usually have no interest at all.</p>`) +
        section(`<span class="step">PAY IT OFF FASTER</span><h2>Practical ways to cut the interest.</h2><ul><li><strong>Pay a fixed amount, not the minimum.</strong> Minimum payments fall as the balance falls, which can stretch a debt over many years.</li><li><strong>Avalanche method:</strong> pay the minimum on everything, then put every spare pound on the highest-APR debt. It saves the most interest.</li><li><strong>Snowball method:</strong> clear the smallest balance first for a quick win. It costs a little more but helps some people keep going.</li><li><strong>Look at 0% balance transfers or a cheaper loan</strong> if your credit score allows.</li><li><strong>Get free help early</strong> from StepChange, National Debtline or Citizens Advice if payments feel unmanageable.</li></ul>${callout("Plan your payoff", `The <a href="/debt-payoff-calculator/">debt payoff calculator</a> shows your debt-free date and total interest for any balance, APR and payment.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Debt interest FAQs</h2>${faq([
          ["What is persistent debt?", "If over 18 months you pay more in interest, fees and charges than you repay of the balance, your card provider must contact you and help you pay it off faster. If it continues, they can suspend the card."],
          ["Is APR the same as monthly interest × 12?", "Not quite. APR includes the effect of compounding and any fees, so the monthly rate is slightly less than APR ÷ 12."],
          ["Should I save or pay off debt?", `Keep a small emergency buffer, then pay off expensive debt. Clearing a ${APR}% card is like earning ${APR}% tax-free.`],
        ])}${related([["Does paying extra £50 help?", "/money-guides/does-paying-extra-50-on-debt-help/"], ["Paying off £5,000 of debt", "/money-guides/how-long-to-pay-off-5000-debt/"], ["Debt payoff calculator", "/debt-payoff-calculator/"]])}${src([["FCA: persistent credit card debt", "https://www.fca.org.uk/consumers/credit-cards"], ["MoneyHelper: dealing with debt", "https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt"], ["StepChange (free debt advice)", "https://www.stepchange.org/"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 13. how much to save each month
  {
    const goals = [1000, 3000, 5000, 10000, 20000], months = [12, 24, 36, 60];
    const gRows = goals.map(g => [comma(g), ...months.map(n => m0(Math.ceil(S.requiredMonthlySaving(0, g, 4, n)))) ]);
    const sals = [25000, 30000, 40000, 50000];
    const pRows = sals.map(s => { const t = take(s).monthly; return [comma(s), m0(t), m0(t * 0.1), m0(t * 0.15), m0(t * 0.2)]; });
    const t35 = take(35000).monthly;
    built.push(G({
      slug: "how-much-should-i-save-each-month",
      title: "How Much Should I Save Each Month? UK Guide With Tables | WorthChex",
      description: `A common target is 10–20% of take-home pay: about ${m0(take(30000).monthly * 0.1)}–${m0(take(30000).monthly * 0.2)} a month on £30,000. See exactly how much to save each month to reach £1,000 to £20,000 in 1 to 5 years.`,
      eyebrow: "SAVINGS GUIDE",
      h1: "How much should I save each month?",
      lead: `A good general target is <strong>10–20% of your take-home pay</strong>, plus your workplace pension. On a £35,000 salary that is about <strong>${m0(t35 * 0.1)} to ${m0(t35 * 0.2)} a month</strong>. If you are saving for something specific, work backwards from the goal instead.`,
      body:
        section(`<span class="step">BY SALARY</span><h2>10%, 15% and 20% of take-home pay.</h2>${table(["Salary", "Take-home a month", "Save 10%", "Save 15%", "Save 20%"], pRows)}
<p>If 10% is not possible yet, start smaller. Saving £25 a week every week is £1,300 a year, and the habit matters more than the amount at first.</p>`) +
        section(`<span class="step">BY GOAL</span><h2>Monthly saving needed to reach a target.</h2>${table(["Goal", "In 1 year", "In 2 years", "In 3 years", "In 5 years"], gRows)}
<p class="source-note">Assumes 4% interest a year, added monthly, starting from £0. A lower rate means slightly higher monthly amounts.</p>`, true) +
        section(`<span class="step">WHAT TO SAVE FOR FIRST</span><h2>A sensible order.</h2><ol class="guide-steps"><li><strong>Starter buffer of £1,000</strong> for surprise bills.</li><li><strong>Your workplace pension,</strong> at least enough to get the full employer contribution. It is free money.</li><li><strong>Clear expensive debt</strong> like credit cards and overdrafts.</li><li><strong>Full emergency fund</strong> of 3–6 months of essential costs. See <a href="/money-guides/emergency-fund-how-much/">how much you need</a>.</li><li><strong>Specific goals:</strong> a house deposit, a car, a wedding. For a first home, a Lifetime ISA currently adds a 25% government bonus (up to £1,000 a year); the government plans to replace it with a new First Time Buyer ISA, so check the latest rules.</li><li><strong>Long-term investing</strong> for goals more than 5 years away.</li></ol>`) +
        section(`<span class="step">MAKE IT HAPPEN</span><h2>Tips that actually work.</h2><ul><li><strong>Pay yourself first:</strong> set a standing order for the day after payday.</li><li><strong>Use separate pots</strong> for each goal so you can see progress.</li><li><strong>Save pay rises:</strong> put half of every rise into savings before you get used to spending it. See <a href="/money-guides/pay-rise-calculator/">what a pay rise is worth after tax</a>.</li><li><strong>Round up:</strong> many banks can round card purchases up to the nearest pound and save the difference.</li></ul>${callout("Plan your goal", `The <a href="/savings-calculator/">savings calculator</a> works out the monthly amount for any target, date and interest rate.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Monthly saving FAQs</h2>${faq([
          ["Does my pension count towards the 10–20%?", "Usually it is counted separately. Auto-enrolment already puts in at least 8% of qualifying earnings (including your employer's share), so 10–20% of take-home pay is on top."],
          ["Where should I keep my savings?", "Short-term goals: easy-access or fixed-rate savings, or a cash ISA. Goals five or more years away: consider investing, accepting that values can fall."],
          ["Is it OK to save less some months?", "Yes. Consistency over a year matters more than any single month. Just restart as soon as you can."],
        ])}${related([["How to save £5,000", "/money-guides/how-to-save-5000/"], ["How long to save £10,000", "/money-guides/how-long-save-10000/"], ["Compound interest explained", "/money-guides/compound-interest-explained/"]])}${src([["MoneyHelper: how to save", "https://www.moneyhelper.org.uk/en/savings/how-to-save"], ["GOV.UK Lifetime ISA", "https://www.gov.uk/lifetime-isa"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 14. household budget
  {
    const a = take(38000, { pensionMethod: "net-pay", pensionPercent: 5 }), b = take(26000, { pensionMethod: "net-pay", pensionPercent: 5 });
    const inc = a.monthly + b.monthly, cb = 27.05 * 52 / 12;
    const lines = [
      ["Housing", "Mortgage", 1050], ["Housing", "Council Tax (Band C)", 165], ["Housing", "Buildings and contents insurance", 35],
      ["Bills", "Energy", 150], ["Bills", "Water", 45], ["Bills", "Broadband, TV licence and two phones", 85],
      ["Family", "Childcare (after funded hours)", 420], ["Family", "Food and household shopping", 550],
      ["Transport", "One car: fuel, insurance, tax, servicing", 260], ["Debt", "Car finance", 180],
      ["Lifestyle", "Eating out, activities and subscriptions", 220], ["Lifestyle", "Clothes, haircuts, gifts", 120],
      ["Annual costs pot", "Holidays, Christmas, MOT, school trips", 150], ["Savings", "Emergency fund and goals", 300],
    ];
    const total = lines.reduce((s, l) => s + l[2], 0);
    const cats = {}; lines.forEach(([c, , v]) => { cats[c] = (cats[c] || 0) + v; });
    built.push(G({
      slug: "how-to-build-a-household-budget",
      title: "How to Build a Household Budget in the UK: Step-by-Step Example | WorthChex",
      description: `Build a UK household budget in 6 steps, with a full worked example for a couple with a child on £38,000 and £26,000 (${m0(inc)} a month take-home), plus a free calculator.`,
      eyebrow: "BUDGETING GUIDE",
      h1: "How to build a household budget",
      lead: `A household budget brings everyone's income and every shared cost into one plan. Below are six steps, then a full worked example for a couple with one child earning £38,000 and £26,000, who take home about <strong>${m0(inc)} a month</strong> after a 5% pension.`,
      body:
        section(`<span class="step">SIX STEPS</span><h2>Build it in an evening.</h2><ol class="guide-steps"><li><strong>Add up take-home income</strong> for everyone who contributes: salaries after tax, pension and student loan, plus Child Benefit and any other regular income.</li><li><strong>List fixed costs</strong> from three months of bank statements: mortgage or rent, Council Tax, bills, insurance, childcare, debt payments.</li><li><strong>Estimate variable costs</strong> like food and fuel from the same three months. Use the average, not your best month.</li><li><strong>Add an annual costs pot:</strong> total up yearly and irregular costs and divide by 12.</li><li><strong>Decide savings first</strong>, then fit spending around what is left.</li><li><strong>Agree how you split it.</strong> Couples often use a joint account for shared bills, funded in proportion to income.</li></ol>`) +
        section(`<span class="step">WORKED EXAMPLE</span><h2>A family budget on ${m0(inc)} a month.</h2>${stats([["Partner A (£38,000)", m0(a.monthly), "after tax, NI, 5% pension"], ["Partner B (£26,000)", m0(b.monthly), "after tax, NI, 5% pension"], ["Child Benefit", m0(cb), "first child, monthly"], ["Total income", m0(inc + cb), "a month"]])}
${table(["Category", "Item", "Per month"], lines.map(([c, i, v]) => [c, i, m0(v)]), ["", "Total", m0(total)])}
<p>The budget leaves <strong>${m0(inc + cb - total)}</strong> unallocated each month, a buffer for price rises and one-off costs. Example figures only; local costs vary a lot.</p>`, true) +
        section(`<span class="step">WHERE THE MONEY GOES</span><h2>The example, by category.</h2>${table(["Category", "Per month", "Share of income"], Object.entries(cats).map(([c, v]) => [c, m0(v), pct(v / (inc + cb) * 100)]))}
<p>Housing and childcare are the two biggest costs for most families with young children. If the budget does not balance, start there: check you are claiming all funded childcare hours and Tax-Free Childcare (the government adds £2 for every £8 you pay, up to £2,000 per child a year).</p>`) +
        section(`<span class="step">SPLITTING COSTS</span><h2>Fair ways for couples to share bills.</h2>${table(["Method", "How it works in the example", "Good for"], [["50/50", `Each pays ${m0(total / 2)}`, "Similar incomes"], ["In proportion to income", `A pays ${pct(a.monthly / inc * 100)} (${m0(total * a.monthly / inc)}), B pays ${pct(b.monthly / inc * 100)} (${m0(total * b.monthly / inc)})`, "Different incomes"], ["All in one pot", "Both salaries go into one account; each gets equal personal spending money", "Shared finances"]])}${callout("Check your numbers", `The <a href="/affordability-calculator/">affordability calculator</a> shows what is left after your costs, and the <a href="/take-home-pay-calculator/">take-home pay calculator</a> gives each person's exact income.`)}`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Household budget FAQs</h2>${faq([
          ["What if our budget does not balance?", "List costs from biggest to smallest and look at the top five first: housing, childcare, car, food and energy. Switching deals at renewal and claiming entitlements usually makes more difference than cutting small treats."],
          ["Should we include pension contributions?", "Use take-home pay, which already has workplace pension contributions taken off, so you do not count them twice."],
          ["How often should we review it?", "Monthly at first, then at least every six months and whenever a deal, salary or family situation changes."],
        ])}${related([["What to include in a monthly budget", "/money-guides/monthly-budget-what-to-include/"], ["Emergency fund: how much?", "/money-guides/emergency-fund-how-much/"], ["Affordability calculator", "/affordability-calculator/"]])}${src([["MoneyHelper budget planner", "https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner"], ["GOV.UK Tax-Free Childcare", "https://www.gov.uk/tax-free-childcare"], ["GOV.UK Child Benefit rates", "https://www.gov.uk/child-benefit/what-youll-get"]])}`, true),
    }));
  }

  // ------------------------------------------------------------ 15. calculators explained
  {
    const mRows = [3.5, 4.5, 5.5, 6.5].map(r => { const p = S.mortgagePlan(250000, r, 25, 0); return [pct(r, 1), m2(p.payment), m0(p.interest)]; });
    const sRows = [2, 4, 6].map(r => { const g = F.compoundGrowth({ contribution: 200, annualRate: r, years: 20 }); return [pct(r), m0(g.totalContributions), m0(g.finalValue)]; });
    const r40 = take(40000);
    built.push(G({
      slug: "financial-calculators-explained",
      title: "Financial Calculators Explained: What the Numbers Mean | WorthChex",
      description: "How UK money calculators work, which inputs change the answer most, and how to read the results, with worked examples for mortgages, savings and take-home pay, plus how WorthChex checks its figures.",
      eyebrow: "HOW TO USE OUR TOOLS",
      h1: "Financial calculators explained",
      lead: "A money calculator turns a few inputs into a clear answer, but the answer is only as good as those inputs. This guide shows which inputs matter most, with real examples, and how WorthChex tests every figure.",
      body:
        section(`<span class="step">WHICH CALCULATOR?</span><h2>The right tool for the question.</h2>${table(["Your question", "Use", "Key inputs"], [
          ["What will I actually get paid?", `<a href="/take-home-pay-calculator/">Take-home pay</a>`, "Salary, pension method, student loan, region"],
          ["Is this pay rise worth it?", `<a href="/salary-calculator/">Salary calculator</a>`, "Current and new salary"],
          ["What will a mortgage cost?", `<a href="/mortgage-calculator/">Mortgage</a>`, "Loan, rate, term, overpayment"],
          ["How much Stamp Duty?", `<a href="/stamp-duty-calculator/">Stamp Duty</a>`, "Price, nation, buyer type"],
          ["Can I afford this?", `<a href="/affordability-calculator/">Affordability</a>`, "Income, bills, new payment"],
          ["When will I be debt-free?", `<a href="/debt-payoff-calculator/">Debt payoff</a>`, "Balance, APR, payment"],
          ["What will a loan or car cost?", `<a href="/personal-loan-calculator/">Loan</a> / <a href="/car-finance-calculator/">Car finance</a>`, "Amount, APR, term, deposit, balloon"],
          ["How fast will my savings grow?", `<a href="/savings-calculator/">Savings</a> / <a href="/compound-interest-calculator/">Compound interest</a>`, "Start, monthly amount, rate, years"],
          ["How much VAT?", `<a href="/vat-calculator/">VAT</a>`, "Amount, rate, add or remove"],
        ])}`) +
        section(`<span class="step">SENSITIVITY</span><h2>Small input changes, big differences.</h2><h3>A £250,000 mortgage over 25 years</h3>${table(["Rate", "Monthly payment", "Total interest"], mRows)}
<p>Each 1 percentage point adds roughly £140–£155 a month. When you use a mortgage calculator, try your quoted rate and a rate 1–2 points higher to see what happens when your deal ends.</p>
<h3>Saving £200 a month for 20 years</h3>${table(["Growth rate", "Paid in", "Final value"], sRows)}
<p>For long-term projections, the growth rate is the input that matters most, and the one nobody can know in advance. Try a cautious, middle and hopeful rate rather than relying on one number.</p>`, true) +
        section(`<span class="step">READING RESULTS</span><h2>Three things to check.</h2><ol class="guide-steps"><li><strong>Nominal rate or APR?</strong> Mortgages quote a yearly interest rate; loans and cards quote APR, which includes fees. WorthChex converts APR to the correct monthly rate, so a 12.68% APR is treated as exactly 1% a month.</li><li><strong>Which tax year and region?</strong> Our tax calculators use ${"2026/27"} rates and let you choose Scotland, where Income Tax bands differ.</li><li><strong>What is left out?</strong> Calculators cannot see your credit file, a lender's own rules, fees you have not entered or future rate changes. Treat results as a planning estimate.</li></ol>`) +
        section(`<span class="step">HOW WE CHECK</span><h2>How WorthChex keeps its figures right.</h2><p>Every calculator runs on one shared engine, and the same engine produces the figures in our guides. Before any change goes live, automated tests compare the engine with answers worked out by hand from official rates. For example:</p>
${table(["Test", "Expected answer"], [["Take-home pay on £40,000 (England)", m2(r40.net)], ["Income Tax on £40,000", m2(r40.tax)], ["Stamp Duty on £300,000 (home mover, England)", m0(F.sdlt(300000).tax)], ["LBTT on £300,000 (Scotland)", m0(F.lbtt(300000).tax)], ["£250,000 mortgage, 4.5%, 25 years", m2(S.mortgagePlan(250000, 4.5, 25, 0).payment)]])}
<p>Read more about our sources and assumptions on the <a href="/methodology/">methodology page</a>.</p>`, true) +
        section(`<span class="step">FREQUENT QUESTIONS</span><h2>Calculator FAQs</h2>${faq([
          ["Why is my payslip different from the calculator?", "Payroll works each pay period separately and may include things the calculator does not know about, such as a non-standard tax code, benefits in kind or overtime."],
          ["Do you store what I type?", "No. The calculations run in your browser and the numbers you enter are not sent to us. See the privacy policy for details on cookies and ads."],
          ["Are the results financial advice?", "No. They are estimates to help you plan and compare. For decisions like a mortgage or pension transfer, speak to a regulated adviser."],
        ])}${related([["Methodology", "/methodology/"], ["All calculators", "/calculators/"], ["All money guides", "/money-guides/"]])}${src([["MoneyHelper tools and calculators", "https://www.moneyhelper.org.uk/en/tools-and-calculators"], ["GOV.UK Income Tax rates", "https://www.gov.uk/income-tax-rates"]])}`, true),
    }));
  }

  return built;
};
