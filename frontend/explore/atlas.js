// Project a sphere and its three viewpoint anchors onto the same canvas coordinates.
export function atlas(canvas, labels, onSelect) {
  const ctx = canvas.getContext("2d"), parent = canvas.parentElement;
  let yaw = 0, tilt = -.13, points = [], active = 0, focus = "", drag = null;
  const palette = ["#c6ee91", "#bda7ff", "#ffb791"];
  const anchors = [[-.82,.24,.54],[.74,.36,.64],[.40,-.63,.67]];
  const sphere = (lat, lon) => [Math.cos(lat)*Math.cos(lon), Math.sin(lat), Math.cos(lat)*Math.sin(lon)];
  function draw() {
    const w = parent.clientWidth, h = parent.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const radius = Math.min(w*.32,h*.34), cx=w*.5, cy=h*.54;
    function project([x,y,z]) {
      const a=x*Math.cos(yaw)+z*Math.sin(yaw), b=z*Math.cos(yaw)-x*Math.sin(yaw);
      const depth=b*Math.cos(tilt)+y*Math.sin(tilt), k=1+.11*depth;
      return [cx+a*radius*k,cy-(y*Math.cos(tilt)-b*Math.sin(tilt))*radius*k,depth];
    }
    function line(a,b,color,width=1) {
      ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
    }
    for(let i=0;i<120;i++){
      const x=((i*73.819)%101)/101*w,y=((i*39.271)%97)/97*h;
      ctx.fillStyle=i%6===0?"#bcb0d288":"#c8b1df38";ctx.fillRect(x,y,i%6===0?1.7:1,i%6===0?1.7:1);
    }
    const light=ctx.createRadialGradient(cx-radius*.23,cy-radius*.25,2,cx,cy,radius*1.13);
    light.addColorStop(0,"#a77af13d");light.addColorStop(.7,"#7157a147");light.addColorStop(1,"#8866af05");
    ctx.fillStyle=light;ctx.beginPath();ctx.arc(cx,cy,radius*1.09,0,Math.PI*2);ctx.fill();
    const rings=16, count=34;
    for(let j=0;j<rings;j++){
      const lat=-Math.PI/2+j*Math.PI/rings;
      for(let i=0;i<count;i++){
        const lon=(i+j*.42)*Math.PI*2/count;
        const a=project(sphere(lat,lon)), b=project(sphere(lat,lon+Math.PI*2/count));
        const c=project(sphere(lat+Math.PI/rings,lon+.42*Math.PI*2/count));
        const front=a[2]>0;
        line(a,b,front?"#c5a3ed66":"#a98fc71c",.7);line(a,c,front?"#b49ac862":"#ae90c719",.65);
        line(b,c,front?"#c8b1e333":"#bda1da0e",.55);
        if(front && (i+j)%3===0){ctx.fillStyle="#e8d6ffb0";ctx.fillRect(a[0]-.8,a[1]-.8,1.6,1.6);}
      }
    }
    for(let i=0;i<2;i++){
      ctx.save();ctx.translate(cx,cy);ctx.rotate((i===0?-.32:.62)+yaw*.08);
      ctx.beginPath();ctx.ellipse(0,0,radius*(1.39+i*.04),radius*(.48+i*.09),0,0,Math.PI*2);ctx.strokeStyle=i===0?"#c7a5e886":"#e8c4ad5a";ctx.lineWidth=1;ctx.stroke();ctx.restore();
    }
    points.forEach((button,i)=>{
      const a=project(anchors[i]), side=i===0?-1:1;
      const pad=button.offsetWidth/2+7;
      const x=Math.max(pad,Math.min(w-pad,a[0]+side*radius*.46));
      const y=Math.max(79, Math.min(h-42,a[1]+(i===2?20:-10)));
      line(a,[x,y],palette[i],1);
      ctx.fillStyle=palette[i];ctx.shadowColor=palette[i];ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(a[0],a[1],i===active?5:3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(i===active){
        ctx.beginPath();ctx.arc(a[0],a[1],10,0,Math.PI*2);ctx.strokeStyle=palette[i];ctx.stroke();
        ctx.font='11px sans-serif';ctx.textAlign=side===1?'right':'left';ctx.fillText(focus,a[0]-side*9,a[1]+17);
      }
      button.style.left=x+"px";button.style.top=y+"px";
    });
  }
  function render(names,index,detail) {
    active=index;focus=detail;
    if(!points.length || points.some((el,i)=>el.textContent!==names[i])){
      labels.replaceChildren();
      points=names.map((name,i)=>{const el=document.createElement("button");el.className="node";el.textContent=name;
        el.style.setProperty("--node",palette[i]);el.onclick=()=>onSelect(i);labels.append(el);return el;});
    }
    points.forEach((el,i)=>el.setAttribute("aria-pressed",String(i===index)));draw();
  }
  canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY,yaw,tilt];canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(drag){yaw=Math.max(-.75,Math.min(.75,drag[2]+(e.clientX-drag[0])*.005));tilt=Math.max(-.5,Math.min(.5,drag[3]-(e.clientY-drag[1])*.004));draw();}};
  canvas.onlostpointercapture=()=>{drag=null;};
  new ResizeObserver(draw).observe(parent);
  return {render,reset(){yaw=0;tilt=-.13;draw();}};
}
