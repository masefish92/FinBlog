// Compound interest calculator — math, chart, and two-way slider/number binding.
// No chart library: hand-drawn stacked-area SVG matching the site's bespoke chart style.
(function(){
  const form = document.getElementById('calc-form');
  if (!form) return;

  const fields = {
    initial: { range: document.getElementById('initial-range'), num: document.getElementById('initial-num') },
    monthly: { range: document.getElementById('monthly-range'), num: document.getElementById('monthly-num') },
    rate: { range: document.getElementById('rate-range'), num: document.getElementById('rate-num') },
    years: { range: document.getElementById('years-range'), num: document.getElementById('years-num') },
  };
  const freqButtons = document.querySelectorAll('.freq-toggle button');
  let frequency = 12; // compounds per year: 1, 12, or 365

  const chartMount = document.getElementById('calc-chart');
  const finalValueEl = document.getElementById('calc-final-value');
  const principalEl = document.getElementById('calc-principal');
  const interestEl = document.getElementById('calc-interest');
  const formulaEl = document.getElementById('calc-formula-text');

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

  // ---- Bind each range <-> number pair ----
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

  freqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      freqButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      frequency = parseInt(btn.dataset.freq, 10);
      recompute();
    });
  });

  // ---- Core math: simulate month by month so any compounding frequency
  // (annual/monthly/daily) and monthly contributions combine correctly. ----
  function simulate(){
    const P0 = parseFloat(fields.initial.num.value) || 0;
    const C = parseFloat(fields.monthly.num.value) || 0;
    const r = (parseFloat(fields.rate.num.value) || 0) / 100;
    const years = parseInt(fields.years.num.value, 10) || 1;

    // Effective monthly growth factor for the chosen compounding frequency,
    // derived so it's mathematically consistent whichever frequency is picked.
    const monthlyGrowth = Math.pow(1 + r / frequency, frequency / 12) - 1;

    const points = [{ year: 0, total: P0, contributed: P0 }];
    let balance = P0;
    let contributed = P0;
    for (let m = 1; m <= years * 12; m++){
      balance += C;
      contributed += C;
      balance *= (1 + monthlyGrowth);
      if (m % 12 === 0){
        points.push({ year: m / 12, total: balance, contributed });
      }
    }
    return points;
  }

  function renderChart(points){
    const W = 760, H = 320, padL = 54, padR = 20, padT = 16, padB = 30;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const maxVal = Math.max(...points.map(p => p.total)) * 1.08 || 1;
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

    // Plain "x,y x,y ..." point lists (for <polyline>) are kept separate from the
    // "x,y L x,y ..." path-command strings (for <path d="...">) — polyline doesn't
    // understand "L" commands.
    const contribPoints = points.map((p,i) => `${xFor(i).toFixed(1)},${yFor(p.contributed).toFixed(1)}`).join(' ');
    const contribArea = `M ${xFor(0)},${yFor(0).toFixed(1)} L ${contribPoints.split(' ').join(' L ')} L ${xFor(n).toFixed(1)},${yFor(0).toFixed(1)} Z`;

    const totalPoints = points.map((p,i) => `${xFor(i).toFixed(1)},${yFor(p.total).toFixed(1)}`).join(' ');
    const totalAreaBottom = points.map((p,i) => `${xFor(n-i).toFixed(1)},${yFor(points[n-i].contributed).toFixed(1)}`).join(' L ');
    const totalArea = `M ${totalPoints.split(' ')[0]} L ${totalPoints.split(' ').join(' L ')} L ${totalAreaBottom} Z`;

    const last = points[n];
    const lastX = xFor(n), lastY = yFor(last.total);

    chartMount.innerHTML = `
      <svg class="calc-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Growth of investment over time">
        ${grid}
        <path d="${contribArea}" fill="#e7a63e" fill-opacity="0.28"/>
        <path d="${totalArea}" fill="#4bf0b3" fill-opacity="0.22"/>
        <polyline class="top-line" points="${totalPoints}"/>
        <circle class="final-dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4.5"/>
        ${xLabels}
      </svg>
    `;
  }

  function recompute(){
    const points = simulate();
    const last = points[points.length - 1];
    const interest = last.total - last.contributed;

    finalValueEl.textContent = usd(last.total);
    principalEl.textContent = usd(last.contributed);
    interestEl.textContent = usd(interest);

    const r = parseFloat(fields.rate.num.value) || 0;
    const freqWord = frequency === 1 ? 'annually' : frequency === 12 ? 'monthly' : 'daily';
    formulaEl.textContent = `Compounding ${freqWord} at ${r}% per year turns ${usd(parseFloat(fields.initial.num.value)||0)} plus ${usd(parseFloat(fields.monthly.num.value)||0)}/mo into ${usd(last.total)} after ${fields.years.num.value} years — ${usd(interest)} of that is interest, not your own money.`;

    renderChart(points);
  }

  recompute();
})();
