"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Area, KnowledgeStatus, MoveData, MoveItem, MoveStage, MoveStream, RelationshipType, Status, Timing, VaultEntry } from "./types";
import { moveRepository } from "./repository";
import { blocker, isDone, recommendations } from "./priorities";

type Page = "Today" | "Map" | "Clear" | "Build" | "Become" | "Vault" | "Settings";
const pages: {name:Page; icon:string}[] = [
  {name:"Today",icon:"⌂"},{name:"Map",icon:"⌘"},{name:"Clear",icon:"↗"},{name:"Build",icon:"◇"},
  {name:"Become",icon:"✦"},{name:"Vault",icon:"□"},{name:"Settings",icon:"○"},
];
const sectionCopy: Record<string,string> = {
  "Money, Credit and Old Obligations":"Prevent new damage and make the old things finite.",
  "Car, Documents and Responsibilities":"Safety, reliability, records, and loose ends.",
  "Family: What I Can Help With":"Offer love with a clear edge around your role.",
  "Closure Before I Leave":"Honor what mattered without forcing an ending.",
  "Allowed to Wait":"Important is not the same as move-blocking.",
  "Post-Move Income":"Keep the routes credible now; choose only when timing makes the choice useful.",
  "Rental Readiness":"Know what a landlord will need before the search begins.",
  "Housing and Lease":"Explore lightly now. Act seriously when readiness is secure.",
  "Land Softly":"Prepare the future so arrival has room to breathe.",
  "Physical Move":"Logistics begin when there is a real address.",
};
const sectionReasoning: Record<string,{why:string;unlocks:string;permission:string}> = {
  "Money, Credit and Old Obligations":{why:"Stops avoidable fees, legal trouble, or credit surprises from following you.",unlocks:"A cleaner rental application and a more honest move budget.",permission:"You only need to address what can cause harm or affect the move."},
  "Car, Documents and Responsibilities":{why:"Safety and usable records protect the actual journey and your first weeks.",unlocks:"Reliable travel, applications, care continuity, and fewer arrival emergencies.",permission:"Cosmetic work and nonessential upgrades can wait."},
  "Family: What I Can Help With":{why:"A defined role lets you offer real help without making the move depend on fixing another life.",unlocks:"A compassionate ending with a clear point where your part is complete.",permission:"Planning or connecting someone to support can be enough."},
  "Closure Before I Leave":{why:"Intentional time and acknowledgment can reduce the feeling that you vanished from your own chapter.",unlocks:"More emotional room for arrival and new attachment.",permission:"Closure does not require another person’s participation."},
  "Allowed to Wait":{why:"Naming non-blockers protects attention for the work that actually changes readiness.",unlocks:"A calmer plan with fewer false emergencies.",permission:"Waiting is a decision, not neglect."},
  "Rental Readiness":{why:"Landlords decide from documents and requirements, so preparation prevents a rushed scramble.",unlocks:"Confident applications when the right apartment appears.",permission:"You can gather most documents before choosing the final income route."},
  "Housing and Lease":{why:"The lease is the commitment point that turns a destination into a confirmed address.",unlocks:"Utilities, mover booking, measurements, and serious packing.",permission:"Explore now; commitment waits for enough verified information."},
  "Land Softly":{why:"A little continuity planning protects your health, your dog, and your energy after arrival.",unlocks:"A first month focused on settling instead of preventable emergencies.",permission:"Prepare the essentials; optimize the new life later."},
  "Physical Move":{why:"Logistics become accurate only after the address and move-in terms are real.",unlocks:"A coordinated Move Day and a functional first night.",permission:"Research is fine now. Booking and detailed execution can stay quiet."},
  "The Life I Want":{why:"Practical choices become easier when you know how ordinary life should feel.",unlocks:"A useful filter for housing, work, spending, and time.",permission:"This is a direction, not a contract."},
  "People and Relationships":{why:"Moving changes access and rhythm; intention helps important relationships survive the transition.",unlocks:"Clearer boundaries, appreciation, and ways to stay connected.",permission:"Not every relationship needs the same future shape."},
  "Spiritual Preparation":{why:"Meaning-making can hold uncertainty that a checklist cannot resolve.",unlocks:"A personal sense of continuity and trust.",permission:"Nothing here is required or scored."},
  "Community and Belonging":{why:"Belonging usually grows through repetition, not one dramatic introduction.",unlocks:"A few low-pressure doors to knock on after arrival.",permission:"You do not have to build a whole community immediately."},
};
const areaSections: Record<Area,string[]> = {
  Clear:["Money, Credit and Old Obligations","Car, Documents and Responsibilities","Family: What I Can Help With","Closure Before I Leave","Allowed to Wait"],
  Build:["Timeline","Move Money","Post-Move Income","Rental Readiness","Housing and Lease","Land Softly","Physical Move"],
  Become:["My Fuel Source","The Life I Want","People and Relationships","Spiritual Preparation","Community and Belonging","Flowering Period: First 30 Days"],
  Vault:[],
};
const statuses:Status[] = ["Not started","In motion","Waiting","Blocked","Good enough","Secure","Settled","Carry forward","Released"];
const timings:Timing[] = ["Now","Prepare early","After the lease","First 72 hours","After arrival","Allowed to wait"];
const stages:MoveStage[]=["Foundation","Prepare","Decide","Commit","Move","Land"];
const streams:MoveStream[]=["Income","Housing","Money","Clear","Health & dog","Become"];
const relationships:RelationshipType[]=["Hard dependency","Helpful sequence","Parallel","Decision gate","Deferred decision","Waiting on event","Informational"];
const knowledgeStatuses:KnowledgeStatus[]=["Known","Estimate","Need to think","Need information","Waiting on event","Decided","Not applicable"];

function Logo() { return <div className="logo"><span>m</span><strong>Move OS</strong></div>; }
function Button({children, onClick, kind="secondary", type="button"}:{children:React.ReactNode;onClick?:()=>void;kind?:string;type?:"button"|"submit"}) {
  return <button type={type} className={`button ${kind}`} onClick={onClick}>{children}</button>;
}

export function MoveOS() {
  const [data,setData] = useState<MoveData|null>(null);
  const [page,setPage] = useState<Page>("Today");
  const [dark,setDark] = useState(false);
  const [overwhelmed,setOverwhelmed] = useState(false);
  const [editing,setEditing] = useState<MoveItem|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ moveRepository.load().then(setData); },[]);
  useEffect(()=>{ if(data) moveRepository.save(data); },[data]);
  useEffect(()=>{ document.documentElement.dataset.theme = dark ? "dark" : "light"; },[dark]);
  if(!data) return <div className="loading">Gathering your move plan…</div>;
  const update=(next:MoveData)=>setData(next);
  return <div className="app-shell">
    <aside className="sidebar">
      <Logo/>
      <nav aria-label="Primary">{pages.map(p=><button key={p.name} className={page===p.name?"active":""} onClick={()=>{setPage(p.name);setOverwhelmed(false)}}><span>{p.icon}</span>{p.name}</button>)}</nav>
      <div className="sidebar-quote"><small>YOUR NORTH STAR</small><p>“{data.profile.reason}”</p></div>
      <button className="theme-toggle" onClick={()=>setDark(!dark)}>{dark?"☀︎  Light mode":"☾  Dark mode"}</button>
    </aside>
    <main>
      <header className="topbar"><Logo/><button className="phase-pill"><i/> {data.profile.phase}</button></header>
      {page==="Today" && <Today data={data} update={update} overwhelmed={overwhelmed} setOverwhelmed={setOverwhelmed} edit={setEditing}/>}
      {page==="Map" && <MoveMap data={data} update={update} edit={setEditing}/>}
      {(page==="Clear"||page==="Build"||page==="Become") && <AreaPage area={page} data={data} update={update} edit={setEditing}/>}
      {page==="Vault" && <Vault data={data} update={update}/>}
      {page==="Settings" && <Settings data={data} update={update} dark={dark} setDark={setDark} fileRef={fileRef}/>}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{pages.slice(0,5).map(p=><button key={p.name} className={page===p.name?"active":""} onClick={()=>{setPage(p.name);setOverwhelmed(false)}}><span>{p.icon}</span>{p.name}</button>)}</nav>
    {editing && <ItemModal item={editing} all={data.items} onClose={()=>setEditing(null)} onSave={saved=>{update({...data,items:data.items.some(i=>i.id===saved.id)?data.items.map(i=>i.id===saved.id?saved:i):[...data.items,saved]});setEditing(null)}} onDelete={()=>{update({...data,items:data.items.filter(i=>i.id!==editing.id)});setEditing(null)}}/>}
  </div>;
}

function Today({data,update,overwhelmed,setOverwhelmed,edit}:{data:MoveData;update:(d:MoveData)=>void;overwhelmed:boolean;setOverwhelmed:(v:boolean)=>void;edit:(i:MoveItem)=>void}) {
  const [now] = useState(() => Date.now());
  const suggested=useMemo(()=>recommendations(data.items),[data.items]);
  const waiting=data.items.filter(i=>blocker(i,data.items)).slice(0,3);
  const settled=data.items.filter(isDone).slice(-3).reverse();
  const days=Math.max(0,Math.ceil((new Date(data.profile.targetMoveDate).getTime()-now)/86400000));
  if(overwhelmed) {
    const small=suggested.find(i=>i.priority==="Relief") || suggested[0];
    const ignore=data.items.find(i=>i.timing==="Allowed to wait");
    return <div className="page overwhelmed">
      <div className="soft-orb"/>
      <p className="eyebrow">A SMALLER VIEW</p><h1>You don’t have to hold<br/>the whole move today.</h1>
      <p className="lede">Let’s make the horizon small enough to breathe.</p>
      <section className="one-action"><span>ONE SMALL ACTION · ABOUT 15 MINUTES</span><h2>{small?.title}</h2><p>{small?.description || "A small step is still movement."}</p><Button kind="primary" onClick={()=>small&&edit(small)}>Open this action <b>→</b></Button></section>
      <div className="permission"><span>YOU’RE ALLOWED TO IGNORE THIS FOR NOW</span><strong>{ignore?.title || "Everything that isn’t urgent or move-blocking."}</strong></div>
      <blockquote>“{data.profile.reason}”</blockquote>
      <Button onClick={()=>setOverwhelmed(false)}>Return to my plan</Button>
    </div>;
  }
  return <div className="page today">
    <div className="welcome">
      <div><p className="eyebrow">GOOD MORNING · {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"})}</p><h1>You’re not moving all at once.<br/><em>You’re building the way there.</em></h1></div>
      <div className="move-date"><small>TARGET MOVE</small><strong>{new Date(data.profile.targetMoveDate+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</strong><span>{days} days · backup {new Date(data.profile.backupDate+"T12:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span></div>
    </div>
    <section className="unlock"><div className="unlock-mark">↗</div><div><span>CURRENT UNLOCK</span><h2>{data.profile.currentUnlock}</h2><p>This work supports several possible paths. The final job choice can stay intentionally deferred.</p></div><Button kind="ink" onClick={()=>edit(data.items.find(i=>i.id==="rental-ready")!)}>Continue <b>→</b></Button></section>
    <div className="section-heading"><div><p className="eyebrow">A BALANCED DAY</p><h2>Three things that matter now</h2></div><p>One from each part of the life you’re tending.</p></div>
    <div className="suggestions">{suggested.map((item,index)=><ActionCard key={item.id} item={item} number={index+1} edit={edit} data={data} update={update}/>)}</div>
    <div className="lower-grid">
      <section className="quiet-list"><div className="list-title"><h3>Waiting on another step</h3><span>{waiting.length}</span></div>{waiting.map(i=><button onClick={()=>edit(i)} key={i.id}><b>{i.title}</b><small>{blocker(i,data.items)}</small></button>)}</section>
      <section className="quiet-list settled"><div className="list-title"><h3>Recently settled</h3><span>✓</span></div>{settled.map(i=><button onClick={()=>edit(i)} key={i.id}><b>{i.title}</b><small>{i.status} · quietly done</small></button>)}</section>
    </div>
    <button className="overwhelm" onClick={()=>setOverwhelmed(true)}><span>○</span><div><b>I feel overwhelmed</b><small>Show me just one kind next step.</small></div><i>→</i></button>
    <p className="principle">One place to remember everything. <b>A few things to work on.</b> One life I am moving toward.</p>
  </div>;
}

function ActionCard({item,number,edit,data,update}:{item:MoveItem;number:number;edit:(i:MoveItem)=>void;data:MoveData;update:(d:MoveData)=>void}) {
  const colors={Clear:"coral",Build:"sage",Become:"lavender",Vault:"sand"};
  return <article className={`action-card ${colors[item.area]}`}><div className="card-top"><span>{item.area.toUpperCase()}</span><i>0{number}</i></div><h3>{item.title}</h3><p>{item.description}</p><div className="why-now"><small>WHY THIS NOW</small><span>{itemReason(item,data.items)}</span></div><div className="card-bottom"><button onClick={()=>update({...data,items:data.items.map(i=>i.id===item.id?{...i,status:"Settled",updatedAt:new Date().toISOString().slice(0,10)}:i)})} aria-label={`Settle ${item.title}`}>○</button><button onClick={()=>edit(item)}>Open <b>→</b></button></div></article>;
}

function MoveMap({data,update,edit}:{data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void}) {
  const parents=data.items.filter(item=>!item.parentId);
  const add=(stage:MoveStage,stream:MoveStream)=>edit({id:crypto.randomUUID(),title:"",description:"",area:stream==="Become"?"Become":stream==="Clear"?"Clear":"Build",section:stream,status:"Not started",priority:"Relief",timing:"Now",stage,stream,relationship:"Parallel",knowledgeStatus:"Need to think",createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10)});
  return <div className="page map-page">
    <p className="eyebrow">THE WHOLE MOVE, IN RELATIONSHIP</p><div className="map-intro"><div><h1>Your Move Map.</h1><p className="lede">See what can move now, what comes later, and what truly depends on something else.</p></div><div className="map-key"><span><i className="rel parallel"/>Parallel</span><span><i className="rel deferred"/>Deferred choice</span><span><i className="rel hard"/>True blocker</span></div></div>
    <section className="truth-note"><b>Nothing here is automatically true.</b><span>Each card carries a knowledge label, and only a hard dependency can block another step.</span></section>
    <div className="matrix-wrap"><div className="move-matrix">
      <div className="matrix-corner"><small>LIFE STREAM</small></div>{stages.map((stage,index)=><div className="stage-head" key={stage}><small>0{index+1}</small><b>{stage}</b></div>)}
      {streams.map(stream=><MatrixRow key={stream} stream={stream} stages={stages} items={parents} data={data} update={update} edit={edit} add={add}/>)}
    </div></div>
    <section className="relationship-guide"><h2>How the map reads</h2><div>{relationships.map(r=><article key={r}><i className={`rel ${relationClass(r)}`}/><b>{r}</b><p>{relationExplanation(r)}</p></article>)}</div></section>
  </div>;
}

function MatrixRow({stream,stages,items,data,update,edit,add}:{stream:MoveStream;stages:MoveStage[];items:MoveItem[];data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void;add:(s:MoveStage,r:MoveStream)=>void}) {
  return <><div className="stream-head"><span>{streamIcon(stream)}</span><b>{stream}</b></div>{stages.map(stage=><div className="matrix-cell" key={`${stream}-${stage}`}>{items.filter(i=>i.stream===stream&&i.stage===stage).map(item=><MapCard key={item.id} item={item} children={data.items.filter(i=>i.parentId===item.id)} data={data} update={update} edit={edit}/>)}<button className="matrix-add" onClick={()=>add(stage,stream)} aria-label={`Add to ${stream}, ${stage}`}>＋</button></div>)}</>;
}

function MapCard({item,children,data,update,edit}:{item:MoveItem;children:MoveItem[];data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void}) {
  const complete=children.filter(isDone).length;
  const setStatus=(child:MoveItem)=>update({...data,items:data.items.map(i=>i.id===child.id?{...i,status:isDone(i)?"Not started":"Settled"}:i)});
  return <details className={`map-card ${relationClass(item.relationship)}`}><summary><div className="map-card-top"><span>{item.knowledgeStatus}</span><i className={`rel ${relationClass(item.relationship)}`}/></div><h3>{item.title}</h3>{children.length>0&&<small>{complete} of {children.length} subtasks settled</small>}<div className="mini-track"><i style={{width:children.length?`${complete/children.length*100}%`:isDone(item)?"100%":"0%"}}/></div></summary><div className="map-card-body"><p>{item.description}</p><span className="relation-label">{item.relationship}</span>{blocker(item,data.items)&&<em>{blocker(item,data.items)}</em>}{children.map(child=><div className="subtask" key={child.id}><button onClick={()=>setStatus(child)}>{isDone(child)?"✓":"○"}</button><button onClick={()=>edit(child)}>{child.title}</button></div>)}<button className="edit-map-card" onClick={()=>edit(item)}>Open details →</button></div></details>;
}

const relationClass=(r?:RelationshipType)=>r==="Hard dependency"?"hard":r==="Deferred decision"?"deferred":r==="Decision gate"?"gate":r==="Waiting on event"?"waiting":r==="Helpful sequence"?"helpful":r==="Informational"?"info":"parallel";
const relationExplanation=(r:RelationshipType)=>({ "Hard dependency":"This genuinely cannot happen first.","Helpful sequence":"Usually easier afterward, but still movable.","Parallel":"Can happen alongside other work.","Decision gate":"A choice is required before commitment.","Deferred decision":"Intentionally decide closer to when it matters.","Waiting on event":"The next move depends on outside information.","Informational":"Context that guides the plan, not a task." }[r]);
const streamIcon=(s:MoveStream)=>({"Income":"$","Housing":"⌂","Money":"◒","Clear":"↗","Health & dog":"♡","Become":"✦"}[s]);

function AreaPage({area,data,update,edit}:{area:Area;data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void}) {
  const intro={
    Clear:["Clear what’s unfinished.","Make responsibility finite. Leave with love, not an impossible burden."],
    Build:["Build the way there.","A dependency-aware path from income to a signed lease—and a soft landing."],
    Become:["Keep the future alive.","This is not a scorecard. It’s a place to remember who you’re becoming."],
    Vault:["",""],
  }[area];
  const compass={
    Clear:{question:"What could create harm, drag, or unfinished responsibility?",focus:"Make the important loose ends finite.",permission:"You are not required to solve everything."},
    Build:{question:"What makes the move more possible or more trustworthy?",focus:"Prepare evidence and options before commitment.",permission:"Many steps can move in parallel."},
    Become:{question:"What kind of ordinary life are these logistics protecting?",focus:"Keep desire, identity, and belonging visible.",permission:"Reflection is nourishment, not homework."},
    Vault:{question:"",focus:"",permission:""},
  }[area];
  const add=(section:string)=>edit({id:crypto.randomUUID(),title:"",description:"",area,section,status:"Not started",priority:"Relief",timing:"Now",createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10)});
  return <div className="page area-page">
    <p className="eyebrow">{area==="Build"?"THE PRACTICAL FOUNDATION":area==="Clear"?"CURRENT CHAPTER":"THE LIFE AHEAD"}</p><h1>{intro[0]}</h1><p className="lede">{intro[1]}</p>
    <section className={`chapter-compass ${area.toLowerCase()}`}><div><small>THE QUESTION</small><p>{compass.question}</p></div><div><small>THE FOCUS</small><p>{compass.focus}</p></div><div><small>THE PERMISSION</small><p>{compass.permission}</p></div></section>
    {area==="Clear" && <blockquote className="grounding">I want to leave with love and responsibility, but I do not need to solve every problem before I am allowed to move forward.</blockquote>}
    {area==="Build" && <DependencyChain/>}
    {area==="Become" && <Fuel data={data} update={update}/>}
    {areaSections[area].filter(section=>!(area==="Become"&&section==="My Fuel Source")).map((section,index)=>{
      if(area==="Build"&&section==="Timeline") return <Timeline key={section} data={data} update={update}/>;
      if(area==="Build"&&section==="Move Money") return <Money key={section} data={data} update={update}/>;
      if(area==="Build"&&section==="Post-Move Income") return <Routes key={section} data={data} update={update}/>;
      if(area==="Become"&&section==="Flowering Period: First 30 Days") return <Flowering key={section} data={data} update={update}/>;
      const items=data.items.filter(i=>i.area===area&&i.section===section&&!i.parentId);
      const locked=false;
      const reason=sectionReasoning[section];
      return <details className={`section-card ${locked?"locked":""}`} key={section} open={index<2&&!locked}>
        <summary><div className="section-number"><span>{locked?"LOCKED":"0"+(index+1)}</span></div><div className="section-summary"><small>{locked?"WAITING FOR A REAL ADDRESS":sectionCopy[section] || reflectiveCopy(section)}</small><h2>{section}</h2>{reason&&<p><b>Why it belongs:</b> {reason.why}</p>}</div><i>⌄</i></summary>
        {reason&&<div className="reason-strip"><div><small>THIS UNLOCKS</small><p>{reason.unlocks}</p></div><div><small>YOU DO NOT NEED TO</small><p>{reason.permission}</p></div></div>}
        <div className="section-body">{items.map(item=><ItemRow key={item.id} item={item} all={data.items} edit={edit}/>)}{!locked&&<button className="add-row" onClick={()=>add(section)}>＋ Add something gently</button>}{locked&&<p className="locked-copy">There’s nothing to do here yet. A confirmed address and Move Day will unlock these logistics.</p>}</div>
      </details>;
    })}
  </div>;
}

const reflectiveCopy=(section:string)=>({
  "The Life I Want":"Name how home, work, money, music, rest, nature, and community should feel.",
  "People and Relationships":"Connection, appreciation, boundaries, what travels with you, and what does not.",
  "Spiritual Preparation":"Music, images, rituals, intentions, prayers, symbols, tarot or astrology notes—never requirements.",
  "Community and Belonging":"A handful of doors you might knock on. No pressure to belong instantly.",
}[section] || "");

function DependencyChain(){return <section className="dependency-chain"><span>WORK IN PARALLEL</span><b>→</b><span>VERIFY RENTAL FACTS</span><b>→</b><span>CHOOSE INCOME ROUTE</span><b>→</b><span>LEASE</span><b>→</b><span>MOVE LOGISTICS</span></section>}
function Timeline({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="feature-card timeline"><div><span>TEMPORARY PLANNING DATE</span><input type="date" value={data.profile.targetMoveDate} onChange={e=>update({...data,profile:{...data.profile,targetMoveDate:e.target.value}})}/></div><p>October 24 anchors planning—not permission. Financial cleanup, closure, document gathering, health research, and light housing research can move now. Address-dependent setup waits for the lease.</p><div className="timeline-track"><i/><i/><i/><i/><i/></div><div className="timeline-labels"><span>Foundation<br/><b>Now</b></span><span>Job applications<br/><b>Sep 1</b></span><span>Serious search<br/><b>Mid-Sep</b></span><span>Route check<br/><b>Sep 30</b></span><span>Move window<br/><b>Oct 15–31</b></span></div></section>}
function Money({data,update}:{data:MoveData;update:(d:MoveData)=>void}){
  const fund=data.moveFund, gap=Math.max(0,fund.workingTarget-fund.current);
  return <section className="feature-card money">
    <div className="money-head"><div><span>MOVE SAVE FUND · {fund.status.toUpperCase()}</span><h2>${fund.current.toLocaleString()} <small>confirmed</small></h2></div><div><small>LEASE & MOVE-IN WORKING HOPE</small><strong>${fund.workingTarget.toLocaleString()}</strong><em>${gap.toLocaleString()} between today and that estimate</em></div></div>
    <div className="calm-progress"><i style={{width:`${Math.min(100,fund.current/fund.workingTarget*100)}%`}}/></div>
    <div className="fund-context"><span>Source of truth: {fund.source}</span><span>The full move target is intentionally not decided yet.</span></div>
    <p className="money-note">The workbook remains the financial source of truth. These cards organize what the fund may need to cover; they do not duplicate its transactions or decide that every category must be fully funded before you can move.</p>
    <div className="money-grid">{data.money.map(bucket=><label key={bucket.id}><div className="bucket-title"><span>{bucket.label}</span><b className={`knowledge ${bucket.status.toLowerCase().replaceAll(" ","-")}`}>{bucket.status}</b></div><div>$ <input aria-label={`${bucket.label} allocated`} type="number" value={bucket.current} onChange={e=>update({...data,money:data.money.map(m=>m.id===bucket.id?{...m,current:+e.target.value}:m)})}/><small>{bucket.target ? `/ ${bucket.target.toLocaleString()} target` : "target not set"}</small></div><p>{bucket.included}</p><i>{bucket.source}</i>{bucket.uncertain&&<em>{bucket.uncertain}</em>}</label>)}</div>
  </section>
}
function Routes({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="routes"><div className="section-heading"><div><p className="eyebrow">POST-MOVE INCOME</p><h2>Prepare now. Decide when it matters.</h2></div><p>The route choice is intentionally deferred; it does not freeze credit, housing research, closure, or savings work.</p></div>{data.routes.map(route=><details key={route.id} className={`route ${route.active?"active":""}`} open={route.active}><summary><div className="route-number">{route.id.slice(1)}</div><div><small>{route.subtitle}</small><h3>{route.name}</h3><span>{route.status}</span></div><button onClick={e=>{e.preventDefault();update({...data,routes:data.routes.map(r=>({...r,active:r.id===route.id}))})}}>{route.active?"In focus":"Bring into focus"}</button></summary><ul>{route.details.map(d=><li key={d}>○ <span>{d}</span></li>)}</ul></details>)}</section>}
function Fuel({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="fuel"><p className="eyebrow">MY FUEL SOURCE</p><textarea aria-label="Personal statement" value={data.profile.reason} onChange={e=>update({...data,profile:{...data.profile,reason:e.target.value}})}/><div className="reflection-grid">{data.reflections.map(r=><label key={r.id}><span>{r.prompt}</span><textarea value={r.value} onChange={e=>update({...data,reflections:data.reflections.map(x=>x.id===r.id?{...x,value:e.target.value}:x)})}/></label>)}</div></section>}
function Flowering({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="flowering"><div><p className="eyebrow">FIRST 30 DAYS</p><h2>Protect the flowering period.</h2><p>Safe home. Steady routines. One repeated connection. One reminder of why you moved.</p></div><label className="protect"><input type="checkbox" checked={data.profile.protectedMonth} onChange={e=>update({...data,profile:{...data.profile,protectedMonth:e.target.checked}})}/><span><b>Keep this month intentionally protected</b><small>Unnecessary commitments can wait.</small></span></label></section>}
function ItemRow({item,all,edit}:{item:MoveItem;all:MoveItem[];edit:(i:MoveItem)=>void}){const blocked=blocker(item,all);return <button className="item-row" onClick={()=>edit(item)}><span className={`status-dot ${isDone(item)?"done":""}`}>{isDone(item)?"✓":"○"}</span><span><b>{item.title}</b><small>{blocked || item.description || `${item.status} · ${item.timing}`}</small><span className="item-reason"><strong>Why:</strong> {itemReason(item,all)}</span></span><em>{blocked?"Waiting":item.status}</em><i>→</i></button>}

function itemReason(item:MoveItem,all:MoveItem[]) {
  const blocked=blocker(item,all);
  if(blocked) return `It stays visible because ${blocked.toLowerCase()}, but it is not work for today.`;
  if(item.relationship==="Deferred decision") return "This choice matters later; deciding now would create false certainty.";
  if(item.relationship==="Decision gate") return "A clear choice here prevents committing money or energy too early.";
  if(item.priority==="Safety") return "It protects safety or continuity before the move adds more pressure.";
  if(item.priority==="Income") return "It keeps income options credible without forcing the final route yet.";
  if(item.priority==="Housing") return "It strengthens housing readiness or removes friction from an application.";
  if(item.unlocks?.length) return `Finishing it makes ${item.unlocks.length} later ${item.unlocks.length===1?"step":"steps"} easier to begin.`;
  if(item.timing==="Allowed to wait") return "It matters, but consciously postponing it protects attention for move readiness.";
  if(item.area==="Become") return "It keeps the life you are moving toward present inside the practical plan.";
  return "It creates useful relief without pretending every loose end is a blocker.";
}

function Vault({data,update}:{data:MoveData;update:(d:MoveData)=>void}) {
  const [draft,setDraft]=useState<VaultEntry|null>(null);
  const categories=["Credit documents","Car estimates","Tickets and bills","Employment files","Rental documents","Saved listings","Furniture links","Medical records links","Dog records links","Moving quotes","Research","Important contacts","Notes"];
  return <div className="page area-page"><p className="eyebrow">REFERENCE, NOT CLUTTER</p><h1>The Vault.</h1><p className="lede">Links, dates, titles, and notes live here. Sensitive account, medical, password, and identity data do not.</p><div className="vault-grid">{data.vault.map(entry=><article key={entry.id}><span>{entry.category}</span><h3>{entry.title}</h3><p>{entry.notes}</p><a href={entry.url} target="_blank" rel="noreferrer">Open link ↗</a><button onClick={()=>update({...data,vault:data.vault.filter(v=>v.id!==entry.id)})}>Remove</button></article>)}<button className="vault-add" onClick={()=>setDraft({id:crypto.randomUUID(),title:"",category:categories[0],url:"",date:new Date().toISOString().slice(0,10),notes:""})}>＋<b>Add a reference</b><small>No files or sensitive details.</small></button></div>{draft&&<div className="modal-backdrop"><form className="modal" onSubmit={e=>{e.preventDefault();update({...data,vault:[...data.vault,draft]});setDraft(null)}}><h2>Add to the Vault</h2><label>Title<input required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>Category<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Link<input type="url" required value={draft.url} onChange={e=>setDraft({...draft,url:e.target.value})}/></label><label>Notes<textarea value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><div className="modal-actions"><Button onClick={()=>setDraft(null)}>Cancel</Button><Button type="submit" kind="primary">Save reference</Button></div></form></div>}</div>;
}

function Settings({data,update,dark,setDark,fileRef}:{data:MoveData;update:(d:MoveData)=>void;dark:boolean;setDark:(v:boolean)=>void;fileRef:React.RefObject<HTMLInputElement|null>}) {
  const exportData=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="move-os-export.json";a.click();URL.revokeObjectURL(a.href)};
  return <div className="page area-page settings"><p className="eyebrow">YOUR SPACE</p><h1>Settings.</h1><p className="lede">Personalize your horizon and keep a portable copy of everything.</p><section className="settings-card"><h2>Move profile</h2><label>Destination<input value={data.profile.destination} onChange={e=>update({...data,profile:{...data.profile,destination:e.target.value}})}/></label><label>Current phase<input value={data.profile.phase} onChange={e=>update({...data,profile:{...data.profile,phase:e.target.value}})}/></label><label>Current unlock<textarea value={data.profile.currentUnlock} onChange={e=>update({...data,profile:{...data.profile,currentUnlock:e.target.value}})}/></label></section><section className="settings-card"><h2>Appearance & data</h2><label className="switch-row"><span><b>Dark mode</b><small>A quieter palette for evenings.</small></span><input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)}/></label><div className="data-actions"><Button kind="primary" onClick={exportData}>Export all data</Button><Button onClick={()=>fileRef.current?.click()}>Import JSON</Button><input ref={fileRef} hidden type="file" accept="application/json" onChange={e=>{const file=e.target.files?.[0];if(file)file.text().then(text=>update(JSON.parse(text)))}}/></div><p className="privacy">Stored only in this browser. Move OS does not send this information anywhere.</p></section></div>;
}

function ItemModal({item,all,onClose,onSave,onDelete}:{item:MoveItem;all:MoveItem[];onClose:()=>void;onSave:(i:MoveItem)=>void;onDelete:()=>void}) {
  const [draft,setDraft]=useState(item);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><form className="modal" onSubmit={e=>{e.preventDefault();onSave({...draft,updatedAt:new Date().toISOString().slice(0,10)})}}><div className="modal-head"><div><span>{draft.area} · {draft.section}</span><h2>{item.title?"Edit this piece":"Add something"}</h2></div><button type="button" onClick={onClose}>×</button></div><label>Title<input autoFocus required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>Description<textarea value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><div className="form-grid"><label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Timing<select value={draft.timing} onChange={e=>setDraft({...draft,timing:e.target.value as Timing})}>{timings.map(t=><option key={t}>{t}</option>)}</select></label></div><div className="form-grid"><label>Move phase<select value={draft.stage||"Foundation"} onChange={e=>setDraft({...draft,stage:e.target.value as MoveStage})}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><label>Life stream<select value={draft.stream||"Clear"} onChange={e=>setDraft({...draft,stream:e.target.value as MoveStream})}>{streams.map(s=><option key={s}>{s}</option>)}</select></label></div><div className="form-grid"><label>Relationship<select value={draft.relationship||"Parallel"} onChange={e=>setDraft({...draft,relationship:e.target.value as RelationshipType})}>{relationships.map(s=><option key={s}>{s}</option>)}</select></label><label>What do we know?<select value={draft.knowledgeStatus||"Need to think"} onChange={e=>setDraft({...draft,knowledgeStatus:e.target.value as KnowledgeStatus})}>{knowledgeStatuses.map(s=><option key={s}>{s}</option>)}</select></label></div><label>Part of a larger task<select value={draft.parentId||""} onChange={e=>setDraft({...draft,parentId:e.target.value||undefined})}><option value="">This is a main task or project</option>{all.filter(i=>i.id!==draft.id&&!i.parentId).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label>Related dependency<select value={draft.dependency||""} onChange={e=>setDraft({...draft,dependency:e.target.value||undefined})}><option value="">Nothing — this can move now</option>{all.filter(i=>i.id!==draft.id).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label>{blocker(draft,all)&&<p className="blocker">This is a true blocker: {blocker(draft,all)}.</p>}<label>Notes<textarea value={draft.notes||""} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><div className="modal-actions">{item.title&&<button type="button" className="delete" onClick={onDelete}>Delete</button>}<span/><Button onClick={onClose}>Cancel</Button><Button type="submit" kind="primary">Save</Button></div></form></div>;
}
