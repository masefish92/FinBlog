// Cursor-follow spotlight glow for card surfaces. Pure background-image
// (never a stacked pseudo-element), so it can never paint over content.
(function(){
  if (window.matchMedia('(hover:none), (pointer:coarse)').matches) return;
  document.querySelectorAll('.pillar, .rt-card, .chart-card').forEach((el)=>{
    el.addEventListener('mousemove', (e)=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
})();
