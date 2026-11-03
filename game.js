(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=540,ui={overlay:document.getElementById('overlay'),title:document.getElementById('overlayTitle'),text:document.getElementById('overlayText'),eyebrow:document.getElementById('eyebrow'),button:document.getElementById('startButton'),room:document.getElementById('roomName'),progress:document.getElementById('progress'),lives:document.getElementById('lives'),dash:document.getElementById('dashState')};
const palettes=[['#101932','#243658','#83d9db','#ff789e'],['#211a3a','#473368','#c39cff','#ff8eaf'],['#102b38','#1c5360','#89ebd0','#ffc66e'],['#30213a','#65435c','#ffb18a','#ff7a9e'],['#15243b','#315777','#a4e5ff','#fff09a']];
const rooms=[
 {name:'THE FOOTHILLS',platforms:[[0,505,960,60],[154,414,148,19],[356,326,148,19],[548,238,140,19],[727,151,134,19],[836,86,92,18]],spikes:[[310,492,110],[506,492,70]],crystals:[[223,387],[426,299],[620,211],[786,124]],exit:[882,45]},
 {name:'WINDING PASS',platforms:[[0,505,960,60],[104,425,136,18],[294,346,134,18],[506,267,130,18],[700,188,128,18],[824,101,104,18],[402,310,25,100]],spikes:[[252,492,124],[466,492,92],[664,492,92],[442,330,16]],crystals:[[164,398],[348,319],[557,240],[747,161]],exit:[881,60],wind:1},
 {name:'THE BLUE HOLLOW',platforms:[[0,505,960,60],[88,420,135,18],[274,340,132,18],[472,260,134,18],[672,181,135,18],[825,92,103,18],[328,255,24,85],[594,175,24,86]],spikes:[[228,492,100],[430,492,100],[634,492,100],[812,492,80]],crystals:[[148,393],[338,313],[537,233],[735,154]],hazard:{x:448,y:117,r:15,axis:'x',range:120,speed:1.6},exit:[882,51]},
 {name:'EMBER RIDGE',platforms:[[0,505,960,60],[106,431,122,18],[280,354,126,18],[476,277,125,18],[668,199,125,18],[832,116,96,18],[364,293,20,61],[588,214,20,63]],spikes:[[232,492,118],[414,492,132],[608,492,142],[798,492,105],[424,340,42],[617,260,45]],crystals:[[166,404],[339,327],[535,250],[727,172]],hazard:{x:467,y:123,r:14,axis:'y',range:76,speed:2},exit:[883,73],wind:-1},
 {name:'THE LAST LIGHT',platforms:[[0,505,960,60],[86,429,120,18],[247,350,120,18],[411,272,124,18],[584,194,122,18],[744,120,122,18],[851,64,77,18],[323,288,19,62],[507,211,19,62],[704,137,19,61]],spikes:[[210,492,132],[375,492,130],[550,492,140],[714,492,116],[379,311,42],[562,231,43],[758,157,44]],crystals:[[146,402],[307,323],[473,245],[644,167],[800,93]],hazard:{x:479,y:107,r:16,axis:'x',range:180,speed:2.2},exit:[888,28]}
];
let room=0,started=false,won=false,lives=3,time=0,shake=0,particles=[],keys={},pressed={},touch={left:false,right:false,jump:false,dash:false};
const player={x:48,y:465,w:22,h:30,vx:0,vy:0,face:1,ground:false,wall:0,airDash:true,dashing:0,dashDirX:0,dashDirY:0,trail:[],blink:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function current(){return rooms[room]}
function begin(){if(won){room=0;lives=3;won=false;resetPlayer()}started=true;ui.overlay.classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}
ui.button.onclick=begin;
function resetPlayer(){Object.assign(player,{x:48,y:465,vx:0,vy:0,ground:false,wall:0,airDash:true,dashing:0,trail:[],blink:1})}
function nextRoom(){room++;if(room>=rooms.length){won=true;started=false;ui.eyebrow.textContent='SUMMIT REACHED';ui.title.textContent='YOU MADE IT';ui.text.textContent=`Five screens, one tiny climber. Your climb took ${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}. Take a breath — the mountain will be here when you are.`;ui.button.textContent='CLIMB AGAIN';ui.overlay.classList.remove('hidden');return}resetPlayer();for(let i=0;i<32;i++)burst(48,476,palettes[room][2]);}
function burst(x,y,color,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*230,vy:-Math.random()*220-25,life:.35+Math.random()*.5,color,size:2+Math.random()*3})}
function die(){if(player.blink>0)return;lives--;shake=10;burst(player.x+11,player.y+15,palettes[room][3],18);if(lives<=0){lives=3;room=0;time=0}resetPlayer()}
function platformCollisions(){let r=current(),p=player;p.wall=0;p.ground=false;
 // Horizontal collision first; platform sides can be used for wall jumps.
 for(const a of r.platforms){if(p.y+p.h<=a[1]+8||p.y>=a[1]+a[3])continue;if(p.x+p.w>a[0]&&p.x<a[0]+a[2]){if(p.vx>0){p.x=a[0]-p.w;p.wall=1}else if(p.vx<0){p.x=a[0]+a[2];p.wall=-1}p.vx=0}}
 for(const a of r.platforms){if(p.x+p.w<=a[0]+2||p.x>=a[0]+a[2]-2)continue;if(p.y+p.h>a[1]&&p.y<a[1]+a[3]){if(p.vy>0){p.y=a[1]-p.h;p.vy=0;p.ground=true;p.airDash=true}else if(p.vy<0){p.y=a[1]+a[3];p.vy=0}}}
 if(p.x<0){p.x=0;p.wall=-1}if(p.x+p.w>W){p.x=W-p.w;p.wall=1}
}
function update(dt){time+=dt;const p=player,r=current(),left=keys.ArrowLeft||keys.KeyA||touch.left,right=keys.ArrowRight||keys.KeyD||touch.right,jump=pressed.Space||pressed.KeyZ||pressed.ArrowUp||pressed.KeyW||touch.jump,dash=pressed.KeyX||pressed.ShiftLeft||pressed.ShiftRight||touch.dash;
 p.blink=Math.max(0,p.blink-dt);if(p.blink>0&&Math.floor(p.blink*18)%2===0){pressed={};return}
 const axis=(right?1:0)-(left?1:0);if(axis)p.face=axis;
 if(jump){if(p.ground){p.vy=-545;p.ground=false;burst(p.x+11,p.y+29,palettes[room][2],5)}else if(p.wall){p.vy=-520;p.vx=-p.wall*310;p.face=-p.wall;p.wall=0;p.airDash=true;burst(p.x+(p.face>0?0:22),p.y+17,palettes[room][2],8)}}
 if(dash&&p.airDash&&!p.ground){let dx=axis||p.face,dy=(keys.ArrowUp||keys.KeyW)?-1:((keys.ArrowDown||keys.KeyS)?1:0);if(dx&&dy){dx*=.707;dy*=.707}if(!dx&&!dy)dx=p.face;p.dashDirX=dx;p.dashDirY=dy;p.vx=dx*680;p.vy=dy*680;p.dashing=.15;p.airDash=false;burst(p.x+11,p.y+15,palettes[room][2],9)}
 if(p.dashing>0){p.dashing-=dt;p.trail.unshift({x:p.x,y:p.y,life:.2});p.trail.length=Math.min(5,p.trail.length)}else{p.vx+=(axis*1800)*dt;p.vx*=Math.pow(p.ground?.78:.91,dt*60);p.vx=clamp(p.vx,-220,220);const wind=r.wind||0;p.vx+=wind*24*dt;p.vy=Math.min(650,p.vy+1380*dt)}
 p.x+=p.vx*dt;platformCollisions();p.y+=p.vy*dt;platformCollisions();
 p.trail.forEach(t=>t.life-=dt);p.trail=p.trail.filter(t=>t.life>0);
 for(const s of r.spikes||[]){if(p.x+p.w>s[0]&&p.x<s[0]+s[2]&&p.y+p.h>s[1]-14&&p.y<s[1]+9)die()}
 if(r.hazard){let h=r.hazard,shift=Math.sin(time*h.speed)*h.range,hx=h.x+(h.axis==='x'?shift:0),hy=h.y+(h.axis==='y'?shift:0);let dx=p.x+p.w/2-hx,dy=p.y+p.h/2-hy;if(dx*dx+dy*dy<(h.r+13)**2)die()}
 if(p.y>H+30)die();if(p.x+p.w>r.exit[0]-12&&p.y<r.exit[1]+75)nextRoom();
 for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=400*dt;q.life-=dt}particles=particles.filter(q=>q.life>0);
 ui.room.textContent=current().name;ui.progress.textContent=`${room+1} / 5`;ui.lives.textContent='●'.repeat(lives)+'○'.repeat(3-lives);ui.dash.textContent=p.airDash?'●':'○';pressed={};shake=Math.max(0,shake-dt*28);
}
function render(){const [sky,mountain,glow,accent]=palettes[room],r=current();ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,sky);bg.addColorStop(1,'#10152b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // stars and distant mountain silhouettes
 for(let i=0;i<58;i++){let x=(i*173+37)%W,y=(i*89+22)%360;ctx.globalAlpha=.25+.45*(.5+.5*Math.sin(time*1.6+i));ctx.fillStyle=i%6===0?glow:'#d9e7ff';ctx.fillRect(x,y,2,2)}ctx.globalAlpha=1;
 ctx.fillStyle=mountain;ctx.beginPath();ctx.moveTo(0,375);for(let x=0;x<=W;x+=80){let y=305+Math.sin(x*.009+room*1.1)*48+Math.sin(x*.024+room)*24;ctx.lineTo(x,y)}ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
 ctx.fillStyle='#ffffff08';for(let i=0;i<7;i++){let x=(i*181+room*53)%W,y=110+i*34;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+45,y+22);ctx.lineTo(x-20,y+48);ctx.fill()}
 // summit glow
 let g=ctx.createRadialGradient(850,85,5,850,85,180);g.addColorStop(0,glow+'55');g.addColorStop(1,glow+'00');ctx.fillStyle=g;ctx.fillRect(650,0,310,300);
 // Exit beacon
 const [ex,ey]=r.exit;ctx.save();ctx.translate(ex,ey);ctx.shadowBlur=23;ctx.shadowColor=glow;ctx.strokeStyle=glow;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-14,38);ctx.lineTo(-14,3);ctx.quadraticCurveTo(0,-12,14,3);ctx.lineTo(14,38);ctx.stroke();ctx.fillStyle=glow;ctx.globalAlpha=.17+.12*Math.sin(time*4);ctx.fillRect(-10,4,20,34);ctx.globalAlpha=1;ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('UP',0,-18);ctx.restore();
 // ledges
 for(const a of r.platforms){ctx.fillStyle='#0a1028aa';ctx.fillRect(a[0],a[1]+a[3],a[2],6);ctx.fillStyle='#273352';ctx.fillRect(a[0],a[1]+5,a[2],a[3]);ctx.fillStyle=mountain;ctx.fillRect(a[0],a[1]+7,a[2],a[3]-7);ctx.fillStyle=glow;ctx.fillRect(a[0],a[1],a[2],4);ctx.fillStyle='#ffffff26';for(let x=a[0]+12;x<a[0]+a[2]-5;x+=28)ctx.fillRect(x,a[1]+11,5,2);}
 // spikes
 for(const s of r.spikes||[]){ctx.fillStyle='#ff789e';for(let x=s[0];x<s[0]+s[2];x+=16){ctx.beginPath();ctx.moveTo(x,s[1]+4);ctx.lineTo(x+8,s[1]-13);ctx.lineTo(x+16,s[1]+4);ctx.fill()}ctx.fillStyle='#ffb3c5';ctx.fillRect(s[0],s[1]+3,s[2],3)}
 // glowing collectibles
 (r.crystals||[]).forEach(([x,y],i)=>{let bob=Math.sin(time*3+i)*4;ctx.save();ctx.translate(x,y+bob);ctx.shadowBlur=15;ctx.shadowColor=glow;ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(6,0);ctx.lineTo(0,9);ctx.lineTo(-6,0);ctx.closePath();ctx.fill();ctx.restore()});
 if(r.hazard){let h=r.hazard,shift=Math.sin(time*h.speed)*h.range,x=h.x+(h.axis==='x'?shift:0),y=h.y+(h.axis==='y'?shift:0);ctx.save();ctx.translate(x,y);ctx.shadowBlur=22;ctx.shadowColor=accent;ctx.fillStyle=accent;ctx.beginPath();ctx.arc(0,0,h.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff7';ctx.beginPath();ctx.arc(-4,-5,4,0,Math.PI*2);ctx.fill();ctx.restore()}
 // dash afterimages
 for(const t of player.trail){ctx.globalAlpha=clamp(t.life/.2,0,1)*.35;ctx.fillStyle=glow;ctx.fillRect(t.x,t.y,player.w,player.h)}ctx.globalAlpha=1;
 // climber: little red hood and scarf
 const p=player;ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);if(p.face<0)ctx.scale(-1,1);if(p.blink>0&&Math.floor(p.blink*18)%2===0)ctx.globalAlpha=.35;
 if(p.dashing>0){ctx.shadowBlur=20;ctx.shadowColor=glow}ctx.fillStyle='#39283e';ctx.fillRect(-8,4,7,10);ctx.fillRect(2,4,7,10);ctx.fillStyle='#ef607f';ctx.fillRect(-10,-8,20,15);ctx.fillStyle='#ff8da5';ctx.fillRect(-9,-12,19,10);ctx.fillRect(-11,-9,4,9);ctx.fillStyle='#ffd9df';ctx.fillRect(2,-8,3,3);ctx.fillStyle='#88f1dc';ctx.fillRect(-8,7,16,3);ctx.fillStyle='#ffb1c2';ctx.fillRect(-13,-3,6,4);ctx.restore();
 // screen title strip
 ctx.globalAlpha=.55;ctx.fillStyle='#0c1128';ctx.fillRect(0,H-8,W,8);ctx.globalAlpha=1;ctx.fillStyle=glow;ctx.fillRect(0,H-8,W*(room+1)/5,3);
 for(const q of particles){ctx.globalAlpha=clamp(q.life,0,1);ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,q.size,q.size)}ctx.globalAlpha=1;ctx.restore();
}
let last=0;function loop(now){if(!started)return;const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);render();if(started)requestAnimationFrame(loop)}
function keyDown(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(!keys[e.code])pressed[e.code]=true;keys[e.code]=true;if(e.code==='KeyR'){room=0;lives=3;time=0;won=false;resetPlayer();if(!started){started=true;ui.overlay.classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}}if(e.code==='Escape'&&started){started=false;ui.eyebrow.textContent='CLIMB PAUSED';ui.title.textContent='TAKE A BREATHER';ui.text.textContent='Your place on the mountain is safe. Ready when you are.';ui.button.textContent='KEEP CLIMBING';ui.overlay.classList.remove('hidden')}}
function keyUp(e){keys[e.code]=false}
window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',()=>{keys={};touch={left:false,right:false,jump:false,dash:false}});
document.querySelectorAll('.touch button').forEach(button=>{const action=button.dataset.key;const set=(on)=>{touch[action]=on;button.classList.toggle('on',on);if(on&&(action==='jump'||action==='dash'))pressed[action]=true};button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);set(true)});button.addEventListener('pointerup',e=>{e.preventDefault();set(false)});button.addEventListener('pointercancel',()=>set(false));button.addEventListener('lostpointercapture',()=>set(false))});
render();
})();
