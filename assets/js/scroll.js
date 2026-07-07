// Smooth scroll (Lenis) + GSAP ScrollTrigger wiring + reveal primitives.
// Expects gsap, ScrollTrigger and Lenis to be loaded from CDN before this file.
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Lenis smooth scroll ----
  // Exactly one driver for lenis.raf(): GSAP's ticker when GSAP is present
  // (required for ScrollTrigger sync), otherwise a plain rAF loop. Driving
  // both at once double-steps Lenis's internal velocity math and produces
  // a stuck-then-snaps scroll feel.
  if (window.Lenis && !reduced){
    const lenis = window.__lenis = new Lenis({
      duration: 1.1,
      easing: (t)=> Math.min(1, 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (window.gsap){
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time)=> lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    document.documentElement.classList.add('has-lenis');
  }

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // ---- Generic reveal-on-scroll ----
  gsap.utils.toArray('[data-reveal]').forEach((el, i)=>{
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: ()=> el.classList.add('is-visible'),
    });
  });

  // ---- Split-line headline reveal ----
  // Wraps each line already split via data-split-ready markup (see splitLines()).
  function splitLines(el){
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const lineWrap = document.createElement('span');
    lineWrap.className = 'split-line';
    words.forEach((w, i)=>{
      const s = document.createElement('span');
      s.textContent = w + (i < words.length-1 ? ' ' : '');
      lineWrap.appendChild(s);
    });
    el.appendChild(lineWrap);
    return lineWrap.querySelectorAll(':scope > span');
  }

  document.querySelectorAll('[data-split]').forEach((el)=>{
    const spans = splitLines(el);
    gsap.set(spans, { yPercent:110, opacity:0 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once:true,
      onEnter: ()=>{
        gsap.to(spans, {
          yPercent:0, opacity:1, duration:1, ease:'power4.out',
          stagger:0.045,
        });
      }
    });
  });

  // ---- Number counters ----
  document.querySelectorAll('[data-count]').forEach((el)=>{
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    ScrollTrigger.create({
      trigger: el, start:'top 90%', once:true,
      onEnter: ()=>{
        const obj = { v:0 };
        gsap.to(obj, {
          v:target, duration:1.6, ease:'power2.out',
          onUpdate: ()=>{ el.textContent = prefix + obj.v.toFixed(decimals) + suffix; }
        });
      }
    });
  });

  // ---- Parallax layers ----
  gsap.utils.toArray('[data-parallax]').forEach((el)=>{
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: speed * 100,
      ease:'none',
      scrollTrigger:{ trigger: el.closest('[data-parallax-wrap]') || el.parentElement, start:'top bottom', end:'bottom top', scrub:true }
    });
  });

  // ---- Horizontal scroll sections ----
  document.querySelectorAll('[data-hscroll]').forEach((wrap)=>{
    const track = wrap.querySelector('[data-hscroll-track]');
    if (!track) return;
    const getDistance = ()=> track.scrollWidth - wrap.clientWidth;
    gsap.to(track, {
      x: ()=> -getDistance(),
      ease:'none',
      scrollTrigger:{
        trigger: wrap, start:'top top', end:()=> '+=' + (getDistance()+window.innerHeight*0.5),
        scrub:0.6, pin:true, invalidateOnRefresh:true,
      }
    });
  });
})();
