(function(){
  const data = (window.GLOSSARY_TERMS || []).slice().sort((a,b)=> a.term.localeCompare(b.term));
  const listEl = document.getElementById('glossary-list');
  const searchInput = document.getElementById('glossary-search');
  const countEl = document.getElementById('glossary-count');
  const chips = document.querySelectorAll('.chip[data-family]');
  const azRail = document.getElementById('az-rail');
  const noResults = document.getElementById('no-results');
  if (!listEl) return;

  let activeFamily = 'all';
  let query = '';

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const presentLetters = new Set(data.map(d=> d.term[0].toUpperCase()));
  azRail.innerHTML = letters.map(l=>
    `<a href="#letter-${l}" class="${presentLetters.has(l) ? 'has-terms' : ''}" data-letter="${l}">${l}</a>`
  ).join('');

  function iconSvg(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
  }

  function render(){
    const q = query.trim().toLowerCase();
    const filtered = data.filter(d=>{
      const familyMatch = activeFamily === 'all' || d.family === activeFamily;
      const qMatch = !q || d.term.toLowerCase().includes(q) || d.def.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      return familyMatch && qMatch;
    });

    countEl.textContent = `${filtered.length} term${filtered.length===1?'':'s'}`;
    noResults.classList.toggle('is-visible', filtered.length === 0);

    const groups = {};
    filtered.forEach(d=>{
      const l = d.term[0].toUpperCase();
      (groups[l] = groups[l] || []).push(d);
    });

    listEl.innerHTML = Object.keys(groups).sort().map(letter=>{
      const cards = groups[letter].map(d=> `
        <article class="term-entry" data-family="${d.family}" tabindex="0" role="button" aria-expanded="false">
          <div class="term-entry-head">
            <h3>${d.term}</h3>
            ${iconSvg()}
          </div>
          <p class="term-def">${d.def}</p>
          <div class="term-body"><div class="term-body-inner">
            <div class="term-signal"><b>Why it matters</b>${d.signal}</div>
            <div class="term-tags"><span class="badge ${d.family==='statements'?'emerald':d.family==='markets'?'amber':'coral'}">${d.category}</span></div>
          </div></div>
        </article>
      `).join('');
      return `<div class="letter-group" id="letter-${letter}">
        <div class="letter-heading">${letter}</div>
        <div class="term-grid">${cards}</div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.term-entry').forEach(entry=>{
      const toggle = ()=>{
        const open = entry.classList.toggle('is-open');
        entry.setAttribute('aria-expanded', String(open));
      };
      entry.addEventListener('click', toggle);
      entry.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
      });
    });
  }

  searchInput.addEventListener('input', (e)=>{ query = e.target.value; render(); });
  chips.forEach(chip=>{
    chip.addEventListener('click', ()=>{
      chips.forEach(c=> c.classList.remove('is-active'));
      chip.classList.add('is-active');
      activeFamily = chip.dataset.family;
      render();
    });
  });

  // Highlight active letter in rail on scroll
  const onScroll = ()=>{
    let current = null;
    document.querySelectorAll('.letter-group').forEach(g=>{
      if (g.getBoundingClientRect().top < 160) current = g.id.replace('letter-','');
    });
    azRail.querySelectorAll('a').forEach(a=> a.classList.toggle('is-active', a.dataset.letter === current));
  };
  window.addEventListener('scroll', onScroll, { passive:true });

  render();
})();
