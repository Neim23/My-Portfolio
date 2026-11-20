(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- pixel canvas: embers + ripples (low-res, upscaled) ---------- */
const cv=$('#fx'), ctx=cv.getContext('2d'), S=4; // 1 canvas pixel = 4 screen px
let W,H; const ripples=[], embers=[];
function resize(){W=Math.ceil(innerWidth/S);H=Math.ceil(innerHeight/S);cv.width=W;cv.height=H}
resize(); addEventListener('resize',resize);
const COLORS=['#ff8a1f','#ffb347','#c25f00','#ffd9a0'];
function spawnEmber(init){embers.push({x:Math.random()*W,y:init?Math.random()*H:H+2,v:.08+Math.random()*.25,c:COLORS[Math.random()*4|0],a:.2+Math.random()*.5,w:Math.random()*6})}
for(let i=0;i<70;i++)spawnEmber(true);

function ring(cx,cy,r,col,alpha,thick){
  ctx.globalAlpha=alpha;ctx.fillStyle=col;
  const n=Math.max(12,Math.ceil(r*7)), seen=new Set();
  for(let i=0;i<n;i++){const a=i/n*6.2832;
    const x=Math.round(cx+Math.cos(a)*r), y=Math.round(cy+Math.sin(a)*r), k=x+','+y;
    if(seen.has(k))continue; seen.add(k); ctx.fillRect(x,y,thick,thick)}
}
function frame(t){
  ctx.clearRect(0,0,W,H);
  for(const e of embers){e.y-=e.v;e.x+=Math.sin(t/900+e.w)*.08;
    if(e.y<-2){e.y=H+2;e.x=Math.random()*W}
    ctx.globalAlpha=e.a;ctx.fillStyle=e.c;ctx.fillRect(e.x|0,e.y|0,1,1)}
  for(let i=ripples.length-1;i>=0;i--){const p=ripples[i], k=(t-p.t)/p.life;
    if(k>=1){ripples.splice(i,1);continue}
    const r=k*p.max, fade=1-k;
    ring(p.x,p.y,r,'#ff8a1f',fade,2);
    if(k>.12)ring(p.x,p.y,r*.72,'#ffb347',fade*.8,1);
    if(k>.28)ring(p.x,p.y,r*.45,'#c25f00',fade*.6,1);
    // splash droplets
    for(const d of p.drops){const dx=p.x+d.dx*k*p.max*.6, dy=p.y+d.dy*k*p.max*.6+k*k*18;
      ctx.globalAlpha=fade;ctx.fillStyle='#ffd9a0';ctx.fillRect(dx|0,dy|0,1,1)}
  }
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

/* ---------- toast + konami ---------- */
const toast=$('#toast'); let tt;
function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('on'),2600)}
const K=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']; let ki=0;
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!modal.hidden)close();
  ki=(e.key.toLowerCase()===K[ki].toLowerCase())?ki+1:(e.key==='ArrowUp'?1:0);
  if(ki===K.length){ki=0;document.body.classList.toggle('party');say('★ CHEAT CODE ACTIVATED ★');
    for(let i=0;i<5;i++)setTimeout(()=>ripple(Math.random()*innerWidth,Math.random()*innerHeight),i*180)}
});
})();
