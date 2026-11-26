// Orthographic projection keeps the surface and its interactive anchors in sync.
export function atlas(canvas, layer, select) {
  const ctx = canvas.getContext("2d"), tau = 2 * Math.PI;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let yaw = 0, pitch = -.09, spread = 0, target = 0, frame = 0, drag, focus;
  let nodes = [], active = -1, visible = true;
  const grains = Array.from({length:10500}, (_, i) => {
    const y = 1 - 2*(i+.5)/10500, lat = Math.asin(y), lon = i*2.39996323 % tau;
    const band = Math.sin(lon*3+Math.sin(lat*5)*1.8)+Math.cos(lat*7-lon*2)+.42*Math.sin(lon*13+lat*12);
    const r = Math.sqrt(1-y*y);
    return [r*Math.sin(lon), y, r*Math.cos(lon), band];
  });
  function draw() {
    frame = 0;
    if (!visible) return;
    const w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio,2);
    if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){
      canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
    }
    ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
    spread += (target-spread)*(reduced?1:.085);
    if(focus){yaw+=(focus.yaw-yaw)*(reduced?1:.13);pitch+=(focus.pitch-pitch)*(reduced?1:.13);}
    const mobile=w<650;
    const idleR=mobile?w*.85:Math.min(w*.44,h*.79), openR=Math.min(w*.38,h*.37);
    const r=idleR+(openR-idleR)*spread, cx=w*((mobile?.75:.81)*(1-spread)+(mobile?.5:.56)*spread);
    const cy=h*((mobile?.34:.68)*(1-spread)+.51*spread);
    for(let i=1;i<190;i++){
      ctx.fillStyle=i%9?'#9db9db55':'#c2deffbb';
      ctx.fillRect(((i*73.837)%103)/103*w,((i*91.719)%107)/107*h,1.2,1.2);
    }
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.32);
    ctx.strokeStyle='#a3c5ec38';ctx.beginPath();ctx.ellipse(0,0,r*1.4,r*.42,0,0,tau);ctx.stroke();ctx.restore();
    const glow=ctx.createRadialGradient(cx,cy,r*.98,cx,cy,r*1.11);
    glow.addColorStop(0,'#7dc2ff86');glow.addColorStop(.18,'#4a94de3b');glow.addColorStop(1,'#2959ac00');
    ctx.fillStyle=glow;ctx.fillRect(cx-r*1.12,cy-r*1.12,r*2.24,r*2.24);
    const ocean=ctx.createRadialGradient(cx-r*.53,cy-r*.8,0,cx+r*.16,cy+r*.3,r*1.55);
    ocean.addColorStop(0,'#a2cce2');ocean.addColorStop(.21,'#456d8b');ocean.addColorStop(.49,'#192f49');ocean.addColorStop(.8,'#071220');ocean.addColorStop(1,'#040912');
    ctx.fillStyle=ocean;ctx.beginPath();ctx.arc(cx,cy,r,0,tau);ctx.fill();
    const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    function project(x,y,z){const depth=z*c-x*s;return [x*c+z*s,y*cp-depth*sp,depth*cp+y*sp];}
    ctx.fillStyle='#c6e6fa';
    for(const [x,y,z,band] of grains){
      const [a,b,f]=project(x,y,z);if(f<0||band<-.6)continue;
      ctx.globalAlpha=Math.min(.9,(band>0?.58:.25)*(.8+.6*b-.5*a));
      ctx.fillRect(cx+a*r,cy-b*r,Math.max(1,r*.0045),Math.max(1,r*.003));
    }
    ctx.globalAlpha=1;
    nodes.forEach(({lon,lat,button},i)=>{
      const [a,b,f]=project(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
      button.hidden=f<-.03;if(button.hidden)return;
      const x=cx+a*r,y=cy-b*r,sign=a<0?-1:1;
      const pad=button.offsetWidth/2+8;
      const end=Math.max(pad,Math.min(w-pad,x+sign*r*.26));
      const top=y+((i%2)?12:-12);
      ctx.strokeStyle='#b5ddf8aa';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(end,top);ctx.stroke();
      ctx.fillStyle=i===active?'#ffe1b4':'#c1e5ff';ctx.beginPath();ctx.arc(x,y,4,0,tau);ctx.fill();
      button.style.left=end+'px';button.style.top=top+'px';
    });
    if(Math.abs(target-spread)>.001 || (focus && Math.abs(focus.yaw-yaw)+Math.abs(focus.pitch-pitch)>.003)) schedule();
  }
  function schedule(){if(!frame&&visible)frame=requestAnimationFrame(draw);}
  canvas.onpointerdown=e=>{focus=null;drag=[e.clientX,e.clientY,yaw,pitch];canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(drag){yaw=drag[2]+(e.clientX-drag[0])*.006;pitch=Math.max(-1,Math.min(1,drag[3]+(e.clientY-drag[1])*.004));schedule();}};
  canvas.onlostpointercapture=()=>drag=null;
  new ResizeObserver(schedule).observe(canvas);
  return {
    set(views){
      layer.replaceChildren();yaw=0;pitch=-.09;focus=null;active=-1;target=views.length?1:0;
      nodes=views.map((view,i)=>{
        const button=document.createElement("button");button.className="node";button.textContent=view.label;
        if(views.length<=3){const hint=document.createElement("span");hint.textContent=view.preview.slice(0,12)+'…';button.append(hint);}
        button.onclick=()=>select(i);layer.append(button);
        return {button,lon:views.length===1?.22:(i%2?1:-1)*(.45+.18*(i%3)),lat:.75-1.45*(i+.5)/views.length};
      });schedule();
    },
    choose(i){active=i;const n=nodes[i];const delta=-n.lon-yaw;focus={yaw:yaw+Math.atan2(Math.sin(delta),Math.cos(delta)),pitch:n.lat};nodes.forEach((n,j)=>n.button.setAttribute('aria-pressed',String(i===j)));schedule();},
    show(on){visible=on;layer.hidden=!on;if(on)schedule();}
  };
}
