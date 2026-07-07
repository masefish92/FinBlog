// Bespoke revenue (bar) + gross margin (line) chart. No charting library —
// computes its own scales and draws raw SVG so it matches the site's hand-built aesthetic.
function renderRevenueMarginChart(mount, { years, revenue, margin, barColor, lineColor }){
  const W = 760, H = 340, padL = 46, padR = 46, padT = 20, padB = 34;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = years.length;
  const gap = innerW / n * 0.32;
  const barW = (innerW / n) - gap;
  const maxRev = Math.max(...revenue) * 1.15;
  const maxMargin = 100;

  const xFor = (i)=> padL + (innerW / n) * i + gap/2;
  const yForRev = (v)=> padT + innerH - (v / maxRev) * innerH;
  const yForMargin = (v)=> padT + innerH - (v / maxMargin) * innerH;

  const bars = revenue.map((v,i)=>
    `<rect class="bar" x="${xFor(i).toFixed(1)}" y="${yForRev(v).toFixed(1)}" width="${barW.toFixed(1)}" height="${(innerH - (yForRev(v)-padT)).toFixed(1)}" rx="4" fill="${barColor}">
      <title>${years[i]}: $${v}B revenue</title>
    </rect>`
  ).join('');

  const linePts = margin.map((v,i)=> `${(xFor(i)+barW/2).toFixed(1)},${yForMargin(v).toFixed(1)}`).join(' ');
  const dots = margin.map((v,i)=>
    `<circle cx="${(xFor(i)+barW/2).toFixed(1)}" cy="${yForMargin(v).toFixed(1)}" r="3.5" fill="${lineColor}"><title>${years[i]}: ${v}% gross margin</title></circle>`
  ).join('');

  const xLabels = years.map((y,i)=>
    `<text x="${(xFor(i)+barW/2).toFixed(1)}" y="${H-10}" font-size="10" fill="var(--text-tertiary, #999)" text-anchor="middle">${y}</text>`
  ).join('');

  const gridLines = [0.25,0.5,0.75,1].map(f=>
    `<line x1="${padL}" x2="${W-padR}" y1="${(padT + innerH*(1-f)).toFixed(1)}" y2="${(padT + innerH*(1-f)).toFixed(1)}" stroke="var(--hairline, rgba(255,255,255,.08))" stroke-width="1"/>`
  ).join('');

  mount.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Revenue and gross margin over time">
      ${gridLines}
      ${bars}
      <polyline points="${linePts}" fill="none" stroke="${lineColor}" stroke-width="2"/>
      ${dots}
      ${xLabels}
    </svg>
  `;
}
