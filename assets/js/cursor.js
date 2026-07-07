// Custom cursor: dot snaps instantly, ring trails with easing.
(function(){
  if (window.matchMedia('(hover:none), (pointer:coarse)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e)=>{
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });

  function tick(){
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('mousedown', ()=> ring.classList.add('is-down'));
  document.addEventListener('mouseup', ()=> ring.classList.remove('is-down'));

  const hoverables = 'a, button, .btn, [data-cursor-hover]';
  document.addEventListener('mouseover', (e)=>{
    if (e.target.closest(hoverables)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e)=>{
    if (e.target.closest(hoverables)) ring.classList.remove('is-hover');
  });
})();
