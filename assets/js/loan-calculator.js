// Loan amortization calculator — math, chart, and slider/number binding.
// Same bespoke-SVG approach as compound-calculator.js, but the color meaning
// is flipped: principal paid (emerald, progress) vs. interest paid (coral, cost).
(function(){
  const form = document.getElementById('loan-form');
  if (!form) return;

  const fields = {
    amount: { range: document.getElementById('amount-range'), num: document.getElementById('amount-num') },
    rate: { range: document.getElementById('loan-rate-range'), num: document.getElementById('loan-rate-num') },
    years: { range: document.getElementById('loan-years-range'), num: document.getElementById('loan-years-num') },
  };

  const chartMount = document.getElementById('loan-chart');
  const paymentEl = document.getElementById('loan-payment');
  const principalEl = document.getElementById('loan-principal');
  const interestEl = document.getElementById('loan-interest');
  const formulaEl = document.getElementById('loan-formula-text');

  const usd = (v, decimals=0) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  function axisLabel(v){
    if (Math.abs(v) >= 1e6) return '$' + (v/1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'M';
    if (Math.abs(v) >= 1e3) return '$' + (v/1e3).toFixed(0) + 'k';
    return '$' + v.toFixed(0);
  }

  function niceStep(rawStep){
    const exp = Math.floor(Math.log10(rawStep || 1));
    const base = rawStep / Math.pow(10, exp);
    const niceBase = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
    return niceBase * Math.pow(10, exp);
  }

  Object.values(fields).forEach(({ range, num }) => {
    range.addEventListener('input', () => { num.value = range.value; recompute(); });
    num.addEventListener('input', () => {
      let v = parseFloat(num.value);
      if (isNaN(v)) return;
      v = Math.min(Math.max(v, parseFloat(range.min)), parseFloat(range.max));
      range.value = v;
      recompute();
    });
  });

  // ---- Core math: standard amortization, simulated month by month so the
  // chart can show cumulative principal vs. interest at each year mark. ----
  function simulate(){
    const P = parseFloat(fields.amount.num.value) || 0;
    const annualRate = (parseFloat(fields.rate.num.value) || 0) / 100;
    const years = parseInt(fields.years.num.value, 10) || 1;
    const r = annualRate / 12;
    const n = years * 12;

    const M = r === 0 ? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    let balance = P, cumPrincipal = 0, cumInterest = 0;
    const points = [{ year: 0, balance: P, cumPrincipal: 0, cumInterest: 0 }];
    for (let m = 1; m <= n; m++){
      const interestPortion = balance * r;
      let principalPortion = M - interestPortion;
      if (principalPortion > balance) principalPortion = balance;
      balance = Math.max(balance - principalPortion, 0);
      cumPrincipal += principalPortion;
      cumInterest += interestPortion;
      if (m % 12 === 0 || m === n){
        points.push({ year: m / 12, balance, cumPrincipal, cumInterest });
      }
    }
    return { monthlyPayment: M, points, totalInterest: cumInterest, totalPrincipal: cumPrincipal };
  }

  function renderChart(points){
    const W = 760, H = 320, padL = 54, padR = 20, padT = 16, padB = 30;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const last = points[points.length - 1];
    const maxVal = (last.cumPrincipal + last.cumInterest) * 1.08 || 1;
    const step = niceStep(maxVal / 4);
    const niceMax = step * Math.ceil(maxVal / step);

    const n = points.length - 1;
    const xFor = i => padL + (innerW / n) * i;
    const yFor = v => padT + innerH - (v / niceMax) * innerH;

    const gridCount = Math.round(niceMax / step);
    let grid = '';
    for (let i = 0; i <= gridCount; i++){
      const v = i * step;
      const y = yFor(v);
      grid += `<line class="axis-line" x1="${padL}" x2="${W-padR}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      grid += `<text x="${padL-8}" y="${(y+3).toFixed(1)}" font-size="10" text-anchor="end">${axisLabel(v)}</text>`;
    }

    const xTickEvery = n > 20 ? 10 : n > 10 ? 5 : 1;
    let xLabels = '';
    points.forEach((p, i) => {
      if (i % xTickEvery === 0 || i === n){
        xLabels += `<text x="${xFor(i).toFixed(1)}" y="${H-8}" font-size="10" text-anchor="middle">${p.year}</text>`;
      }
    });

    const principalPoints = points.map((p,i) => `${xFor(i).toFixed(1)},${yFor(p.cumPrincipal).toFixed(1)}`).join(' ');
    const principalArea = `M ${xFor(0)},${yFor(0).toFixed(1)} L ${principalPoints.split(' ').join(' L ')} L ${xFor(n).toFixed(1)},${yFor(0).toFixed(1)} Z`;

    const totalPoints = points.map((p,i) => `${xFor(i).toFixed(1)},${yFor(p.cumPrincipal + p.cumInterest).toFixed(1)}`).join(' ');
    const bottomReversed = points.map((p,i) => `${xFor(n-i).toFixed(1)},${yFor(points[n-i].cumPrincipal).toFixed(1)}`).join(' L ');
    const totalArea = `M ${totalPoints.split(' ')[0]} L ${totalPoints.split(' ').join(' L ')} L ${bottomReversed} Z`;

    const lastX = xFor(n), lastY = yFor(last.cumPrincipal + last.cumInterest);

    chartMount.innerHTML = `
      <svg class="calc-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative principal and interest paid over the life of the loan">
        ${grid}
        <path d="${principalArea}" fill="#4bf0b3" fill-opacity="0.24"/>
        <path d="${totalArea}" fill="#ff6a51" fill-opacity="0.22"/>
        <polyline points="${totalPoints}" fill="none" stroke="#ff6a51" stroke-width="2"/>
        <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4.5" fill="#ff6a51" stroke="#08090b" stroke-width="2"/>
        ${xLabels}
      </svg>
    `;
  }

  function recompute(){
    const { monthlyPayment, points, totalInterest, totalPrincipal } = simulate();

    paymentEl.textContent = usd(monthlyPayment, 0);
    principalEl.textContent = usd(totalPrincipal);
    interestEl.textContent = usd(totalInterest);

    const amount = parseFloat(fields.amount.num.value) || 0;
    const rate = parseFloat(fields.rate.num.value) || 0;
    const years = fields.years.num.value;
    const pctOfLoan = amount > 0 ? Math.round((totalInterest / amount) * 100) : 0;
    formulaEl.textContent = `A ${usd(amount)} loan at ${rate}% over ${years} years costs ${usd(monthlyPayment)}/mo — ${usd(totalInterest)} in total interest, ${pctOfLoan}% of what you borrowed.`;

    renderChart(points);
  }

  recompute();
})();
