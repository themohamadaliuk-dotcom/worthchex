/* WorthChex Financial Calculator Suite V4
   2026/27 UK tax, SDLT, VAT, compound growth and car finance models.
   Browser-first; no external dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.WorthChexFinancial = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const money = (value, digits = 2) => `£${Math.max(0, num(value)).toLocaleString('en-GB', {minimumFractionDigits: digits, maximumFractionDigits: digits})}`;
  const pct = (value, digits = 2) => `${num(value).toLocaleString('en-GB', {minimumFractionDigits: digits, maximumFractionDigits: digits})}%`;

  function personalAllowance(adjustedNetIncome) {
    const income = Math.max(0, adjustedNetIncome);
    if (income <= 100000) return 12570;
    return clamp(12570 - (income - 100000) / 2, 0, 12570);
  }

  function incomeTax(taxableIncome, region = 'rUK') {
    const taxable = Math.max(0, taxableIncome);
    const bands = region === 'scotland'
      ? [[3967,0.19],[16956-3967,0.20],[31092-16956,0.21],[62430-31092,0.42],[125140-62430,0.45],[Infinity,0.48]]
      : [[37700,0.20],[125140-37700,0.40],[Infinity,0.45]];
    let left = taxable, tax = 0;
    for (const [width, rate] of bands) { if (left <= 0) break; const slice = Math.min(left, width); tax += slice * rate; left -= slice; }
    return tax;
  }

  const NI_CATEGORIES = {
    A:{main:0.08,upper:0.02}, B:{main:0.0185,upper:0.02}, C:{main:0,upper:0}, E:{main:0.0185,upper:0.02},
    J:{main:0.02,upper:0.02}, M:{main:0.08,upper:0.02}, H:{main:0.08,upper:0.02}, I:{main:0.0185,upper:0.02}
  };

  function employeeNI(earnings, category='A') {
    const gross=Math.max(0,earnings), rates=NI_CATEGORIES[category]||NI_CATEGORIES.A;
    const main=Math.max(0,Math.min(gross,50270)-12570), upper=Math.max(0,gross-50270);
    return main*rates.main+upper*rates.upper;
  }

  const STUDENT_LOANS = {
    none:null,
    plan1:{label:'Plan 1',threshold:26900,rate:0.09}, plan2:{label:'Plan 2',threshold:29385,rate:0.09},
    plan4:{label:'Plan 4',threshold:33795,rate:0.09}, plan5:{label:'Plan 5',threshold:25000,rate:0.09},
    postgraduate:{label:'Postgraduate Loan',threshold:21000,rate:0.06}
  };

  function studentLoan(gross, planKey) {
    const plan=STUDENT_LOANS[planKey];
    return plan ? Math.max(0,gross-plan.threshold)*plan.rate : 0;
  }

  function takeHomePay(gross, options={}) {
    const salary=Math.max(0,gross), region=options.region==='scotland'?'scotland':'rUK', niCategory=options.niCategory||'A';
    const pensionPercent=clamp(num(options.pensionPercent),0,40)/100, pensionMethod=options.pensionMethod||'none';
    const salarySacrifice=pensionMethod==='salary-sacrifice'?salary*pensionPercent:0;
    const netPayPension=pensionMethod==='net-pay'?salary*pensionPercent:0;
    const pensionOut=salary*pensionPercent;
    const adjustedNetIncome=Math.max(0,salary-salarySacrifice-netPayPension);
    const allowance=personalAllowance(adjustedNetIncome), taxableIncome=Math.max(0,adjustedNetIncome-allowance);
    const tax=incomeTax(taxableIncome,region), ni=employeeNI(Math.max(0,salary-salarySacrifice),niCategory);
    const student=studentLoan(salary,options.studentPlan||'none'), postgrad=options.postgraduate?studentLoan(salary,'postgraduate'):0;
    const net=Math.max(0,salary-tax-ni-pensionOut-student-postgrad);
    return {salary,tax,ni,pension:pensionOut,salarySacrifice,student,postgrad,net,allowance,taxableIncome,monthly:net/12,fourWeekly:net/13,weekly:net/52,daily:net/260,hourly:net/1950};
  }

  function sdlt(price, options={}) {
    const amount=Math.max(0,price); if(amount<=0)return{tax:0,effectiveRate:0,bands:[]};
    const firstTime=!!options.firstTime, additional=!!options.additional, replacing=!!options.replacing, nonResident=!!options.nonResident;
    const surcharge=(additional&&!replacing?0.05:0)+(nonResident?0.02:0);
    let bands;
    if(firstTime&&amount<=500000) bands=[[0,300000,0],[300000,500000,0.05]];
    else bands=[[0,125000,0],[125000,250000,0.02],[250000,925000,0.05],[925000,1500000,0.10],[1500000,Infinity,0.12]];
    let tax=0; const breakdown=[];
    for(const [low,high,rate] of bands){if(amount<=low)continue;const slice=Math.max(0,Math.min(amount,high)-low);if(!slice)continue;const actualRate=rate+surcharge,charge=slice*actualRate;tax+=charge;breakdown.push({low,high,slice,rate:actualRate,charge});}
    return {tax,effectiveRate:amount?tax/amount:0,surcharge,firstTimeQualifies:firstTime&&amount<=500000,breakdown};
  }

  function vatFromNet(net,rate){const amount=Math.max(0,net),r=Math.max(0,rate)/100,vat=amount*r;return{net:amount,vat,gross:amount+vat};}
  function vatFromGross(gross,rate){const amount=Math.max(0,gross),r=Math.max(0,rate)/100,net=r===0?amount:amount/(1+r);return{gross:amount,net,vat:amount-net};}

  function compoundGrowth(options={}) {
    const starting=Math.max(0,num(options.starting)), contribution=Math.max(0,num(options.contribution)), annualRate=Math.max(0,num(options.annualRate));
    const years=clamp(num(options.years),1,100), contributionFrequency=Math.max(1,num(options.contributionFrequency)||12), compoundingFrequency=Math.max(1,num(options.compoundingFrequency)||12);
    const monthlyRate=annualRate===0?0:Math.pow(1+annualRate/100/compoundingFrequency,compoundingFrequency/12)-1;
    const months=Math.round(years*12), contributionEvery=Math.max(1,Math.round(12/contributionFrequency));
    let balance=starting,totalContributions=0;const yearly=[];
    for(let month=1;month<=months;month+=1){balance*=1+monthlyRate;if(month%contributionEvery===0){balance+=contribution;totalContributions+=contribution;}if(month%12===0||month===months)yearly.push({year:month/12,balance});}
    const totalPrincipal=starting+totalContributions,interest=Math.max(0,balance-totalPrincipal);
    return{finalValue:balance,totalContributions,totalPrincipal,interest,yearly,monthlyRate,effectiveAnnualGrowth:Math.pow(1+monthlyRate,12)-1};
  }

  function loanPayment(principal,annualRate,months,balloon=0){
    const amount=Math.max(0,principal),term=Math.max(1,Math.round(months)),r=Math.max(0,annualRate)/100/12,finalBalloon=clamp(Math.max(0,balloon),0,amount);
    if(r===0)return Math.max(0,(amount-finalBalloon)/term); const discount=Math.pow(1+r,-term),pvBalloon=finalBalloon*discount;
    return Math.max(0,(amount-pvBalloon)*r/(1-discount));
  }

  function carFinance(options={}){
    const vehiclePrice=Math.max(0,num(options.vehiclePrice)),deposit=clamp(Math.max(0,num(options.deposit)),0,vehiclePrice),partExchange=clamp(Math.max(0,num(options.partExchange)),0,vehiclePrice-deposit),fees=Math.max(0,num(options.fees));
    const financed=Math.max(0,vehiclePrice-deposit-partExchange+fees),months=clamp(Math.round(num(options.termMonths)||48),1,120),apr=clamp(num(options.apr),0,100),balloon=clamp(Math.max(0,num(options.balloon)),0,financed),payment=loanPayment(financed,apr,months,balloon),scheduledPayments=payment*months,totalFinanceCost=scheduledPayments+balloon,totalPaid=deposit+partExchange+totalFinanceCost,financeInterest=Math.max(0,totalFinanceCost-financed),cashPrice=vehiclePrice+fees;
    return{vehiclePrice,deposit,partExchange,fees,financed,months,apr,balloon,payment,scheduledPayments,totalFinanceCost,totalPaid,financeInterest,cashPrice,financeExtraCost:Math.max(0,totalPaid-cashPrice)};
  }

  return {clamp,money,pct,personalAllowance,incomeTax,employeeNI,studentLoan,takeHomePay,sdlt,vatFromNet,vatFromGross,compoundGrowth,carFinance};
});