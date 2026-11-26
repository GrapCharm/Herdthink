import {atlas} from "./atlas.js";
const $=id=>document.getElementById(id);
let views=[], selected=-1, question="", generation=0;
const globe=atlas(document.querySelector("canvas"),$("labels"),i=>{
  selected=i;globe.choose(i);
  $("choice").querySelector("h2").textContent=views[i].label;
  $("choice").querySelector("p").textContent=views[i].preview;
  $("choice").hidden=false;
});
async function request(payload){
  const response=await fetch("./api/perspectives",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"暂时无法连接知乎，请稍后再试。");
  return data;
}
$("ask").onsubmit=async e=>{
  e.preventDefault();question=$("topic").value.trim();if(!question)return;
  const version=++generation;
  $("intro").hidden=true;$("restart").hidden=false;$("heading").hidden=false;
  $("heading").querySelector("h2").textContent=question;
  $("foot").textContent="正在检索知乎并整理视角";$("status").textContent="正在寻找与议题相关的真实回答…";
  try{
    const data=await request({topic:question});if(version!==generation)return;
    if(!data.views?.length)throw Error("目前的知乎摘要缺少可核实的视角，可以换个问法。");
    views=data.views;globe.set(views);$("status").textContent="";
    $("foot").textContent=(data.notice||views.length+" 个视角")+" · 拖动旋转，点选标签";
  }catch(err){if(version!==generation)return;reset();$("status").textContent=err.message;}
};
function reset(){
  generation++;views=[];selected=-1;document.body.classList.remove("reading");
  for(const id of ["restart","choice","heading","detail"])$(id).hidden=true;
  $("intro").hidden=false;$("status").textContent="";$("foot").textContent="等待输入议题";
  globe.show(true);globe.set([]);$("topic").focus();
}
$("restart").onclick=reset;
$("enter").onclick=()=>{
  const v=views[selected];if(!v)return;
  document.body.classList.add("reading");globe.show(false);
  $("choice").hidden=$("heading").hidden=true;$("detail").hidden=false;
  $("context").textContent=question;$("detail").querySelector("h1").textContent=v.label;
  $("story").textContent=v.story;$("detail").querySelector("blockquote").textContent=v.quote;
  const link=$("source");link.removeAttribute("href");
  try{const url=new URL(v.source.url);if(url.protocol==="https:")link.href=url.href;}catch{}
  link.textContent=[v.source.author,v.source.title||"知乎来源"].filter(Boolean).join(" · ");
  $("out").textContent="";$("condition").value="";$("simulate").querySelector("button").disabled=false;
  $("foot").textContent="视角解读 · 材料来自知乎搜索摘要";$("back").focus();
};
$("back").onclick=()=>{
  generation++;document.body.classList.remove("reading");$("detail").hidden=true;
  $("choice").hidden=$("heading").hidden=false;globe.show(true);$("enter").focus();
  $("foot").textContent=views.length+" 个视角 · 拖动旋转，继续探索";window.scrollTo(0,0);
};
$("simulate").onsubmit=async e=>{
  e.preventDefault();const condition=$("condition").value.trim();if(!condition)return;
  const version=++generation,button=$("simulate").querySelector("button");button.disabled=true;
  $("out").textContent="正在推演…";
  try{const data=await request({topic:question,condition,evidence:views[selected].source.text});
    if(version===generation)$("out").textContent="AI 模拟 · "+data.simulation;
  }catch(err){if(version===generation)$("out").textContent=err.message;}
  finally{if(version===generation)button.disabled=false;}
};
globe.set([]);
