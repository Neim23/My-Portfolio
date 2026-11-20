(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- pixel canvas: embers + ripples (low-res, upscaled) ---------- */
const cv=$('#fx'), ctx=cv.getContext('2d'), S=4; // 1 canvas pixel = 4 screen px
let W,H; const ripples=[], embers=[];
function resize(){W=Math.ceil(innerWidth/S);H=Math.ceil(innerHeight/S);cv.width=W;cv.height=H;initBlood()}
let P={},COLORS=[];
function readPalette(){const st=getComputedStyle(document.body),g=n=>st.getPropertyValue(n).trim();
  P={a:g('--or'),b:g('--or2'),c:g('--or3'),d:g('--hi')};COLORS=[P.a,P.b,P.c,P.d]}
readPalette();
function spawnEmber(init){embers.push({x:Math.random()*W,y:init?Math.random()*H:H+2,v:.08+Math.random()*.25,ci:Math.random()*4|0,a:.2+Math.random()*.5,w:Math.random()*6})}

function ring(cx,cy,r,col,alpha,thick){
  ctx.globalAlpha=alpha;ctx.fillStyle=col;
  const n=Math.max(12,Math.ceil(r*7)), seen=new Set();
  for(let i=0;i<n;i++){const a=i/n*6.2832;
    const x=Math.round(cx+Math.cos(a)*r), y=Math.round(cy+Math.sin(a)*r), k=x+','+y;
    if(seen.has(k))continue; seen.add(k); ctx.fillRect(x,y,thick,thick)}
}
/* ---------- blood: pixel drips down the walls ---------- */
const blood={on:false,level:0,tgt:[],bot:[],drips:[],last:0};
function initBlood(){
  const sm=(x,a,b)=>Math.sin(x*a+b);
  blood.tgt=Array.from({length:W},(_,x)=>6+4*(sm(x,.07,1)+.6*sm(x,.21,2)+.3*sm(x,.5,3))+Math.random()*2);
  blood.bot=Array.from({length:W},(_,x)=>1+1.6*(sm(x,.09,4)+.5*sm(x,.31,5)+1.3)+Math.random());
  blood.drips.length=0;
}
function bloodFrame(t){
  const dt=Math.min(64,t-blood.last||16);blood.last=t;
  blood.level=Math.max(0,Math.min(1,blood.level+(blood.on?dt/1600:-dt/900)));
  if(blood.level<=0&&!blood.on){blood.drips.length=0;return}
  const L=blood.level, top=blood.tgt, bot=blood.bot;
  // spawn
  if(blood.on&&L>.3&&blood.drips.length<60&&Math.random()<.22){
    const edge=Math.random()<.35, x=edge?(Math.random()<.5?Math.random()*5|0:W-1-(Math.random()*5|0)):Math.random()*W|0;
    blood.drips.push({x,w:edge?2:(Math.random()<.3?2:1),len:top[x]*L,v:.12+Math.random()*.4,max:H*(.12+Math.random()*.8),age:0,a:1});
  }
  for(let i=blood.drips.length-1;i>=0;i--){const d=blood.drips[i];
    if(!blood.on)d.a-=dt/500;
    if(d.len<d.max){d.len+=d.v*(dt/16);d.v*=.9985;if(Math.random()<.004)d.v*=.3;if(d.v<.015)d.max=d.len}
    else{d.age+=dt;if(d.age>3500)d.a-=dt/1400}
    if(d.a<=0){blood.drips.splice(i,1);continue}
  }
  ctx.globalAlpha=1;
  // top pool
  for(let x=0;x<W;x++){const h=top[x]*L|0;if(h<1)continue;
    ctx.fillStyle='#a40000';ctx.fillRect(x,0,1,h);ctx.fillStyle='#ff2020';ctx.fillRect(x,h-1,1,1);if(x%7<2){ctx.fillStyle='#d01010';ctx.fillRect(x,2,1,h-3)}}
  // bottom pool (grows slowly once there's blood)
  for(let x=0;x<W;x++){const h=bot[x]*L|0;if(h<1)continue;
    ctx.fillStyle='#780000';ctx.fillRect(x,H-h,1,h);ctx.fillStyle='#e01818';ctx.fillRect(x,H-h,1,1)}
  // drips
  for(const d of blood.drips){const l=d.len|0;ctx.globalAlpha=Math.max(0,d.a);
    ctx.fillStyle='#b00000';ctx.fillRect(d.x,0,d.w,l);
    ctx.fillStyle='#ff2a2a';ctx.fillRect(d.x,0,1,l);          // wet highlight
    ctx.fillStyle='#d41414';ctx.fillRect(d.x-1,l-1,d.w+2,2);  // droplet head
    ctx.fillStyle='#ff8080';ctx.fillRect(d.x,l-1,1,1)}
  ctx.globalAlpha=1;
}
resize(); addEventListener('resize',resize);
for(let i=0;i<70;i++)spawnEmber(true);
function frame(t){
  ctx.clearRect(0,0,W,H);
  for(const e of embers){e.y-=e.v;e.x+=Math.sin(t/900+e.w)*.08;
    if(e.y<-2){e.y=H+2;e.x=Math.random()*W}
    ctx.globalAlpha=e.a;ctx.fillStyle=COLORS[e.ci];ctx.fillRect(e.x|0,e.y|0,1,1)}
  for(let i=ripples.length-1;i>=0;i--){const p=ripples[i], k=(t-p.t)/p.life;
    if(k>=1){ripples.splice(i,1);continue}
    const r=k*p.max, fade=1-k;
    ring(p.x,p.y,r,P.a,fade,2);
    if(k>.12)ring(p.x,p.y,r*.72,P.b,fade*.8,1);
    if(k>.28)ring(p.x,p.y,r*.45,P.c,fade*.6,1);
    // splash droplets
    for(const d of p.drops){const dx=p.x+d.dx*k*p.max*.6, dy=p.y+d.dy*k*p.max*.6+k*k*18;
      ctx.globalAlpha=fade;ctx.fillStyle=P.d;ctx.fillRect(dx|0,dy|0,1,1)}
  }
  bloodFrame(t);
  ctx.globalAlpha=1; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function ripple(x,y){
  if(reduce)return;
  const drops=Array.from({length:10},()=>{const a=Math.random()*6.28;return{dx:Math.cos(a),dy:Math.sin(a)-.4}});
  ripples.push({x:x/S,y:y/S,t:performance.now(),life:1100,max:34+Math.random()*10,drops});
  if(ripples.length>14)ripples.shift();
}
// ripple on empty areas only (not links, buttons, cards, headings text excluded)
addEventListener('pointerdown',e=>{
  if(e.target.closest('a,button,.card,.modal,h1 span,.stat,.btn'))return;
  ripple(e.clientX,e.clientY);
});

/* ---------- typed subtitle ---------- */
const typed=$('#typed'), full=typed.dataset.text; let ti=0;
function type(){ if(reduce){typed.textContent=full;return}
  typed.textContent=full.slice(0,++ti); if(ti<full.length)setTimeout(type,40+Math.random()*50)}
setTimeout(type,500);

/* ---------- hero letters: click = ripple + glitch ---------- */
const title=$('#title');
$$('#title span').forEach(s=>s.addEventListener('click',e=>{
  const r=s.getBoundingClientRect(); ripple(r.left+r.width/2,r.top+r.height/2);
  title.classList.remove('glitch'); void title.offsetWidth; title.classList.add('glitch');
}));

/* ---------- clock, year ---------- */
const clock=$('#clock'); const tick=()=>clock.textContent=new Date().toLocaleTimeString('en-GB'); tick(); setInterval(tick,1000);
$('#yr').textContent=new Date().getFullYear();

/* ---------- scroll: progress bar, reveal, stat counters ---------- */
const bar=$('#bar');
addEventListener('scroll',()=>{const m=document.documentElement.scrollHeight-innerHeight;bar.style.width=(scrollY/m*100)+'%'},{passive:true});
function countUp(el,to){let n=0;const step=Math.max(1,Math.ceil(to/30));
  const iv=setInterval(()=>{n=Math.min(to,n+step);el.textContent=n;if(n>=to)clearInterval(iv)},40)}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;
  e.target.classList.add('in');
  e.target.querySelectorAll('.stat').forEach(s=>countUp(s.querySelector('b'),+s.dataset.v));
  io.unobserve(e.target)}),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));

/* footer countdown */
let c=10; const cnt=$('#count');
new IntersectionObserver(([e])=>{if(e.isIntersecting&&!cnt._t){cnt._t=setInterval(()=>{c=c<=0?10:c-1;cnt.textContent=c},1000)}}).observe(cnt);

/* ---------- 3D tilt on cards ---------- */
$$('.card').forEach(card=>{
  card.addEventListener('pointermove',e=>{ if(e.pointerType==='touch')return;
    const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    card.style.transform=`perspective(700px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-6px)`});
  card.addEventListener('pointerleave',()=>card.style.transform='');
  card.addEventListener('click',e=>{ripple(e.clientX,e.clientY);open(card)});
});

/* ---------- lightbox ---------- */
const modal=$('#modal'); let last;
function open(card){last=card;$('#mimg').src=card.dataset.img;$('#mimg').alt=card.dataset.title;$('#mcap').textContent=card.dataset.title;modal.hidden=false;$('#mx').focus()}
function close(){modal.hidden=true;last&&last.focus()}
$('#mx').onclick=close; modal.addEventListener('click',e=>{if(e.target===modal)close()});

/* ---------- toast ---------- */
const toast=$('#toast'); let tt;
function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('on'),3200)}

/* ---------- creepy sound (Web Audio, no files) ---------- */
let AC;
const ac=()=>{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC};
function noise(a,sec){const b=a.createBuffer(1,a.sampleRate*sec,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function thump(a,m,t,f,g0){const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.45,t+.18);
  g.gain.setValueAtTime(g0,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g).connect(m);o.start(t);o.stop(t+.25)}
function sfxOn(){ try{
  const a=ac(),t=a.currentTime,m=a.createGain();m.gain.value=.75;m.connect(a.destination);
  thump(a,m,t,150,1.2);                                               // impact boom
  const n=a.createBufferSource();n.buffer=noise(a,.6);const nf=a.createBiquadFilter(),ng=a.createGain();
  nf.type='lowpass';nf.frequency.setValueAtTime(6000,t);nf.frequency.exponentialRampToValueAtTime(150,t+.5);
  ng.gain.setValueAtTime(.9,t);ng.gain.exponentialRampToValueAtTime(.001,t+.5);n.connect(nf).connect(ng).connect(m);n.start(t); // crack
  const dg=a.createGain(),lp=a.createBiquadFilter(),lfo=a.createOscillator(),lg=a.createGain();                               // dissonant drone
  dg.gain.setValueAtTime(0,t+.1);dg.gain.linearRampToValueAtTime(.3,t+1.2);dg.gain.linearRampToValueAtTime(.22,t+3.5);dg.gain.exponentialRampToValueAtTime(.001,t+6.2);
  lp.type='lowpass';lp.frequency.value=320;lp.Q.value=7;lfo.frequency.value=.4;lg.gain.value=200;lfo.connect(lg).connect(lp.frequency);lfo.start(t);lfo.stop(t+6.4);
  [55,58.3,77.8,41.2].forEach(f=>{const o=a.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(lp);o.start(t);o.stop(t+6.4)});
  lp.connect(dg).connect(m);
  const hg=a.createGain();hg.gain.setValueAtTime(0,t+.6);hg.gain.linearRampToValueAtTime(.045,t+2.2);hg.gain.exponentialRampToValueAtTime(.001,t+5.8);hg.connect(m); // ghostly whine
  [1397,1480,2093].forEach(f=>{const o=a.createOscillator(),v=a.createOscillator(),vg=a.createGain();o.type='sine';o.frequency.value=f;v.frequency.value=5+Math.random()*2;vg.gain.value=10;
    v.connect(vg).connect(o.frequency);o.connect(hg);v.start(t);o.start(t+.6);v.stop(t+5.9);o.stop(t+5.9)});
  [1.4,1.68,2.7,2.98,4.0,4.28].forEach((d,i)=>thump(a,m,t+d,70,i%2?.5:.75)); // heartbeat
  const w=a.createBufferSource();w.buffer=noise(a,3);const wf=a.createBiquadFilter(),wg=a.createGain();                       // whisper
  wf.type='bandpass';wf.frequency.value=2600;wf.Q.value=1.4;wg.gain.setValueAtTime(0,t+1);wg.gain.linearRampToValueAtTime(.06,t+2.2);wg.gain.linearRampToValueAtTime(0,t+4.2);
  w.connect(wf).connect(wg).connect(m);w.start(t+1);
}catch(e){} }
function sfxOff(){ try{
  const a=ac(),t=a.currentTime,m=a.createGain();m.gain.value=.5;m.connect(a.destination);
  const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(420,t+.6);
  g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(g).connect(m);o.start(t);o.stop(t+.8);
}catch(e){} }

/* ---------- secret: blood mode (↑↑↓↓←→←→ B A, or 15 touch taps in 5s) ---------- */
const imp=$('#impact'), tagtxt=$('#tagtxt'), tagOrig=tagtxt.textContent; let busy=false;
function applyBlood(on){
  document.body.classList.toggle('blood',on); readPalette(); blood.on=on;
  tagtxt.textContent=on?'> PLAYER ONE IS NOT ALONE':tagOrig;
  say(on?'☠ IT KNOWS YOU\'RE HERE ☠':'THE LIGHTS ARE BACK');
}
function toggleBlood(){
  if(busy)return; busy=true; const on=!document.body.classList.contains('blood');
  on?sfxOn():sfxOff();
  if(reduce){applyBlood(on);busy=false;return}
  const step=(cls,ms)=>new Promise(r=>{imp.className='on '+cls;setTimeout(r,ms)});
  (async()=>{
    await step('f1',60);                       // white flash
    await step('f2',110);                      // black + speed lines
    applyBlood(on); await step('f3',90);       // red cut — palette swaps here, hidden by the frame
    document.body.classList.add('shake'); imp.className='on fade';
    setTimeout(()=>{imp.className='';document.body.classList.remove('shake');busy=false},520);
  })();
}
const K=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']; let ki=0;
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!modal.hidden)close();
  ki=(e.key.toLowerCase()===K[ki].toLowerCase())?ki+1:(e.key==='ArrowUp'?1:0);
  if(ki===K.length){ki=0;toggleBlood()}
});
// phone trigger: 15 touch taps anywhere within 5 seconds
let taps=[]; addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  const n=performance.now(); taps=taps.filter(x=>n-x<5000); taps.push(n);
  if(taps.length>=15){taps=[];toggleBlood()}
},{passive:true});
})();
