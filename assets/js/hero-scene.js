// Generative WebGL hero — a noise-displaced icosahedral "growth form"
// shaded with a custom fresnel gradient (ink -> emerald -> amber).
// Built from primitives + hand-written GLSL, no external 3D assets.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero-canvas');
if (canvas){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, canvas.clientWidth/canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const noiseGLSL = `
    vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0,0.5,1.0,2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `;

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPos;
    varying float vNoise;
    uniform float uTime;
    uniform float uAmp;
    ${noiseGLSL}
    void main(){
      vec3 p = position;
      float n = snoise(p * 1.15 + vec3(0.0, 0.0, uTime * 0.12));
      float n2 = snoise(p * 2.6 - vec3(uTime * 0.08));
      float disp = n * uAmp + n2 * uAmp * 0.25;
      vec3 displaced = p + normal * disp;
      vNormal = normalize(normalMatrix * normal);
      vPos = (modelViewMatrix * vec4(displaced,1.0)).xyz;
      vNoise = n * 0.5 + n2 * 0.5;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPos;
    varying float vNoise;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    void main(){
      vec3 viewDir = normalize(-vPos);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.2);
      float core = smoothstep(-0.6, 0.9, vNoise) * (1.0 - fresnel);
      vec3 base = mix(uColorA, uColorA * 2.6 + uColorB * 0.25, core * 0.5);
      base = mix(base, uColorB, fresnel);
      base = mix(base, uColorC, pow(fresnel, 3.5));
      float rim = smoothstep(0.55, 1.0, fresnel);
      gl_FragColor = vec4(base + rim * 0.35, 0.92);
    }
  `;

  const geometry = new THREE.IcosahedronGeometry(1.9, 64);
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms:{
      uTime:{ value:0 },
      uAmp:{ value: reduced ? 0.05 : 0.16 },
      uColorA:{ value:new THREE.Color(0x0d0f12) },
      uColorB:{ value:new THREE.Color(0x18a97a) },
      uColorC:{ value:new THREE.Color(0xffcb6b) },
    },
    transparent:true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Cheap outer glow shell: additive, backside, slightly larger.
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader:`
      varying vec3 vNormal; varying vec3 vPos;
      void main(){
        vec3 viewDir = normalize(-vPos);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 1.6);
        gl_FragColor = vec4(vec3(0.29,0.94,0.7) * fresnel, fresnel * 0.5);
      }
    `,
    uniforms: material.uniforms,
    transparent:true,
    blending:THREE.AdditiveBlending,
    side:THREE.BackSide,
    depthWrite:false,
  });
  const glow = new THREE.Mesh(geometry, glowMaterial);
  glow.scale.setScalar(1.12);
  scene.add(glow);

  // Sparse point field — quiet "data points" drifting behind the form.
  const ptCount = 260;
  const ptGeo = new THREE.BufferGeometry();
  const ptPos = new Float32Array(ptCount*3);
  for (let i=0;i<ptCount;i++){
    const r = 4.5 + Math.random()*4;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(Math.random()*2-1);
    ptPos[i*3] = r*Math.sin(phi)*Math.cos(theta);
    ptPos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    ptPos[i*3+2] = r*Math.cos(phi) - 3.0;
  }
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos,3));
  const ptMat = new THREE.PointsMaterial({ color:0xf8f3e8, size:0.018, transparent:true, opacity:0.35 });
  const points = new THREE.Points(ptGeo, ptMat);
  scene.add(points);

  let targetX = 0, targetY = 0;
  window.addEventListener('pointermove', (e)=>{
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
  });

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function animate(){
    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;
    mesh.rotation.y = t * (reduced ? 0.02 : 0.09);
    mesh.rotation.x = Math.sin(t*0.15)*0.15;
    glow.rotation.copy(mesh.rotation);
    points.rotation.y = t * 0.015;

    camera.position.x += (targetX*1.1 - camera.position.x) * 0.03;
    camera.position.y += (-targetY*0.8 - camera.position.y) * 0.03;
    camera.lookAt(0,0,0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
