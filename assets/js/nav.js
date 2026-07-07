// Header scroll state + mobile nav toggle + grain overlay injection
(function(){
  const header = document.querySelector('.site-header');
  if (header){
    const onScroll = ()=>{
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links){
    toggle.addEventListener('click', ()=>{
      const open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', ()=>{
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // Procedural grain via inline SVG turbulence — no image asset needed.
  const grain = document.createElement('div');
  grain.className = 'grain';
  grain.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`;
  document.body.appendChild(grain);

  // Active nav link
  const path = location.pathname.split('/').filter(Boolean);
  const section = path[0] || '';
  document.querySelectorAll('.nav-links a[data-section]').forEach(a=>{
    if (a.dataset.section === section) a.classList.add('is-active');
  });
})();
