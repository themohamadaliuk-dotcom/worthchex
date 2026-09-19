/* WorthChex Calculator Suite — production V3 engine */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.WorthChexFinal = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const money = n => `£${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const monthlyRate = annual => Math.max(0, annual) / 100 / 12;

  function annuityPayment(principal, annualRate, periods, periodsPerYear = 12) {
    if (principal <= 0 || periods <= 0) return 0;
    const r = Math.max(0, annualRate) / 100 / periodsPerYear;
    return r === 0 ? principal / periods : principal * r / (1 - Math.pow(1 + r, -periods));
  }

  function amortise(principal, annualRate, plannedPeriods, extra = 0, periodsPerYear = 12) {
    if (principal <= 0 || plannedPeriods <= 0) return null;
    const base = annuityPayment(principal, annualRate, plannedPeriods, periodsPerYear);
    const payment = base + Math.max(0, extra);
    const r = Math.max(0, annualRate) / 100 / periodsPerYear;
    if (payment <= 0) return null;
    let balance = principal, interest = 0, periods = 0;
    const max = Math.max(1200, plannedPeriods * 3 + 24);
    while (balance > 0.005 && periods < max) {
      const i = balance * r;
      const p = Math.min(payment, balance + i);
      const principalPart = p - i;
      if (principalPart <= 0) return null;
      interest += i;
      balance -= principalPart;
      periods += 1;
    }
    if (balance > 0.005) return null;
    return { basePayment: base, payment, periods, interest, total: principal + interest };
  }

  function debtPlan(balance, annualRate, payment) {
    if (balance <= 0 || payment <= 0) return null;
    const r = monthlyRate(annualRate);
    if (r === 0) return { months: Math.ceil(balance / payment), interest: 0, total: balance };
    if (payment <= balance * r) return null;
    let left = balance, interest = 0, months = 0;
    while (left > 0.005 && months < 1200) {
      const i = left * r;
      const p = Math.min(payment, left + i);
      const principal = p - i;
      if (principal <= 0) return null;
      interest += i;
      left -= principal;
      months += 1;
    }
    return left <= 0.005 ? { months, interest, total: balance + interest } : null;
  }

  function periodicRate(annualRate, compoundsPerYear, contributionFrequency) {
    if (annualRate <= 0) return 0;
    const compoundRate = annualRate / 100 / compoundsPerYear;
    return Math.pow(1 + compoundRate, compoundsPerYear / contributionFrequency) - 1;
  }

  function futureValue(principal, contribution, annualRate, years, compoundsPerYear = 12, contributionFrequency = 12) {
    if (years <= 0) return Math.max(0, principal);
    const n = Math.max(1, Math.round(years * contributionFrequency));
    const r = periodicRate(annualRate, compoundsPerYear, contributionFrequency);
    const p = Math.max(0, principal);
    const c = Math.max(0, contribution);
    if (r === 0) return p + c * n;
    const factor = Math.pow(1 + r, n);
    return p * factor + c * ((factor - 1) / r);
  }

  function monthlyFutureValue(principal, monthlyContribution, annualRate, months, compoundsPerYear = 12) {
    return futureValue(principal, monthlyContribution, annualRate, months / 12, compoundsPerYear, 12);
  }

  function requiredMonthlySaving(principal, target, annualRate, months, compoundsPerYear = 12) {
    if (target <= principal) return 0;
    if (months <= 0) return null;
    const r = periodicRate(annualRate, compoundsPerYear, 12);
    const growth = r === 0 ? 1 : Math.pow(1 + r, months);
    const gap = Math.max(0, target - principal * growth);
    return r === 0 ? gap / months : gap / ((growth - 1) / r);
  }

  function mortgagePlan(amount, rate, years, overpayment, type) {
    if (amount <= 0 || years <= 0) return null;
    const months = Math.round(years * 12);
    const r = monthlyRate(rate);
    if (type === "interest-only") {
      const payment = amount * r;
      return { payment, basePayment: payment, interest: payment * months, total: amount + payment * months, months, periods: months };
    }
    const plan = amortise(amount, rate, months, overpayment, 12);
    if (!plan) return null;
    return { ...plan, months };
  }

  function sdlt(price, opts = {}) {
    if (price <= 0) return 0;
    const { firstTime = false, additional = false, replacing = false, nonResident = false } = opts;
    const surcharge = (additional && !replacing ? 0.05 : 0) + (nonResident ? 0.02 : 0);
    if (firstTime && price <= 500000) {
      return Math.max(0, Math.min(price, 500000) - 300000) * (0.05 + surcharge);
    }
    const bands = [[0,125000,0],[125000,250000,0.02],[250000,925000,0.05],[925000,1500000,0.10],[1500000,Infinity,0.12]];
    return bands.reduce((sum, [low, high, rate]) => {
      const slice = Math.max(0, Math.min(price, high) - low);
      return sum + slice * (rate + surcharge);
    }, 0);
  }

  const STUDENT = {
    none: { threshold: Infinity, rate: 0 },
    plan1: { threshold: 26900, rate: 0.09 },
    plan2: { threshold: 29385, rate: 0.09 },
    plan4: { threshold: 33795, rate: 0.09 },
    plan5: { threshold: 25000, rate: 0.09 },
    postgraduate: { threshold: 21000, rate: 0.06 }
  };

  function personalAllowance(gross) {
    return clamp(12570 - Math.max(0, gross - 100000) / 2, 0, 12570);
  }

  function incomeTax(gross, region = "rUK") {
    const taxable = Math.max(0, gross - personalAllowance(gross));
    const bands = region === "scotland"
      ? [[0,3967,0.19],[3967,16956,0.20],[16956,31092,0.21],[31092,62430,0.42],[62430,125140,0.45],[125140,Infinity,0.48]]
      : [[0,37700,0.20],[37700,125140,0.40],[125140,Infinity,0.45]];
    return bands.reduce((sum, [low, high, rate]) => sum + Math.max(0, Math.min(taxable, high) - low) * rate, 0);
  }

  function employeeNI(gross, category = "A") {
    if (["C","K","S"].includes(category)) return 0;
    const middleRate = ["B","E","I"].includes(category) ? 0.0185 : 0.08;
    const upperRate = ["D","J","L","Z"].includes(category) ? 0.02 : 0.02;
    return Math.max(0, Math.min(gross, 50270) - 12570) * middleRate + Math.max(0, gross - 50270) * upperRate;
  }

  function loanRepayment(gross, plan) {
    const p = STUDENT[plan] || STUDENT.none;
    return Math.max(0, gross - p.threshold) * p.rate;
  }

  function takeHome(gross, opts = {}) {
    const salary = Math.max(0, gross);
    const sacrifice = Math.min(salary, Math.max(0, Number(opts.salarySacrifice || 0)));
    const taxableGross = Math.max(0, salary - sacrifice);
    const tax = incomeTax(taxableGross, opts.region === "scotland" ? "scotland" : "rUK");
    const ni = employeeNI(taxableGross, opts.niCategory || "A");
    const pension = salary * clamp(Number(opts.pensionPercent || 0), 0, 100) / 100;
    const student = loanRepayment(salary, opts.studentPlan || "none");
    const postgraduate = opts.postgraduate ? loanRepayment(salary, "postgraduate") : 0;
    const net = Math.max(0, salary - tax - ni - pension - student - postgraduate - sacrifice);
    return { gross: salary, tax, ni, pension, sacrifice, student, postgraduate, net, monthly: net / 12, weekly: net / 52 };
  }


  function affordabilityPlan(inputs = {}) {
    const income = Math.max(0, Number(inputs.income || 0));
    const purchase = Math.max(0, Number(inputs.purchase || 0));
    if (income <= 0 || purchase <= 0) return null;

    const categories = {
      housing: Math.max(0, Number(inputs.housing || 0)),
      bills: Math.max(0, Number(inputs.bills || 0)),
      food: Math.max(0, Number(inputs.food || 0)),
      transport: Math.max(0, Number(inputs.transport || 0)),
      childcare: Math.max(0, Number(inputs.childcare || 0)),
      debt: Math.max(0, Number(inputs.debt || 0)),
      subscriptions: Math.max(0, Number(inputs.subscriptions || 0)),
      irregular: Math.max(0, Number(inputs.irregular || 0))
    };

    const existingSpending = Object.values(categories).reduce((sum, value) => sum + value, 0);
    const disposableBeforePayment = income - existingSpending;
    const mode = inputs.purchaseType === "finance" ? "finance" : "cash";

    let deposit = 0;
    let financedAmount = 0;
    let payment = 0;
    let financeInterest = 0;
    let totalFinance = 0;
    let financePeriods = 0;

    if (mode === "finance") {
      deposit = Math.min(purchase, Math.max(0, Number(inputs.deposit || 0)));
      financedAmount = Math.max(0, purchase - deposit);
      const termYears = Math.max(0, Number(inputs.financeTerm || 0));
      if (financedAmount > 0 && termYears <= 0) return { valid: false, error: "Enter a finance term." };
      if (financedAmount > 0) {
        const plan = amortise(
          financedAmount,
          Math.max(0, Number(inputs.financeRate || 0)),
          Math.max(1, termYears * 12),
          Math.max(0, Number(inputs.financeExtra || 0))
        );
        if (!plan) return { valid: false, error: "This finance plan does not amortise under the assumptions entered." };
        payment = plan.payment;
        financeInterest = plan.interest;
        totalFinance = plan.total;
        financePeriods = plan.periods;
      }
    }

    const upfrontCash = mode === "finance" ? deposit : purchase;
    const savings = Math.max(0, Number(inputs.savings || 0));
    const emergencyTarget = Math.max(0, Number(inputs.emergency || 0));
    const hasSavings = inputs.hasSavings !== false;
    const hasEmergency = inputs.hasEmergency !== false;
    const savingsAfterPurchase = hasSavings ? savings - upfrontCash : null;
    const emergencyShortfall = hasSavings && hasEmergency
      ? Math.max(0, emergencyTarget - Math.max(0, savingsAfterPurchase))
      : null;
    const monthlyAfterPayment = disposableBeforePayment - payment;

    const pctOfIncome = value => income > 0 ? (value / income) * 100 : null;
    const pctOfDisposable = value => disposableBeforePayment > 0 ? (value / disposableBeforePayment) * 100 : null;

    return {
      valid: true,
      mode,
      income,
      purchase,
      categories,
      existingSpending,
      disposableBeforePayment,
      deposit,
      financedAmount,
      payment,
      financeRate: Math.max(0, Number(inputs.financeRate || 0)),
      financeTerm: Math.max(0, Number(inputs.financeTerm || 0)),
      financeExtra: Math.max(0, Number(inputs.financeExtra || 0)),
      financeInterest,
      totalFinance,
      financePeriods,
      upfrontCash,
      savings,
      emergencyTarget,
      hasSavings,
      hasEmergency,
      savingsAfterPurchase,
      emergencyShortfall,
      monthlyAfterPayment,
      ratios: {
        housing: pctOfIncome(categories.housing),
        debt: pctOfIncome(categories.debt),
        existingSpending: pctOfIncome(existingSpending),
        payment: pctOfIncome(payment),
        paymentOfDisposable: pctOfDisposable(payment),
        totalCommitments: pctOfIncome(existingSpending + payment),
        remainingIncome: pctOfIncome(monthlyAfterPayment),
        upfrontCashOfSavings: hasSavings && savings > 0 ? (upfrontCash / savings) * 100 : null,
        reserveCoverage: hasSavings && hasEmergency && emergencyTarget > 0
          ? (Math.max(0, savingsAfterPurchase) / emergencyTarget) * 100
          : null
      }
    };
  }

  function render() {
    const $ = id => document.getElementById(id);
    const n = id => Math.max(0, Number($(id)?.value || 0));
    const has = id => !!$(id) && String($(id).value).trim() !== "";
    const show = (id, html) => { const el = $(id); if (!el) return; el.innerHTML = html; el.classList.remove("hidden"); };
    const clear = (ids, result) => { ids.forEach(id => { if ($(id)) $(id).value = ""; }); if ($(result)) { $(result).innerHTML = ""; $(result).classList.add("hidden"); } };
    const stat = (a,b) => `<div class="stat"><span>${a}</span><strong>${b}</strong></div>`;

    if ($("calculateButton")) {
      const toggleFinanceFields = () => {
        const finance = $("purchaseType")?.value === "finance";
        document.querySelectorAll("[data-affordability-finance]").forEach(el => {
          el.hidden = !finance;
        });
      };

      toggleFinanceFields();
      $("purchaseType")?.addEventListener("change", toggleFinanceFields);

      $("calculateButton").addEventListener("click", () => {
        const fields = {
          income: n("income"),
          purchase: n("purchase"),
          purchaseType: $("purchaseType")?.value || "cash",
          housing: n("rent"),
          bills: n("bills"),
          food: n("food"),
          transport: n("transport"),
          childcare: n("childcare"),
          debt: n("debt"),
          subscriptions: n("subscriptions"),
          irregular: n("irregular"),
          savings: n("savings"),
          emergency: n("emergency"),
          hasSavings: has("savings"),
          hasEmergency: has("emergency"),
          deposit: n("deposit"),
          financeRate: n("financeRate"),
          financeTerm: n("financeTerm"),
          financeExtra: n("financeExtra")
        };

        if (fields.income <= 0) {
          return show("result", '<h2 class="bad">Enter your monthly take-home income</h2><p>Use the amount you actually have available for the household budget.</p>');
        }
        if (fields.purchase <= 0) {
          return show("result", '<h2 class="warning">Enter the purchase price</h2><p>Tell us what the purchase costs before we calculate the monthly and savings impact.</p>');
        }
        if (fields.purchaseType === "finance" && fields.deposit > fields.purchase) {
          fields.deposit = fields.purchase;
        }
        if (fields.purchaseType === "finance" && fields.financeTerm <= 0) {
          return show("result", '<h2 class="warning">Enter the finance term</h2><p>Choose how many years the finance will run for.</p>');
        }

        const plan = affordabilityPlan(fields);
        if (!plan || plan.valid === false) {
          return show("result", `<h2 class="bad">We need one more detail</h2><p>${plan?.error || "Check the figures entered and try again."}</p>`);
        }

        const pct = value => value == null ? "—" : `${value.toFixed(1)}%`;
        const categoryRows = [
          ["Housing", plan.categories.housing, plan.ratios.housing],
          ["Bills & household", plan.categories.bills, plan.income > 0 ? plan.categories.bills / plan.income * 100 : 0],
          ["Food & groceries", plan.categories.food, plan.income > 0 ? plan.categories.food / plan.income * 100 : 0],
          ["Transport", plan.categories.transport, plan.income > 0 ? plan.categories.transport / plan.income * 100 : 0],
          ["Childcare / dependants", plan.categories.childcare, plan.income > 0 ? plan.categories.childcare / plan.income * 100 : 0],
          ["Existing debt", plan.categories.debt, plan.ratios.debt],
          ["Subscriptions & discretionary", plan.categories.subscriptions, plan.income > 0 ? plan.categories.subscriptions / plan.income * 100 : 0],
          ["Annual / irregular allowance", plan.categories.irregular, plan.income > 0 ? plan.categories.irregular / plan.income * 100 : 0]
        ].filter(([, value]) => value > 0);

        const categoryHtml = categoryRows.length
          ? `<div class="affordability-breakdown"><div class="affordability-breakdown-title">Existing monthly spending</div>${categoryRows.map(([label, value, ratio]) => `<div class="affordability-breakdown-row"><span>${label}</span><strong>${money(value)}</strong><small>${pct(ratio)} of take-home income</small></div>`).join("")}</div>`
          : "";

        const remainingClass = plan.monthlyAfterPayment >= 0 ? "good" : "bad";
        const reserveClass = plan.emergencyShortfall === null ? "" : (plan.emergencyShortfall > 0 ? "bad" : "good");

        const summary = `
          <div class="affordability-result-hero">
            <span class="mini-label">${plan.mode === "finance" ? "Money left after current spending + payment" : "Monthly disposable income before this cash purchase"}</span>
            <strong class="big-number">${money(plan.mode === "finance" ? plan.monthlyAfterPayment : plan.disposableBeforePayment)}</strong>
            <span class="affordability-result-sub ${remainingClass}">${pct(plan.mode === "finance" ? plan.ratios.remainingIncome : plan.ratios.existingSpending)} of take-home income represented by this figure</span>
          </div>
          <div class="affordability-summary-grid">
            <div class="affordability-metric"><span>Existing spending</span><strong>${money(plan.existingSpending)}</strong><small>${pct(plan.ratios.existingSpending)} of income</small></div>
            <div class="affordability-metric"><span>New monthly payment</span><strong>${money(plan.payment)}</strong><small>${pct(plan.ratios.payment)} of income</small></div>
            <div class="affordability-metric"><span>Total commitments</span><strong>${money(plan.existingSpending + plan.payment)}</strong><small>${pct(plan.ratios.totalCommitments)} of income</small></div>
            <div class="affordability-metric"><span>Income remaining</span><strong class="${remainingClass}">${money(plan.monthlyAfterPayment)}</strong><small>${pct(plan.ratios.remainingIncome)} of income</small></div>
          </div>
        `;

        const financeHtml = plan.mode === "finance"
          ? `<div class="what-if-box affordability-detail-box">
              <strong>Finance breakdown</strong>
              ${stat("Purchase price", money(plan.purchase))}
              ${stat("Deposit", money(plan.deposit))}
              ${stat("Deposit as % of purchase", pct(plan.deposit / plan.purchase * 100))}
              ${stat("Amount financed", money(plan.financedAmount))}
              ${stat("Financed as % of purchase", pct(plan.financedAmount / plan.purchase * 100))}
              ${stat("APR", pct(plan.financeRate))}
              ${stat("Term", `${plan.financeTerm.toFixed(1)} years`)}
              ${stat("Extra monthly payment", money(plan.financeExtra))}
              ${stat("Estimated monthly payment", money(plan.payment))}
              ${stat("Payment as % of take-home pay", pct(plan.ratios.payment))}
              ${plan.ratios.paymentOfDisposable == null ? "" : stat("Payment as % of pre-payment disposable income", pct(plan.ratios.paymentOfDisposable))}
              ${stat("Finance interest", money(plan.financeInterest))}
              ${stat("Total finance repayment", money(plan.totalFinance))}
              ${stat("Estimated payoff", `${plan.financePeriods} months`)}
            </div>`
          : "";

        const cashHtml = plan.mode === "cash"
          ? `<div class="what-if-box affordability-detail-box">
              <strong>Cash purchase & savings</strong>
              ${stat("Purchase price", money(plan.purchase))}
              ${plan.hasSavings ? stat("Savings before purchase", money(plan.savings)) : ""}
              ${plan.hasSavings ? stat("Cash purchase as % of savings", pct(plan.ratios.upfrontCashOfSavings)) : ""}
              ${plan.hasSavings ? stat("Savings after purchase", money(plan.savingsAfterPurchase)) : ""}
              ${plan.hasEmergency ? stat("Emergency-fund target", money(plan.emergencyTarget)) : ""}
              ${plan.ratios.reserveCoverage == null ? "" : stat("Emergency target covered", pct(plan.ratios.reserveCoverage))}
              ${plan.emergencyShortfall === null ? "" : stat("Emergency-fund shortfall", plan.emergencyShortfall > 0 ? `<span class="bad">${money(plan.emergencyShortfall)}</span>` : `<span class="good">£0.00</span>`)}
            </div>`
          : "";

        const contextNote = plan.ratios.totalCommitments > 100
          ? '<div class="result-message bad"><p>Your entered monthly commitments are greater than your take-home income by <strong>' + money(Math.abs(plan.monthlyAfterPayment)) + '</strong> per month. This is a budget calculation, not a lender decision.</p></div>'
          : plan.ratios.totalCommitments === 100
            ? '<div class="result-message warning"><p>Your entered monthly commitments use <strong>100%</strong> of take-home income, leaving nothing before irregular or unexpected costs.</p></div>'
            : '<div class="result-message"><p>Your entered figures leave <strong>' + money(plan.monthlyAfterPayment) + '</strong> after existing spending and the new payment. The percentage is shown against take-home income so the calculation is easy to audit.</p></div>';

        show("result", `${summary}${contextNote}${financeHtml}${cashHtml}${categoryHtml}
          <div class="affordability-reference-note">
            <strong>Why there is no universal “safe” percentage</strong>
            <p>Lenders assess affordability using income and expenditure and their own criteria. MoneyHelper says people typically spend around 28–35% of income on a mortgage, but explicitly says there is no one percentage that is right for everyone. WorthChex therefore shows the percentages from your own budget instead of turning one rule of thumb into a pass/fail score.</p>
            <a href="https://www.moneyhelper.org.uk/en/blog/buy-or-rent-a-home/how-much-should-i-spend-on-a-mortgage" target="_blank" rel="noopener noreferrer">MoneyHelper: mortgage affordability and percentages →</a>
          </div>
          <p class="disclaimer">Planning estimate only. Your inputs determine the percentages shown. Lenders use their own affordability assessments, and real costs can include items you have not entered.</p>`);
      });

      $("resetButton")?.addEventListener("click", () => clear(
        ["income","rent","bills","food","transport","childcare","debt","subscriptions","irregular","savings","emergency","purchase","deposit","financeRate","financeTerm","financeExtra"],
        "result"
      ));
    }

    if ($("savingsCalculateButton")) {
      const toggle=()=>{const mode=$("savingsMode")?.value||"monthly";document.querySelectorAll("[data-savings-target]").forEach(el=>el.hidden=el.dataset.savingsTarget!==mode);};
      toggle();$("savingsMode")?.addEventListener("change",toggle);
      $("savingsCalculateButton").addEventListener("click",()=>{
        const current=n("currentSavings"),goal=n("savingsGoal"),rate=n("savingsRate"),mode=$("savingsMode")?.value||"monthly";
        if(goal<=0)return show("savingsResult",'<h2 class="warning">Enter a savings goal</h2><p>Choose the amount you want to reach.</p>');
        if(current>=goal)return show("savingsResult",`<div class="score-circle"><span>100</span><small>%</small></div><h2 class="good">Goal already reached 🎉</h2><p>You have ${money(current)} against a target of ${money(goal)}.</p>`);
        let months,monthly;
        if(mode==="date"){
          const value=$("savingsTargetDate")?.value;if(!value)return show("savingsResult",'<h2 class="warning">Choose a target date</h2><p>Select the date by which you want to reach the goal.</p>');
          const target=new Date(`${value}T12:00:00`), now=new Date();months=Math.max(1,Math.ceil((target-now)/(1000*60*60*24*30.4375)));monthly=requiredMonthlySaving(current,goal,rate,months,Number($("savingsCompounding")?.value||12));
        }else{
          monthly=n("monthlySaving");if(monthly<=0)return show("savingsResult",'<h2 class="warning">Enter a monthly contribution</h2><p>Or switch to target-date mode.</p>');
          months=1;while(months<=1200&&monthlyFutureValue(current,monthly,rate,months,Number($("savingsCompounding")?.value||12))<goal)months++;if(months>1200)return show("savingsResult",'<h2 class="bad">The current plan does not reach the goal within 100 years</h2><p>Increase the contribution or review the target.</p>');
        }
        const value=monthlyFutureValue(current,monthly,rate,months,Number($("savingsCompounding")?.value||12));const contributions=current+monthly*months;const growth=Math.max(0,value-contributions);const date=new Date();date.setMonth(date.getMonth()+months);
        const faster25=mode==="monthly"?Math.max(1,Math.ceil(months*monthly/Math.max(1,monthly+25))):null;const faster50=mode==="monthly"?Math.max(1,Math.ceil(months*monthly/Math.max(1,monthly+50))):null;
        show("savingsResult",`<div class="score-circle"><span>${Math.min(100,Math.round(current/goal*100))}</span><small>% there</small></div><h2>${mode==="date"?`Save about ${money(monthly)} a month`:`Goal in about ${months} months`}</h2>${stat("Target",money(goal))}${stat("Current savings",money(current))}${stat("Monthly contribution",money(monthly))}${stat("Estimated growth",money(growth))}${stat("Estimated value",money(value))}${stat("Estimated goal month",date.toLocaleDateString("en-GB",{month:"long",year:"numeric"}))}${mode==="monthly"?`<div class="what-if-box"><strong>What if you save more?</strong>${stat("+£25/month",`${faster25} months`)}${stat("+£50/month",`${faster50} months`)}</div>`:""}<p class="disclaimer">Uses a constant rate assumption. Actual savings rates, tax and contributions can change.</p>`);
      });
      $("savingsResetButton")?.addEventListener("click",()=>clear(["currentSavings","savingsGoal","monthlySaving","savingsRate","savingsTargetDate"],"savingsResult"));
    }

    if ($("debtCalculateButton")) {
      const toggle=()=>{const mode=$("debtMode")?.value||"payment";document.querySelectorAll("[data-debt-target]").forEach(el=>el.hidden=el.dataset.debtTarget!==mode);};
      toggle();$("debtMode")?.addEventListener("change",toggle);
      $("debtCalculateButton").addEventListener("click",()=>{const balance=n("debtBalance"),rate=n("interestRate"),extra=n("debtExtra"),mode=$("debtMode")?.value||"payment";if(balance<=0)return show("debtResult",'<h2 class="warning">Enter your current debt</h2><p>We need the outstanding balance first.</p>');let payment=n("debtPayment");if(mode==="target")payment=annuityPayment(balance,rate,Math.max(1,n("debtTargetMonths")))+extra;const plan=debtPlan(balance,rate,payment);if(!plan)return show("debtResult",'<h2 class="bad">This payment does not reduce the debt</h2><p>Increase the payment above the monthly interest charge.</p>');const p25=debtPlan(balance,rate,payment+25),p50=debtPlan(balance,rate,payment+50),d=new Date();d.setMonth(d.getMonth()+plan.months);show("debtResult",`<div class="score-circle"><span>${Math.max(1,100-Math.floor(plan.months/12))}</span><small>plan</small></div><h2 class="good">Estimated payoff in ${plan.months} months</h2>${stat("Monthly payment",money(payment))}${stat("Total interest",money(plan.interest))}${stat("Total repaid",money(plan.total))}${stat("Estimated payoff",d.toLocaleDateString("en-GB",{month:"long",year:"numeric"}))}<div class="what-if-box"><strong>Extra-payment scenarios</strong>${stat("+£25/month",`${p25?.months||"—"} months · ${p25?money(p25.interest):"—"} interest`)}${stat("+£50/month",`${p50?.months||"—"} months · ${p50?money(p50.interest):"—"} interest`)}</div><p class="disclaimer">Simplified monthly-interest model. Actual lender calculations can differ.</p>`);});
      $("debtResetButton")?.addEventListener("click",()=>clear(["debtBalance","interestRate","debtPayment","debtExtra","debtTargetMonths"],"debtResult"));
    }

    if ($("mortgageCalculateButton")) {
      $("mortgageCalculateButton").addEventListener("click",()=>{const price=n("mortgagePrice"),deposit=Math.min(price,n("mortgageDeposit")),amount=Math.max(0,price-deposit),rate=n("mortgageRate"),years=n("mortgageTerm"),over=n("mortgageOverpayment"),type=$("mortgageType")?.value||"repayment";if(price<=0||years<=0)return show("mortgageResult",'<h2 class="warning">Enter the property price and term</h2><p>Provide enough information to model the mortgage.</p>');const plan=mortgagePlan(amount,rate,years,over,type);if(!plan)return show("mortgageResult",'<h2 class="bad">Mortgage plan unavailable</h2><p>Check the amount, rate and term.</p>');const ltv=price?amount/price*100:0;const stamp=sdlt(price,{firstTime:$("mortgageFirstTime")?.value==="yes",additional:$("mortgageAdditional")?.value==="yes",replacing:$("mortgageReplacing")?.value==="yes"});show("mortgageResult",`<div class="result-message"><span class="mini-label">Estimated monthly payment</span><strong class="big-number">${money(plan.payment)}</strong></div>${stat("Property price",money(price))}${stat("Deposit",money(deposit))}${stat("Mortgage amount",money(amount))}${stat("LTV",`${ltv.toFixed(1)}%`)}${stat("Interest rate",`${rate.toFixed(2)}%`)}${stat("Mortgage type",type==="interest-only"?"Interest-only":"Repayment")}${stat("Total interest",money(plan.interest))}${stat("Total mortgage paid",money(plan.total))}${stat("Illustrative SDLT",money(stamp))}${over>0&&type==="repayment"?stat("Payment including overpayment",money(plan.payment)):""}<p class="disclaimer">Simplified mortgage estimate. Real products can include fees, fixed-rate periods, variable rates and early-repayment rules.</p>`);});
      $("mortgageResetButton")?.addEventListener("click",()=>clear(["mortgagePrice","mortgageDeposit","mortgageRate","mortgageTerm","mortgageOverpayment"],"mortgageResult"));
    }

    if ($("salaryCalculateButton")) {
      $("salaryCalculateButton").addEventListener("click",()=>{const input=n("salaryAmount"),freq=$("salaryFrequency")?.value||"annual";if(input<=0)return show("salaryResult",'<h2 class="warning">Enter your gross pay</h2><p>Use a positive annual, monthly or weekly figure.</p>');const gross=input*(freq==="monthly"?12:freq==="weekly"?52:1);const r=takeHome(gross,{region:$("taxRegion")?.value,niCategory:$("niCategory")?.value||"A",pensionPercent:n("pensionPercent"),salarySacrifice:n("salarySacrifice"),studentPlan:$("studentPlan")?.value||"none",postgraduate:$("postgraduate")?.checked});show("salaryResult",`<div class="result-message"><span class="mini-label">Estimated monthly take-home</span><strong class="big-number">${money(r.monthly)}</strong></div>${stat("Gross annual pay",money(r.gross))}${stat("Income Tax",money(r.tax))}${stat("Employee National Insurance",money(r.ni))}${stat("Pension",money(r.pension))}${stat("Salary sacrifice",money(r.sacrifice))}${stat("Student loan",money(r.student))}${stat("Postgraduate loan",money(r.postgraduate))}${stat("Estimated annual take-home",money(r.net))}<p class="disclaimer">2026/27 estimate based on published UK Income Tax, National Insurance and student-loan rules. A real payslip can differ.</p>`);});
      $("salaryResetButton")?.addEventListener("click",()=>clear(["salaryAmount","pensionPercent","salarySacrifice"],"salaryResult"));
    }

    if ($("compoundCalculateButton")) {
      $("compoundCalculateButton").addEventListener("click",()=>{const initial=n("compoundInitial"),contribution=n("compoundContribution"),rate=n("compoundRate"),years=n("compoundYears"),freq=Number($("compoundContributionFrequency")?.value||12),comp=Number($("compoundCompounding")?.value||12);if(years<=0)return show("compoundResult",'<h2 class="warning">Enter a time period</h2><p>Choose a positive number of years.</p>');const value=futureValue(initial,contribution,rate,years,comp,freq),contributed=initial+contribution*years*freq;show("compoundResult",`<div class="result-message"><span class="mini-label">Estimated future value</span><strong class="big-number">${money(value)}</strong></div>${stat("Starting balance",money(initial))}${stat("Regular contribution",money(contribution))}${stat("Total contributions",money(contributed))}${stat("Annual rate",`${rate.toFixed(2)}%`)}${stat("Estimated growth",money(Math.max(0,value-contributed)))}${stat("Time",`${years} years`)}<p class="disclaimer">Illustrative compound-growth model. Returns are not guaranteed and fees/tax are not included.</p>`);});
      $("compoundResetButton")?.addEventListener("click",()=>clear(["compoundInitial","compoundContribution","compoundRate","compoundYears"],"compoundResult"));
    }

    if ($("sdltCalculateButton")) {
      $("sdltCalculateButton").addEventListener("click",()=>{const price=n("sdltPrice");if(price<=0)return show("sdltResult",'<h2 class="warning">Enter a property price</h2><p>We need the purchase price first.</p>');const first=$("sdltFirstTime")?.value==="yes",additional=$("sdltAdditional")?.value==="yes",replacing=$("sdltReplacing")?.value==="yes",nonResident=$("sdltNonResident")?.value==="yes";const duty=sdlt(price,{firstTime:first,additional,replacing,nonResident});show("sdltResult",`<div class="result-message"><span class="mini-label">Estimated Stamp Duty</span><strong class="big-number">${money(duty)}</strong></div>${stat("Property price",money(price))}${stat("Effective rate",`${(duty/price*100).toFixed(2)}%`)}${stat("First-time buyer relief",first&&price<=500000?"Applied":"Not applied")}${stat("Additional-property surcharge",additional&&!replacing?"Included":"Not included")}${stat("Non-UK-resident surcharge",nonResident?"Included":"Not included")}<p class="disclaimer">England and Northern Ireland residential estimate based on current published SDLT rates.</p>`);});
      $("sdltResetButton")?.addEventListener("click",()=>clear(["sdltPrice"],"sdltResult"));
    }

    if ($("loanCalculateButton")) {
      $("loanCalculateButton").addEventListener("click",()=>{const amount=n("loanAmount"),rate=n("loanRate"),years=n("loanTerm"),fee=n("loanFee"),extra=n("loanExtra");if(amount<=0||years<=0)return show("loanResult",'<h2 class="warning">Enter the loan amount and term</h2><p>Use positive values for the borrowing amount and duration.</p>');const plan=amortise(amount+fee,rate,years*12,extra);if(!plan)return show("loanResult",'<h2 class="bad">This loan plan does not amortise</h2><p>Check the APR and payment assumptions.</p>');const p50=amortise(amount+fee,rate,years*12,extra+50);show("loanResult",`<div class="result-message"><span class="mini-label">Estimated monthly payment</span><strong class="big-number">${money(plan.payment)}</strong></div>${stat("Loan amount",money(amount))}${stat("Fee added to borrowing",money(fee))}${stat("APR",`${rate.toFixed(2)}%`)}${stat("Total interest",money(plan.interest))}${stat("Total repaid",money(plan.total))}<div class="what-if-box"><strong>£50 extra each month</strong>${stat("Estimated payoff",p50?`${p50.periods} months`:"—")}${stat("Estimated interest",p50?money(p50.interest):"—")}</div><p class="disclaimer">Simplified amortisation estimate. Lender terms, fees and early repayment rules may differ.</p>`);});
      $("loanResetButton")?.addEventListener("click",()=>clear(["loanAmount","loanRate","loanTerm","loanFee","loanExtra"],"loanResult"));
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
    else render();
  }

  return { clamp, money, annuityPayment, amortise, debtPlan, futureValue, monthlyFutureValue, requiredMonthlySaving, mortgagePlan, sdlt, personalAllowance, incomeTax, employeeNI, loanRepayment, takeHome, affordabilityPlan };
});
