"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Area, KnowledgeStatus, MoveData, MoveItem, MoveStage, MoveStream, RelationshipType, Status, Timing, VaultEntry } from "./types";
import { moveRepository } from "./repository";
import { blocker, isDone, recommendations } from "./priorities";

type Page = "Overview" | "Hub" | "Calendar" | "Connections" | "Clear" | "Build" | "Become" | "Vault" | "Settings";
const toolPages: {name:Page; icon:string}[] = [
  {name:"Overview",icon:"☼"},{name:"Hub",icon:"◎"},{name:"Calendar",icon:"□"},{name:"Connections",icon:"✧"},
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
const statuses:Status[] = ["Not started","In motion","Waiting","Blocked","Completed","Deferred"];
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
  const [page,setPage] = useState<Page>("Overview");
  const [areasOpen,setAreasOpen] = useState(false);
  const [dark,setDark] = useState(false);
  const [overwhelmed,setOverwhelmed] = useState(false);
  const [editing,setEditing] = useState<MoveItem|null>(null);
  const [searchOpen,setSearchOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ moveRepository.load().then(setData); },[]);
  useEffect(()=>{ if(data) moveRepository.save(data); },[data]);
  useEffect(()=>{ document.documentElement.dataset.theme = dark ? "dark" : "light"; },[dark]);
  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setSearchOpen(true)}if(event.key==="Escape")setSearchOpen(false)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
  if(!data) return <div className="loading">Gathering your move plan…</div>;
  const update=(next:MoveData)=>setData(next);
  return <div className="app-shell">
    <aside className="sidebar">
      <Logo/>
      <nav aria-label="Primary" className="celestial-nav">
        <button className={page==="Overview"?"active":""} onClick={()=>{setPage("Overview");setOverwhelmed(false)}}><span>☼</span>Overview</button>
        <button className={`area-menu-button ${["Clear","Build","Become"].includes(page)?"active":""}`} aria-expanded={areasOpen} onClick={()=>setAreasOpen(!areasOpen)}><span>◒</span>Life areas <i>{areasOpen?"−":"+"}</i></button>
        {areasOpen&&<div className="area-menu">{(["Clear","Build","Become"] as Page[]).map((area,index)=><button key={area} className={page===area?"active":""} onClick={()=>{setPage(area);setOverwhelmed(false)}}><span>{["↗","◇","✦"][index]}</span><div><b>{area}</b><small>{["finish this chapter","build the foundation","protect the future"][index]}</small></div></button>)}</div>}
        <small className="nav-label">TOOLS</small>
        {toolPages.slice(1).map(p=><button key={p.name} className={page===p.name?"active":""} onClick={()=>{setPage(p.name);setOverwhelmed(false)}}><span>{p.icon}</span>{p.name}</button>)}
      </nav>
      <button className="plan-search-button" onClick={()=>setSearchOpen(true)}><span>⌕</span><div><b>Find anything</b><small>Tasks, sections, notes</small></div><kbd>⌘K</kbd></button>
      <div className="sidebar-quote"><small>YOUR NORTH STAR</small><p>“{data.profile.reason}”</p></div>
      <div className="utility-links"><button onClick={()=>setPage("Vault")}>Vault</button><button onClick={()=>setPage("Settings")}>Settings</button></div>
      <button className="theme-toggle" onClick={()=>setDark(!dark)}>{dark?"☀︎  Light mode":"☾  Dark mode"}</button>
    </aside>
    <main>
      <header className="topbar"><Logo/><button className="mobile-search" onClick={()=>setSearchOpen(true)} aria-label="Search the plan">⌕</button><button className="phase-pill"><i/> {data.profile.phase}</button></header>
      {page==="Overview" && <Today data={data} update={update} overwhelmed={overwhelmed} setOverwhelmed={setOverwhelmed} edit={setEditing} goTo={setPage}/>}
      {page==="Hub" && <ProgressHub data={data} edit={setEditing} goTo={setPage}/>}
      {page==="Calendar" && <CalendarPage data={data} edit={setEditing}/>}
      {page==="Connections" && <ConnectionsPage data={data} edit={setEditing} goTo={setPage}/>}
      {(page==="Clear"||page==="Build"||page==="Become") && <AreaPage area={page} data={data} update={update} edit={setEditing}/>}
      {page==="Vault" && <Vault data={data} update={update}/>}
      {page==="Settings" && <Settings data={data} update={update} dark={dark} setDark={setDark} fileRef={fileRef}/>}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{([...[{name:"Overview",icon:"☼"},{name:"Clear",icon:"↗"},{name:"Build",icon:"◇"},{name:"Become",icon:"✦"}],...toolPages.slice(1)] as {name:Page;icon:string}[]).map(p=><button key={p.name} className={page===p.name?"active":""} onClick={()=>{setPage(p.name);setOverwhelmed(false)}}><span>{p.icon}</span>{p.name}</button>)}</nav>
    {searchOpen&&<PlanSearch data={data} onClose={()=>setSearchOpen(false)} onOpen={item=>{setEditing(item);setSearchOpen(false)}} goTo={next=>{setPage(next);setSearchOpen(false)}}/>}
    {editing && <ItemModal item={editing} all={data.items} onOpen={setEditing} onClose={()=>setEditing(null)} onSave={saved=>{update({...data,items:data.items.some(i=>i.id===saved.id)?data.items.map(i=>i.id===saved.id?saved:i):[...data.items,saved]});setEditing(null)}} onDelete={()=>{update({...data,items:data.items.filter(i=>i.id!==editing.id)});setEditing(null)}}/>}
  </div>;
}

function PlanSearch({data,onClose,onOpen,goTo}:{data:MoveData;onClose:()=>void;onOpen:(item:MoveItem)=>void;goTo:(page:Page)=>void}){
  const [query,setQuery]=useState("");
  const normalized=query.trim().toLowerCase();
  const results=normalized?data.items.filter(item=>[item.title,item.description,item.section,item.notes,item.status,item.knowledgeStatus].some(value=>value?.toLowerCase().includes(normalized))).slice(0,12):data.items.filter(item=>!isDone(item)&&item.timing!=="Allowed to wait").slice(0,8);
  return <div className="search-backdrop" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><section className="plan-search" role="dialog" aria-modal="true" aria-label="Find anything in Move OS"><header><span>⌕</span><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search tasks, sections, notes, or statuses…"/><button onClick={onClose} aria-label="Close search">×</button></header><div className="search-area-shortcuts">{(["Clear","Build","Become"] as const).map(area=><button key={area} onClick={()=>goTo(area)}><span>{area==="Clear"?"↗":area==="Build"?"◇":"✦"}</span>{area}</button>)}</div><div className="search-results"><small>{normalized?`${results.length} MATCH${results.length===1?"":"ES"}`:"OPEN PIECES"}</small>{results.length?results.map(item=><button key={item.id} onClick={()=>onOpen(item)}><span className={`search-area search-${item.area.toLowerCase()}`}>{item.area.slice(0,1)}</span><div><b>{item.title}</b><small>{item.section} · {item.status}</small></div><i>→</i></button>):<p>No pieces match that search.</p>}</div><footer><span><kbd>ESC</kbd> close</span><p>One place to remember everything.</p></footer></section></div>
}

function Today({data,update,overwhelmed,setOverwhelmed,edit,goTo}:{data:MoveData;update:(d:MoveData)=>void;overwhelmed:boolean;setOverwhelmed:(v:boolean)=>void;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const [now] = useState(() => Date.now());
  const mantras=["I do not need perfect certainty to keep moving.","Every fact I learn gives the future more shape.","My preparation serves my freedom—not my fear.","I can love where I am and still choose what comes next.","The life I want is allowed to influence the plan.","Small settled pieces become a real crossing.","Ready enough is a doorway, not a finish line."];
  const suggested=useMemo(()=>recommendations(data.items),[data.items]);
  const waiting=data.items.filter(i=>blocker(i,data.items)).slice(0,3);
  const settled=data.items.filter(isDone).slice(-3).reverse();
  const days=Math.max(0,Math.ceil((new Date(data.profile.targetMoveDate).getTime()-now)/86400000));
  const todayDate=new Date(now);
  const mantra=mantras[Math.floor(now/86400000)%mantras.length];
  const active=data.items.filter(i=>i.timing!=="Allowed to wait"&&i.relationship!=="Informational");
  const complete=active.filter(isDone).length;
  const completion=active.length?Math.round(complete/active.length*100):0;
  const areaProgress=(["Clear","Build","Become"] as const).map(area=>{const items=active.filter(i=>i.area===area);const done=items.filter(isDone).length;return {area,done,total:items.length,percent:items.length?Math.round(done/items.length*100):0}});
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
    <section className="celestial-hero"><img src="/og.png" alt="Celestial paths converging on a glowing new home"/><div className="hero-overlay"><small>MOVE OS · YOUR LIVING COMPASS</small><h2>One life,<br/><em>moving toward itself.</em></h2><button onClick={()=>goTo("Hub")}>See the whole journey →</button></div><div className="orbit-stamp"><span>{days}</span><small>days to the<br/>planning date</small></div></section>
    <div className="welcome">
      <div><p className="eyebrow">GOOD MORNING · {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"})}</p><h1>You’re not moving all at once.<br/><em>You’re building the way there.</em></h1></div>
      <div className="move-date"><small>TODAY · {todayDate.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</small><span className="daily-mantra">“{mantra}”</span><small>TARGET PLANNING DATE</small><strong>{new Date(data.profile.targetMoveDate+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</strong><span><b>{days} days</b> to planning date · backup {new Date(data.profile.backupDate+"T12:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span></div>
    </div>
    <section className="unlock"><div className="unlock-mark">↗</div><div><span>CURRENT UNLOCK</span><h2>{data.profile.currentUnlock}</h2><p>This work supports several possible paths. The final job choice can stay intentionally deferred.</p></div><Button kind="ink" onClick={()=>edit(data.items.find(i=>i.id==="rental-ready")!)}>Continue <b>→</b></Button></section>
    <section className="overview-dashboard"><div className={`overview-score progress-${completion<35?"low":completion<75?"medium":"high"}`}><span>{completion}%</span><div><small>ACTIVE PLAN SETTLED</small><b>{complete} of {active.length} pieces</b></div></div><div className="overview-progress-bars">{areaProgress.map(stat=><button key={stat.area} onClick={()=>goTo(stat.area)}><div><b>{stat.area}</b><span>{stat.done}/{stat.total}</span></div><i><em style={{width:`${stat.percent}%`}}/></i></button>)}</div><blockquote><small>WHY THIS MATTERS</small><p>{data.profile.reason}</p></blockquote></section>
    <div className="section-heading"><div><p className="eyebrow">A BALANCED DAY</p><h2>Three things that matter now</h2></div><p>One from each part of the life you’re tending.</p></div>
    <div className="suggestions">{suggested.map((item,index)=><ActionCard key={item.id} item={item} number={index+1} edit={edit} data={data} update={update}/>)}</div>
    <details className="overview-areas"><summary><div><span>◒</span><div><small>THE THREE EFFORTS</small><b>Explore Clear, Build, and Become</b></div></div><i>⌄</i></summary><div>{(["Clear","Build","Become"] as const).map((area,index)=><button key={area} onClick={()=>goTo(area)}><span>{["↗","◇","✦"][index]}</span><div><b>{area}</b><small>{["Finish responsibly without making perfection the gate.","Create trustworthy money, housing, income, and arrival options.","Keep creativity, belonging, love, and the desired life visible."][index]}</small></div><i>→</i></button>)}</div></details>
    <div className="lower-grid">
      <section className="quiet-list"><div className="list-title"><h3>Waiting on another step</h3><span>{waiting.length}</span></div>{waiting.map(i=><button onClick={()=>edit(i)} key={i.id}><b>{i.title}</b><small>{blocker(i,data.items)}</small></button>)}</section>
      <section className="quiet-list settled"><div className="list-title"><h3>Recently completed</h3><span>✓</span></div>{settled.map(i=><button onClick={()=>edit(i)} key={i.id}><b>{i.title}</b><small>Completed · quietly done</small></button>)}</section>
    </div>
    <button className="overwhelm" onClick={()=>setOverwhelmed(true)}><span>○</span><div><b>I feel overwhelmed</b><small>Show me just one kind next step.</small></div><i>→</i></button>
    <p className="principle">One place to remember everything. <b>A few things to work on.</b> One life I am moving toward.</p>
  </div>;
}

function ActionCard({item,number,edit,data,update}:{item:MoveItem;number:number;edit:(i:MoveItem)=>void;data:MoveData;update:(d:MoveData)=>void}) {
  const colors={Clear:"coral",Build:"sage",Become:"lavender",Vault:"sand"};
  return <article className={`action-card ${colors[item.area]}`}><div className="card-top"><span>{item.area.toUpperCase()}</span><i>0{number}</i></div><h3>{item.title}</h3><p>{item.description}</p><div className="why-now"><small>WHY THIS NOW</small><span>{itemReason(item,data.items)}</span></div><div className="card-bottom"><button onClick={()=>update({...data,items:data.items.map(i=>i.id===item.id?{...i,status:"Completed",updatedAt:new Date().toISOString().slice(0,10)}:i)})} aria-label={`Complete ${item.title}`}>○</button><button onClick={()=>edit(item)}>Open <b>→</b></button></div></article>;
}

function ProgressHub({data,edit,goTo}:{data:MoveData;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const [view,setView]=useState<"progress"|"timeline">("progress");
  const actionable=data.items.filter(i=>i.timing!=="Allowed to wait"&&i.relationship!=="Informational");
  const settled=actionable.filter(isDone).length;
  const percent=actionable.length?Math.round(settled/actionable.length*100):0;
  const areaData=(["Clear","Build","Become"] as const).map(area=>{
    const items=actionable.filter(i=>i.area===area);
    const done=items.filter(isDone).length;
    return {area,items,done,percent:items.length?Math.round(done/items.length*100):0};
  });
  const timeline=[
    {label:"Now · Foundation",note:"Facts, relief, and preparation that do not need a final job or address.",items:data.items.filter(i=>i.timing==="Now"&&!isDone(i)).slice(0,6)},
    {label:"September · Decisions get useful",note:"Test income routes, verify landlord rules, and turn light research into a shortlist.",items:data.items.filter(i=>i.dueDate?.startsWith("2026-09")||i.id==="apartment-shortlist"||i.id==="property-rules").slice(0,6)},
    {label:"October 15–31 · Move window",note:"Commit only with enough evidence. October 24 remains the temporary planning date.",items:data.items.filter(i=>i.stage==="Commit"||i.id==="holiday-plan").slice(0,6)},
    {label:"After the lease",note:"A confirmed address unlocks accurate bookings and administrative setup.",items:data.items.filter(i=>i.timing==="After the lease").slice(0,6)},
    {label:"Arrival · Protect the landing",note:"Functional home, steady routines, one repeated connection, and room to feel the new life.",items:data.items.filter(i=>i.timing==="After arrival"||i.stage==="Land").slice(0,6)},
  ];
  return <div className="page hub-page">
    <div className="hub-heading"><div><p className="eyebrow">YOUR CENTRAL VIEW</p><h1>See the move taking shape.</h1><p className="lede">Progress without pretending every task is equal—or that every unknown is a problem.</p></div><div className="view-switch" role="group" aria-label="Hub view"><button className={view==="progress"?"active":""} onClick={()=>setView("progress")}>Progress</button><button className={view==="timeline"?"active":""} onClick={()=>setView("timeline")}>Timeline</button></div></div>
    {view==="progress"?<>
      <section className="overall-progress">
        <div className="progress-ring" style={{"--progress":`${percent*3.6}deg`} as React.CSSProperties}><span><strong>{percent}%</strong><small>complete</small></span></div>
        <div><small>THE WHOLE ACTIVE PLAN</small><h2>{settled} of {actionable.length} pieces are completed</h2><p>Waiting and research still count as understood parts of the plan. “Allowed to Wait” is excluded because postponing it is already a decision.</p></div>
        <div className="progress-key"><span><i className="done"/>Completed <b>{settled}</b></span><span><i className="motion"/>In motion <b>{actionable.filter(i=>i.status==="In motion").length}</b></span><span><i className="open"/>Open <b>{actionable.filter(i=>!isDone(i)&&i.status!=="In motion").length}</b></span></div>
      </section>
      <div className="area-progress-grid">{areaData.map(({area,items,done,percent:areaPercent})=><article className={`area-progress ${area.toLowerCase()} progress-${areaPercent<35?"low":areaPercent<75?"medium":"high"}`} key={area}>
        <div className="area-progress-top"><span>{area}</span><strong>{areaPercent}%</strong></div><div className="area-bar"><i style={{width:`${areaPercent}%`}}/></div>
        <h2>{done} completed <small>of {items.length}</small></h2>
        <p>{area==="Clear"?"Finish this chapter without turning love or responsibility into an endless gate.":area==="Build"?"Create trustworthy options for money, housing, income, health, and the move itself.":"Keep the desired home, relationships, creativity, and belonging inside the plan."}</p>
        <button onClick={()=>goTo(area)}>Open {area} →</button>
      </article>)}</div>
      <section className="milestone-lane"><div className="hub-section-title"><div><p className="eyebrow">THE MAIN STORY</p><h2>Five milestones—not fifty disconnected tasks</h2></div><p>Each milestone gathers the smaller work beneath it.</p></div><div className="milestones">{[
        ["1","Financial ground","Know which credit and loose-end work truly affects the move.","credit-plan"],
        ["2","Rental ready","Verify the budget, property rules, and application packet.","rental-ready"],
        ["3","Income evidence","Keep options open; choose the route when timing makes it useful.","income-options"],
        ["4","A real home","Shortlist, compare true cost, review, and sign.","lease"],
        ["5","Move and land","Unlock logistics with the lease, then protect the first month.","move-plan"],
      ].map(([number,title,copy,id],index)=>{const milestone=data.items.find(i=>i.id===id);const children=data.items.filter(i=>i.parentId===id);const done=isDone(milestone!)||children.length>0&&children.every(isDone);return <button className={`milestone-${index+1} ${done?"is-complete":""}`} key={id} onClick={()=>milestone&&edit(milestone)}><span className={done?"complete":""}>{done?"✓":number}</span><div><small>MILESTONE 0{index+1}</small><b>{title}</b><em>{copy}</em></div><i>→</i></button>})}</div></section>
    </>:<section className="journey-timeline">
      <div className="timeline-intro"><div><p className="eyebrow">A CALM SEQUENCE</p><h2>The plan across time</h2></div><p>This is an order of attention, not a rule that says you cannot move until life is perfect.</p></div>
      {timeline.map((period,index)=><article key={period.label} className="timeline-period"><div className="timeline-date"><span>0{index+1}</span><div><h3>{period.label}</h3><p>{period.note}</p></div></div><div className="timeline-items">{period.items.length?period.items.map(item=><button key={item.id} onClick={()=>edit(item)}><span className={isDone(item)?"done":""}>{isDone(item)?"✓":"○"}</span><div><b>{item.title}</b><small>{item.relationship==="Hard dependency"?(blocker(item,data.items)||"Ready when its prerequisite is completed"):item.status+" · "+item.knowledgeStatus}</small></div><i>→</i></button>):<p className="empty-period">Nothing needs your attention here yet.</p>}</div></article>)}
    </section>}
  </div>;
}

function CalendarPage({data,edit}:{data:MoveData;edit:(i:MoveItem)=>void}) {
  const target=new Date(data.profile.targetMoveDate+"T12:00");
  const daysFrom=(date:string)=>Math.max(0,Math.ceil((target.getTime()-new Date(date+"T12:00").getTime())/86400000));
  const groups=[
    {month:"AUG",name:"Ground & gather",symbol:"☿",anchor:"2026-08-03",copy:"Turn fears into facts. Keep the options moving.",items:data.items.filter(i=>i.timing==="Now"&&!isDone(i)).slice(0,7)},
    {month:"SEP",name:"Test & decide",symbol:"◐",anchor:"2026-09-01",copy:"Income conversations, applications, property rules, and a real shortlist.",items:data.items.filter(i=>i.dueDate?.startsWith("2026-09")||["property-rules","apartment-shortlist","rent-budget"].includes(i.id)).slice(0,7)},
    {month:"OCT",name:"Commit & cross",symbol:"○",anchor:"2026-10-15",copy:"The October 15–31 window. Sign only when enough is known.",items:data.items.filter(i=>i.stage==="Commit"||["holiday-plan","goodbye-time","grandma-letter"].includes(i.id)).slice(0,7)},
    {month:"LAND",name:"Arrive softly",symbol:"✦",anchor:data.profile.targetMoveDate,copy:"Address-dependent setup, a functional home, routines, and belonging.",items:data.items.filter(i=>i.timing==="After the lease"||i.timing==="After arrival"||i.stage==="Land").slice(0,7)},
  ];
  return <div className="page calendar-page"><div className="tool-hero"><div><p className="eyebrow">TIME AS A SUPPORT, NOT A THREAT</p><h1>Your move calendar.</h1><p className="lede">A seasonal view of when each kind of effort becomes useful. Dates are working anchors, not permission slips.</p></div><div className="moon-clock"><i/><span>OCT<br/><b>24</b></span></div></div><section className="calendar-orbit">{groups.map((group,index)=><article key={group.month}><header><span>{group.symbol}</span><div><small>{group.month} · 0{index+1}</small><h2>{group.name}</h2></div></header><div className="month-countdown"><strong>{daysFrom(group.anchor)}</strong><span>days from this marker<br/>to the planning date</span></div><p>{group.copy}</p><div>{group.items.map(item=><button key={item.id} onClick={()=>edit(item)}><span className={isDone(item)?"done":""}>{isDone(item)?"✓":"○"}</span><div><b>{item.title}</b><small>{item.dueDate?new Date(item.dueDate+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}):item.knowledgeStatus}</small></div></button>)}</div></article>)}</section><div className="calendar-note"><span>☼</span><p><b>The plan can breathe.</b> If October 24 changes, the sequence still holds: prepare what is knowable, commit when the evidence is real, then land gently.</p></div></div>;
}

function ConnectionsPage({data,edit,goTo}:{data:MoveData;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const [selectedStar,setSelectedStar]=useState<string|null>(null);
  const nodes=[
    {area:"Clear" as Page,symbol:"↗",title:"Release the drag",copy:"Credit facts, finite family support, closure, and the few loose ends that matter.",item:"credit-plan",orbit:"Inner orbit"},
    {area:"Build" as Page,symbol:"◇",title:"Become rental ready",copy:"Documents, property rules, and a sustainable budget can move before the final income choice.",item:"rental-ready",orbit:"Foundation orbit"},
    {area:"Build" as Page,symbol:"☿",title:"Keep income fluid",copy:"Three credible routes travel beside housing work until late September makes a decision useful.",item:"income-options",orbit:"Decision orbit"},
    {area:"Build" as Page,symbol:"⌂",title:"Commit to a home",copy:"The lease is the true hinge: it creates the address that unlocks accurate physical logistics.",item:"lease",orbit:"Commitment orbit"},
    {area:"Become" as Page,symbol:"✦",title:"Protect the desire",copy:"Home, creativity, relationships, and belonging are the reason for the work—not a prize afterward.",item:"life-filter",orbit:"Outer orbit"},
  ];
  const dependencies=data.items.filter(i=>i.relationship==="Hard dependency").map(item=>({item,source:data.items.find(x=>x.id===item.dependency)}));
  const selectedNode=nodes.find(node=>node.item===selectedStar);
  const selectedTasks=!selectedStar?[]:selectedStar==="credit-plan"?data.items.filter(i=>i.area==="Clear"):selectedStar==="rental-ready"?data.items.filter(i=>["Rental Readiness","Housing and Lease"].includes(i.section)):selectedStar==="income-options"?data.items.filter(i=>i.section==="Post-Move Income"):selectedStar==="lease"?data.items.filter(i=>["Housing and Lease","Physical Move","Land Softly"].includes(i.section)):data.items.filter(i=>i.area==="Become");
  return <div className="page connections-page">
    <div className="tool-hero"><div><p className="eyebrow">YOUR MOVE AS A LIVING SYSTEM</p><h1>The Saturn map.</h1><p className="lede">The center is the life you want. Each orbit carries a different kind of effort, and only a few crossings are true gates.</p></div><div className="saturn-legend"><span><i className="clear"/>Clear</span><span><i className="build"/>Build</span><span><i className="become"/>Become</span></div></div>
    <section className="constellation-map saturn-map">
      <div className="constellation-center saturn-center"><small>THE LIFE AT THE CENTER</small><strong>Safe. Alive.<br/>Creative. Mine.</strong><span>Denver · October 2026</span><i className="saturn-band band-a"/><i className="saturn-band band-b"/></div>
      {nodes.map((node,index)=>{const piece=data.items.find(i=>i.id===node.item);return <button className={`concept-node node-${index+1} ${node.area.toLowerCase()} ${selectedStar===node.item?"selected":""}`} key={node.item} onClick={()=>setSelectedStar(node.item)}><span>{node.symbol}</span><div><small>{node.orbit} · {node.area}</small><b>{node.title}</b><p>{node.copy}</p><em>{piece?.status} · {piece?.knowledgeStatus}</em></div></button>})}
      <i className="orbit orbit-one"/><i className="orbit orbit-two"/><i className="orbit orbit-three"/>
      <span className="orbit-label label-one">PREPARE</span><span className="orbit-label label-two">DECIDE</span><span className="orbit-label label-three">LAND</span>
      <i className="satellite satellite-one"/><i className="satellite satellite-two"/><i className="satellite satellite-three"/><i className="satellite satellite-four"/>
    </section>
    {selectedNode&&<section className={`star-constellation constellation-${selectedNode.area.toLowerCase()}`}><header><div><small>{selectedNode.orbit} · OPEN CONSTELLATION</small><h2>{selectedNode.title}</h2><p>{selectedNode.copy}</p></div><button onClick={()=>setSelectedStar(null)}>Close constellation ×</button></header><div className="constellation-task-field"><i className="constellation-line line-a"/><i className="constellation-line line-b"/>{selectedTasks.map((task,index)=><button className={`task-star task-star-${index%6+1} ${isDone(task)?"settled":""}`} key={task.id} onClick={()=>edit(task)}><span>✦</span><div><small>{task.section}</small><b>{task.title}</b><em>{task.status} · {task.knowledgeStatus}</em></div></button>)}</div><p className="constellation-help">Each star is an editable piece. Select one to open its full context, status, timing, and connections.</p></section>}
    <section className="system-story"><article className="clear"><span>↗</span><small>CLEAR CHANGES THE PAST</small><h3>Make the old chapter finite.</h3><p>It reduces drag and protects the application—but it does not demand perfection.</p></article><article className="build"><span>◇</span><small>BUILD CREATES EVIDENCE</small><h3>Turn possibilities into a landing path.</h3><p>Money, income, and housing inform one another without becoming one frozen chain.</p></article><article className="become"><span>✦</span><small>BECOME PROVIDES GRAVITY</small><h3>Let desire guide the practical choices.</h3><p>The life you want determines what “worth it” and “ready enough” actually mean.</p></article></section>
    <section className="true-connections"><div className="hub-section-title"><div><p className="eyebrow">THE FEW REAL CROSSINGS</p><h2>Where one orbit truly unlocks another</h2></div><p>These are dependencies. The rest can keep circling in parallel.</p></div><div>{dependencies.map(({item,source})=><button key={item.id} onClick={()=>edit(item)}><div><small>SETTLE FIRST</small><b>{source?.title||"Prerequisite"}</b></div><span>→</span><div><small>THEN THIS OPENS</small><b>{item.title}</b></div></button>)}</div></section>
    <section className="parallel-ribbon"><div><span>☿</span><p><b>Still moving in parallel:</b> savings, credit research, rental documents, neighborhood learning, employer research, health continuity, family plans, closure, and the life you want.</p></div><button onClick={()=>goTo("Hub")}>Return to progress hub →</button></section>
  </div>;
}

const sectionId=(section:string)=>`section-${section.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}`;
function AreaDashboard({area,data}:{area:Exclude<Area,"Vault">;data:MoveData}) {
  const sections=areaSections[area].filter(section=>section!=="My Fuel Source");
  const items=data.items.filter(i=>i.area===area&&i.timing!=="Allowed to wait"&&i.relationship!=="Informational");
  const complete=items.filter(isDone).length;
  const percent=items.length?Math.round(complete/items.length*100):0;
  const meanings={Clear:{label:"WHAT CLEAR MEANS",definition:"Clear means deciding what must be resolved, what only needs a finite plan, and what is not yours to carry into the move.",labels:["What could follow me?","What deserves a finite response?","What am I allowed to set down?"]},Build:{label:"WHAT BUILD MEANS",definition:"Build means creating enough financial, employment, housing, health, and logistical evidence to make the move trustworthy.",labels:["What foundation is missing?","What can I prepare now?","What waits for a real address?"]},Become:{label:"WHAT BECOME MEANS",definition:"Become means keeping the desired home, creativity, relationships, community, and inner life present while the practical plan takes shape.",labels:["What life am I protecting?","What should guide my choices?","What does not need to be earned?"]}}[area];
  return <section className={`area-dashboard dashboard-${area.toLowerCase()}`}><div className="area-definition"><small>{meanings.label}</small><p>{meanings.definition}</p><div>{meanings.labels.map(label=><span key={label}>{label}</span>)}</div></div><div className="area-completion"><div className={`mini-progress progress-${percent<35?"low":percent<75?"medium":"high"}`}><strong>{percent}%</strong><small>complete</small></div><p><b>{complete} of {items.length}</b> active pieces complete</p></div><nav className="area-toc" aria-label={`${area} table of contents`}><small>SECTION OVERVIEW</small>{sections.map((section,index)=>{const sectionItems=data.items.filter(i=>i.area===area&&i.section===section);const done=sectionItems.filter(isDone).length;return <button key={section} onClick={()=>document.getElementById(sectionId(section))?.scrollIntoView({behavior:"smooth",block:"start"})}><span>0{index+1}</span><div><b>{section}</b><small>{done} of {sectionItems.length} completed</small></div><i>↓</i></button>})}</nav></section>;
}

function AreaPage({area,data,update,edit}:{area:Area;data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void}) {
  const intro={
    Clear:["Clear what’s unfinished.","Make responsibility finite. Leave with love, not an impossible burden."],
    Build:["Build the way there.","A dependency-aware path from income to a signed lease—and a soft landing."],
    Become:["Keep the future alive.","This is not a scorecard. It’s a place to remember who you’re becoming."],
    Vault:["",""],
  }[area];
  const compass={
    Clear:{question:"WHAT CLEAR PROTECTS",focus:"WHAT BELONGS IN CLEAR",permission:"THE BOUNDARY TO REMEMBER",questionText:"Your credit, safety, legal responsibilities, relationships, and emotional room to leave.",focusText:"Only unfinished matters that could create harm, follow you, or deserve a finite act of care.",permissionText:"Resolved does not always mean fixed. A plan, boundary, acknowledgment, or release may be enough."},
    Build:{question:"WHAT BUILD PROTECTS",focus:"WHAT BELONGS IN BUILD",permission:"THE SEQUENCE TO REMEMBER",questionText:"A financially trustworthy move, housing approval, work continuity, and a softer first month.",focusText:"Evidence, estimates, options, documents, and preparations that make the move more possible.",permissionText:"Prepare parallel tracks now. Commit money and logistics only when the address and evidence are real."},
    Become:{question:"WHAT BECOME PROTECTS",focus:"WHAT BELONGS IN BECOME",permission:"THE TRUTH TO REMEMBER",questionText:"The creativity, privacy, belonging, relationships, wonder, and ordinary life that make the move worthwhile.",focusText:"Values, reflections, people, rituals, community doors, and the first-month flowering period.",permissionText:"This is guidance and nourishment—not another category in which you must perform perfectly."},
    Vault:{question:"",focus:"",permission:"",questionText:"",focusText:"",permissionText:""},
  }[area];
  const add=(section:string)=>edit({id:crypto.randomUUID(),title:"",description:"",area,section,status:"Not started",priority:"Relief",timing:"Now",createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10)});
  return <div className={`page area-page area-${area.toLowerCase()}`}>
    <p className="eyebrow">{area==="Build"?"THE PRACTICAL FOUNDATION":area==="Clear"?"CURRENT CHAPTER":"THE LIFE AHEAD"}</p><h1>{intro[0]}</h1><p className="lede">{intro[1]}</p>
    {area!=="Vault"&&<AreaDashboard area={area} data={data}/>}
    <section className={`chapter-compass ${area.toLowerCase()}`}><div><small>{compass.question}</small><p>{compass.questionText}</p></div><div><small>{compass.focus}</small><p>{compass.focusText}</p></div><div><small>{compass.permission}</small><p>{compass.permissionText}</p></div></section>
    {area==="Clear" && <blockquote className="grounding">I want to leave with love and responsibility, but I do not need to solve every problem before I am allowed to move forward.</blockquote>}
    {area==="Build" && <DependencyChain/>}
    {area==="Become" && <Fuel data={data} update={update}/>}
    {areaSections[area].filter(section=>!(area==="Become"&&section==="My Fuel Source")).map((section,index)=>{
      if(area==="Build"&&section==="Timeline") return <div id={sectionId(section)} className="section-anchor" key={section}><Timeline data={data} update={update}/></div>;
      if(area==="Build"&&section==="Move Money") return <div id={sectionId(section)} className="section-anchor" key={section}><Money data={data} update={update}/></div>;
      if(area==="Build"&&section==="Post-Move Income") return <div id={sectionId(section)} className="section-anchor" key={section}><Routes data={data} update={update}/></div>;
      if(area==="Become"&&section==="Flowering Period: First 30 Days") return <div id={sectionId(section)} className="section-anchor" key={section}><Flowering data={data} update={update}/></div>;
      const items=data.items.filter(i=>i.area===area&&i.section===section&&!i.parentId);
      const locked=false;
      const reason=sectionReasoning[section];
      return <details id={sectionId(section)} className={`section-card section-anchor ${locked?"locked":""}`} key={section} open={index<2&&!locked}>
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
  const changeBucket=(id:string,changes:Partial<MoveData["money"][number]>)=>update({...data,money:data.money.map(bucket=>bucket.id===id?{...bucket,...changes}:bucket)});
  const addBucket=()=>update({...data,money:[...data.money,{id:crypto.randomUUID(),label:"New move category",current:0,target:0,included:"Describe what this category protects or pays for.",status:"Need to think",source:"Move OS custom category",uncertain:"Target not decided"}]});
  return <section className="feature-card money">
    <div className="money-head"><div><span>MOVE SAVE FUND · {fund.status.toUpperCase()}</span><h2>${fund.current.toLocaleString()} <small>confirmed</small></h2></div><div><small>LEASE & MOVE-IN WORKING HOPE</small><strong>${fund.workingTarget.toLocaleString()}</strong><em>${gap.toLocaleString()} between today and that estimate</em></div></div>
    <div className="calm-progress"><i style={{width:`${Math.min(100,fund.current/fund.workingTarget*100)}%`}}/></div>
    <div className="fund-context"><span>Source of truth: {fund.source}</span><span>The full move target is intentionally not decided yet.</span></div>
    <p className="money-note">The workbook remains the financial source of truth. These cards organize what the fund may need to cover; they do not duplicate its transactions or decide that every category must be fully funded before you can move.</p>
    <div className="money-grid editable-money-grid">{data.money.map(bucket=><article key={bucket.id} className="money-bucket"><div className="bucket-title"><input className="bucket-name" aria-label="Category name" value={bucket.label} onChange={e=>changeBucket(bucket.id,{label:e.target.value})}/><b className={`knowledge ${bucket.status.toLowerCase().replaceAll(" ","-")}`}>{bucket.status}</b></div><div className="bucket-amounts"><label><span>Allocated</span><div>$ <input aria-label={`${bucket.label} allocated`} type="number" value={bucket.current} onChange={e=>changeBucket(bucket.id,{current:+e.target.value})}/></div></label><label><span>Working target</span><div>$ <input aria-label={`${bucket.label} target`} type="number" value={bucket.target} onChange={e=>changeBucket(bucket.id,{target:+e.target.value})}/></div></label></div><label className="bucket-includes"><span>What this covers</span><textarea value={bucket.included} onChange={e=>changeBucket(bucket.id,{included:e.target.value})}/></label><div className="bucket-foot"><i>{bucket.source}</i><button type="button" onClick={()=>{if(window.confirm(`Remove “${bucket.label}”?`))update({...data,money:data.money.filter(m=>m.id!==bucket.id)})}}>Remove</button></div>{bucket.uncertain&&<em>{bucket.uncertain}</em>}</article>)}</div>
    <button className="add-money-category" type="button" onClick={addBucket}>＋ Add a move-fund category</button>
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

function ItemModal({item,all,onOpen,onClose,onSave,onDelete}:{item:MoveItem;all:MoveItem[];onOpen:(i:MoveItem)=>void;onClose:()=>void;onSave:(i:MoveItem)=>void;onDelete:()=>void}) {
  const [draft,setDraft]=useState(item);
  const areaMeta={Clear:{symbol:"↗",verb:"RELEASE",copy:"This piece helps make the current chapter finite."},Build:{symbol:"◇",verb:"CREATE",copy:"This piece strengthens the practical landing path."},Become:{symbol:"✦",verb:"BECOME",copy:"This piece protects the life at the center of the move."},Vault:{symbol:"□",verb:"REMEMBER",copy:"This piece keeps useful context close."}}[draft.area];
  const parent=all.find(i=>i.id===draft.parentId);
  const dependency=all.find(i=>i.id===draft.dependency);
  const children=all.filter(i=>i.parentId===draft.id);
  const unlocked=all.filter(i=>i.dependency===draft.id||draft.unlocks?.includes(i.id));
  return <div className="modal-backdrop cosmic-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <form className={`modal cosmic-editor editor-${draft.area.toLowerCase()}`} onSubmit={e=>{e.preventDefault();onSave({...draft,updatedAt:new Date().toISOString().slice(0,10)})}}>
      <aside className="editor-context">
        <div className="editor-planet"><span>{areaMeta.symbol}</span><i/><i/></div>
        <small>{areaMeta.verb} ORBIT</small><h2>{draft.area}</h2><p>{areaMeta.copy}</p>
        <div className="piece-location"><span><small>AREA</small><b>{draft.area}</b></span><i>→</i><span><small>SECTION</small><b>{draft.section}</b></span><i>→</i><span><small>PHASE</small><b>{draft.stage||"Foundation"}</b></span></div>
        <div className="connection-summary"><small>HOW THIS PIECE CONNECTS</small>
          {parent&&<button type="button" className="connection-link" onClick={()=>onOpen(parent)}><span>Part of</span><b>{parent.title}</b><i>→</i></button>}
          {dependency&&<button type="button" className="connection-link" onClick={()=>onOpen(dependency)}><span>Waits for</span><b>{dependency.title}</b><i>→</i></button>}
          {children.length>0&&<div className="smaller-pieces"><span>Contains {children.length} smaller {children.length===1?"piece":"pieces"}</span>{children.map(child=><button type="button" key={child.id} onClick={()=>onOpen(child)}><i>{isDone(child)?"✓":"○"}</i><b>{child.title}</b><em>{child.status}</em><strong>→</strong></button>)}</div>}
          {unlocked.length>0&&<div className="unlocked-pieces"><span>Unlocks</span>{unlocked.map(next=><button type="button" key={next.id} onClick={()=>onOpen(next)}><b>{next.title}</b><i>→</i></button>)}</div>}
          {!parent&&!dependency&&!children.length&&!unlocked.length&&<div><span>Moves as</span><b>{draft.relationship||"Parallel"}</b></div>}
        </div>
        <p className="editor-why"><small>WHY IT MATTERS</small>{itemReason(draft,all)}</p>
      </aside>
      <section className="editor-form">
        <div className="modal-head"><div><span>{item.title?"EDITING A LIVING PIECE":"ADDING A NEW PIECE"}</span><h2>{item.title?draft.title||"Untitled piece":"Add something"}</h2></div><button type="button" onClick={onClose}>×</button></div>
        <label className="title-field"><span>Name this piece</span><input autoFocus required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
        <label><span>What does it mean?</span><textarea value={draft.description} placeholder="Describe the outcome, not just the activity…" onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
        <div className="editor-status-row"><label><span>Status</span><select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label><span>Timing</span><select value={draft.timing} onChange={e=>setDraft({...draft,timing:e.target.value as Timing})}>{timings.map(t=><option key={t}>{t}</option>)}</select></label></div>
        <details className="editor-details" open><summary>Placement in the system <span>⌄</span></summary><div className="form-grid"><label><span>Move phase</span><select value={draft.stage||"Foundation"} onChange={e=>setDraft({...draft,stage:e.target.value as MoveStage})}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><label><span>Life stream</span><select value={draft.stream||"Clear"} onChange={e=>setDraft({...draft,stream:e.target.value as MoveStream})}>{streams.map(s=><option key={s}>{s}</option>)}</select></label></div><div className="form-grid"><label><span>How it moves</span><select value={draft.relationship||"Parallel"} onChange={e=>setDraft({...draft,relationship:e.target.value as RelationshipType})}>{relationships.map(s=><option key={s}>{s}</option>)}</select></label><label><span>What we know</span><select value={draft.knowledgeStatus||"Need to think"} onChange={e=>setDraft({...draft,knowledgeStatus:e.target.value as KnowledgeStatus})}>{knowledgeStatuses.map(s=><option key={s}>{s}</option>)}</select></label></div></details>
        <details className="editor-details"><summary>Connections to other pieces <span>⌄</span></summary><label><span>Part of a larger project</span><select value={draft.parentId||""} onChange={e=>setDraft({...draft,parentId:e.target.value||undefined})}><option value="">This is a main piece</option>{all.filter(i=>i.id!==draft.id&&!i.parentId).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label><span>True dependency</span><select value={draft.dependency||""} onChange={e=>setDraft({...draft,dependency:e.target.value||undefined})}><option value="">Nothing — this can move now</option>{all.filter(i=>i.id!==draft.id).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label>{blocker(draft,all)&&<p className="blocker">This orbit is waiting: {blocker(draft,all)}.</p>}</details>
        <label><span>Notes to future me</span><textarea value={draft.notes||""} placeholder="Context, permission, reminders, or what good enough means…" onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
        <div className="modal-actions">{item.title&&<button type="button" className="delete" onClick={onDelete}>Remove piece</button>}<span/><Button onClick={onClose}>Close</Button><Button type="submit" kind="primary">Save this piece</Button></div>
      </section>
    </form>
  </div>;
}
