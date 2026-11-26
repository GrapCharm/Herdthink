import {topics} from "./topics.js";
import {atlas} from "./atlas.js";
const $ = id => document.getElementById(id);
const make = (tag,text,cls) => {const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
const key="herdthink.observations.v1";
let saved=[];
try {
  const records=JSON.parse(localStorage.getItem(key)||"[]");
  if(Array.isArray(records)) saved=records.filter(r=>r && Object.hasOwn(topics,r.topic) && topics[r.topic].roles[r.role]?.sources.includes(r.source) && typeof r.note==="string");
} catch {}
let id="ai", role=0, source=0, opponent=1;
let archiveTopic="ai", archiveRole=-1;
const colors=["#97aa55","#9878c1","#d78e67"];
const status=make("p","","muted");status.setAttribute("role","status");$("records").after(status);
function persist(){
  try{localStorage.setItem(key,JSON.stringify(saved));status.textContent="";}
  catch {status.textContent="浏览器存储不可用，本次记录仅在当前页面保留。"; if($("archive").hidden) $("save").after(status);}
  $("count").textContent=saved.length;
}
const snapshot=await fetch("./sources.json").then(r=>{if(!r.ok) throw Error();return r.json();}).catch(()=>{
  $("subtitle").textContent="材料快照加载失败，请刷新页面重试。"; throw Error("材料快照加载失败");
});
const map=atlas($("sky"),$("nodes"),selectRole);
function selectRole(i){role=i;source=topics[id].roles[i].sources[0];opponent=(i+1)%3;render();}
function render(){
  const t=topics[id], current=t.roles[role],item=snapshot.topics[id][source];
  const [focus,question,reading]=t.readings[source][role];
  $("topic").value=id;$("title").textContent=t.title;$("subtitle").textContent=t.subtitle;
  $("role").textContent=current.name;$("desc").textContent=current.desc;
  $("focuses").replaceChildren(...current.sources.map(s=>{
    const el=make("button",t.readings[s][role][0]);el.setAttribute("aria-pressed",s===source);
    el.onclick=()=>{source=s;render();};return el;
  }));
  $("question").textContent=question;$("interpret").textContent=reading;
  $("sourceTitle").textContent=item.title.replace(/ - 知乎$/,"");$("author").textContent=item.author+" · "+snapshot.retrievedAt+" 检索";
  $("summary").textContent="摘要转述："+item.summary;$("original").href=item.url;
  $("versus").replaceChildren(...t.roles.flatMap((r,i)=>i===role?[]:[new Option(r.name,i)]));
  $("versus").value=opponent;
  $("pair").replaceChildren(...[role,opponent].map(i=>{
    const el=make("div","","pair-row");el.style.setProperty("--node",colors[i]);el.append(make("b",t.roles[i].name),make("p",t.readings[source][i][2],"pair-text"));return el;
  }));
  $("save").textContent=saved.some(matches)?"✓ 已收藏 · 查看档案":"＋ 加入观察档案";
  $("count").textContent=saved.length;map.render(t.roles.map(r=>r.name),role,focus);
}
function matches(r){return r.topic===id && r.role===role && r.source===source;}
$("save").onclick=()=>{
  if(saved.some(matches)){showArchive(true);return;}
  saved.unshift({topic:id,role,source,note:""});persist();render();
};
$("reset").onclick=map.reset;
$("topic").replaceChildren(...Object.entries(topics).map(([key,t])=>new Option(t.name,key)));
$("topic").onchange=()=>{id=$("topic").value;map.reset();selectRole(0);};
$("versus").onchange=()=>{opponent=Number($("versus").value);render();};
const archiveAtlas=atlas($("archiveSky"),$("archiveNodes"),i=>{archiveRole=archiveRole===i?-1:i;renderArchive();});
$("archiveTopic").replaceChildren(...Object.entries(topics).map(([key,t])=>new Option(t.name,key)));
$("archiveTopic").onchange=()=>{archiveTopic=$("archiveTopic").value;archiveRole=-1;renderArchive();};
$("clearLens").onclick=()=>{archiveRole=-1;renderArchive();};
function showArchive(open){
  if(open){archiveTopic=id;archiveRole=-1;}
  $("archive").hidden=!open;$("explore").hidden=open;
  $("archiveNav").setAttribute("aria-current",open?"page":"false");$("exploreNav").setAttribute("aria-current",open?"false":"page");
  if(open) renderArchive();else render();window.scrollTo(0,0);
}
function renderArchive(){
  const records=$("records");records.replaceChildren();records.after(status);
  $("archiveTopic").value=archiveTopic;
  const inTopic=saved.filter(r=>r.topic===archiveTopic);
  const names=topics[archiveTopic].roles.map((lens,i)=>lens.name+" · "+inTopic.filter(r=>r.role===i).length);
  archiveAtlas.render(names,archiveRole,"已关注");
  const visible=inTopic.filter(r=>archiveRole===-1 || r.role===archiveRole);
  if(!visible.length) records.append(make("p","此处还没有记录。在探索页选择关注点，点击「加入观察档案」即可收藏。","empty"));
  visible.forEach(r=>{
    const t=topics[r.topic],item=snapshot.topics[r.topic][r.source],panel=make("article","","record");
    panel.append(make("small",t.name+" / "+t.roles[r.role].name),make("h3",t.readings[r.source][r.role][1]));
    const link=make("a",item.author+" · 阅读原文 ↗","action");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";panel.append(link);
    const label=make("label","我的约束或待核实的问题"),note=make("textarea","");note.value=r.note;note.maxLength=800;note.rows=2;note.placeholder="例如：我最多能接受多久的等待？";
    note.oninput=()=>{r.note=note.value;persist();};label.append(note);panel.append(label);
    const actions=make("div","","record-actions"),revisit=make("button","回到这个视角 ↗","action"),remove=make("button","移除记录");
    revisit.onclick=()=>{id=r.topic;role=r.role;source=r.source;opponent=(role+1)%3;showArchive(false);};
    remove.onclick=()=>{saved=saved.filter(entry=>entry!==r);persist();renderArchive();};
    actions.append(revisit,remove);panel.append(actions);records.append(panel);
  });
}
$("archiveNav").onclick=()=>showArchive(true);
$("exploreNav").onclick=$("back").onclick=()=>showArchive(false);
render();
