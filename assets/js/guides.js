(function(){
  // ---- Reading progress bar ----
  const bar = document.createElement('div');
  bar.className = 'guide-progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll', ()=>{
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive:true });

  // ---- Guide nav active state ----
  const navLinks = document.querySelectorAll('.guide-nav a');
  const sections = Array.from(navLinks).map(a=> document.querySelector(a.getAttribute('href')));
  const updateActiveNav = ()=>{
    let idx = 0;
    sections.forEach((s,i)=>{ if (s && s.getBoundingClientRect().top < 200) idx = i; });
    navLinks.forEach((a,i)=> a.classList.toggle('is-active', i===idx));
  };
  window.addEventListener('scroll', updateActiveNav, { passive:true });
  updateActiveNav();

  // ---- Annotated statement rows ----
  document.querySelectorAll('.statement-table').forEach(table=>{
    const panel = table.closest('.statement-layout').querySelector('.annotation-panel');
    const titleEl = panel.querySelector('h4');
    const bodyEl = panel.querySelector('p');
    const eyebrowEl = panel.querySelector('.ap-eyebrow');
    const rows = table.querySelectorAll('.st-row');

    function activate(row){
      rows.forEach(r=> r.classList.remove('is-active'));
      row.classList.add('is-active');
      eyebrowEl.textContent = row.dataset.tag || 'Line item';
      titleEl.textContent = row.dataset.title || row.querySelector('.label').textContent.trim();
      bodyEl.textContent = row.dataset.note || '';
    }

    rows.forEach(row=>{
      row.addEventListener('mouseenter', ()=> activate(row));
      row.addEventListener('click', ()=> activate(row));
    });
    if (rows[0]) activate(rows[0]);
  });

  // ---- Self-check exercise ----
  const checkBtn = document.getElementById('check-answers');
  if (checkBtn){
    checkBtn.addEventListener('click', ()=>{
      const inputs = document.querySelectorAll('.blank-card input');
      let correct = 0;
      inputs.forEach(inp=>{
        const answer = parseFloat(inp.dataset.answer);
        const val = parseFloat(inp.value.replace(/,/g,''));
        const ok = Math.abs(val - answer) < 0.5;
        inp.classList.toggle('correct', ok);
        inp.classList.toggle('incorrect', !ok && inp.value.trim() !== '');
        if (ok) correct++;
      });
      document.getElementById('check-result').textContent = `${correct} / ${inputs.length} correct`;
    });
  }
})();
