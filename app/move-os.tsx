"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ApartmentListing, ApartmentStatus, Area, HousingType, KnowledgeStatus, MoveData, MoveItem, MoveStage, MoveStream, RelationshipType, Status, Timing, VaultEntry } from "./types";
import { moveRepository } from "./repository";
import { blocker, isAction, isDone, recommendations } from "./priorities";

type Page = "Overview" | "Hub" | "Calendar" | "Connections" | "Apartments" | "Clear" | "Build" | "Become" | "Vault" | "Settings";
const toolPages: {name:Page; icon:string}[] = [
  {name:"Overview",icon:"☼"},{name:"Hub",icon:"◎"},{name:"Calendar",icon:"□"},{name:"Connections",icon:"✧"},{name:"Apartments",icon:"⌂"},
];
const sectionCopy: Record<string,string> = {
  "Money, Credit and Old Obligations":"Prevent new damage and make the old things finite.",
  "Car, Documents and Responsibilities":"Safety, reliability, records, and loose ends.",
  "Family: What I Can Help With":"Offer love with a clear edge around your role.",
  "Closure Before I Leave":"Honor what mattered without forcing an ending.",
  "Allowed to Wait":"Important is not the same as move-blocking.",
  "Post-Move Income":"Replace the lost Element income with housing-usable evidence.",
  "Rental Readiness":"Build the packet and verify the rules each property actually uses.",
  "Preferences in Search":"Discover what Chicago-first housing needs to support.",
  "Getting a Place":"Compare the true terms, then commit when income and credit are credible.",
  "Pre-Move":"Protect health, Marvel, travel, and the first days of the new home.",
  "Post Arrival":"Address-dependent administration waits for a real home.",
  "Physical Move — Pre":"Prepare the trailer route and early packing in the right order.",
  "Physical Move":"Keep proof attached to the actions that generate it.",
};
const sectionReasoning: Record<string,{why:string;unlocks:string;permission:string}> = {
  "Money, Credit and Old Obligations":{why:"Stops avoidable fees, legal trouble, or credit surprises from following you.",unlocks:"A cleaner rental application and a more honest move budget.",permission:"You only need to address what can cause harm or affect the move."},
  "Car, Documents and Responsibilities":{why:"Safety and usable records protect the actual journey and your first weeks.",unlocks:"Reliable travel, applications, care continuity, and fewer arrival emergencies.",permission:"Cosmetic work and nonessential upgrades can wait."},
  "Family: What I Can Help With":{why:"A defined role lets you offer real help without making the move depend on fixing another life.",unlocks:"A compassionate ending with a clear point where your part is complete.",permission:"Planning or connecting someone to support can be enough."},
  "Closure Before I Leave":{why:"Intentional time and acknowledgment can reduce the feeling that you vanished from your own chapter.",unlocks:"More emotional room for arrival and new attachment.",permission:"Closure does not require another person’s participation."},
  "Allowed to Wait":{why:"Naming non-blockers protects attention for the work that actually changes readiness.",unlocks:"A calmer plan with fewer false emergencies.",permission:"Waiting is a decision, not neglect."},
  "Post-Move Income":{why:"The layoff removed Element income from the housing plan; a new offer letter or paystubs are now a primary approval pillar.",unlocks:"A trustworthy rent range and housing applications.",permission:"Remote and Chicago-hybrid routes can move in parallel; Denver can stay a lighter backup."},
  "Rental Readiness":{why:"A 625+ credit path and verifiable income are the clearest known requirements for applying alone.",unlocks:"Confident comparison of standard leases, sublets, and actual approval rules.",permission:"You do not have to assume every property uses the same requirement."},
  "Preferences in Search":{why:"A home is more than rent; its location, space, light, dog access, community, and commute shape daily life.",unlocks:"A shorter, more honest property list in the Apartment Matrix.",permission:"Chicago can receive more attention without deleting Denver as a backup."},
  "Getting a Place":{why:"The signed lease is the hinge that creates an address and turns estimates into real logistics.",unlocks:"Utilities, the trailer reservation, accurate costs, and Move Day coordination.",permission:"Sublets and move-in specials are valid strategies, not lesser versions of the plan."},
  "Pre-Move":{why:"Continuity work protects medication, Marvel, travel, and the first days of the new home.",unlocks:"A calmer departure and fewer urgent problems after arrival.",permission:"Prepare the essentials; optimize the new life later."},
  "Post Arrival":{why:"These updates need a confirmed address to be accurate.",unlocks:"A functioning home and clean administrative transition.",permission:"There is nothing useful to finalize here before a lease."},
  "Physical Move — Pre":{why:"Early packing can move now, while the actual trailer decision needs the lease and route.",unlocks:"A realistic physical crossing without premature bookings.",permission:"You do not need to pack the whole house to begin."},
  "Physical Move":{why:"Logistics become accurate only after the address and move-in terms are real.",unlocks:"A coordinated Move Day and a functional first night.",permission:"Research is fine now. Booking and detailed execution can stay quiet."},
  "The Life I Want":{why:"Practical choices become easier when you know how ordinary life should feel.",unlocks:"A useful filter for housing, work, spending, and time.",permission:"This is a direction, not a contract."},
  "People and Relationships":{why:"Moving changes access and rhythm; intention helps important relationships survive the transition.",unlocks:"Clearer boundaries, appreciation, and ways to stay connected.",permission:"Not every relationship needs the same future shape."},
  "Spiritual Preparation":{why:"Meaning-making can hold uncertainty that a checklist cannot resolve.",unlocks:"A personal sense of continuity and trust.",permission:"Nothing here is required or scored."},
  "Community and Belonging":{why:"Belonging usually grows through repetition, not one dramatic introduction.",unlocks:"A few low-pressure doors to knock on after arrival.",permission:"You do not have to build a whole community immediately."},
};
const areaSections: Record<Area,string[]> = {
  Clear:["Money, Credit and Old Obligations","Car, Documents and Responsibilities","Family: What I Can Help With","Closure Before I Leave","Allowed to Wait"],
  Build:["Timeline","Move Money","Post-Move Income","Rental Readiness","Preferences in Search","Getting a Place","Pre-Move","Post Arrival","Physical Move — Pre","Physical Move"],
  Become:["My Fuel Source","The Life I Want","People and Relationships","Spiritual Preparation","Community and Belonging","Flowering Period: First 30 Days"],
  Vault:[],
};
const statuses:Status[] = ["Not started","In motion","Waiting","Blocked","Completed","Deferred"];
const timings:Timing[] = ["Now","Prepare early","After the lease","First 72 hours","After arrival","Allowed to wait"];
const stages:MoveStage[]=["Foundation","Prepare","Decide","Commit","Move","Land"];
const streams:MoveStream[]=["Income","Housing","Money","Clear","Health & dog","Become"];
const relationships:RelationshipType[]=["Hard dependency","Helpful sequence","Parallel","Decision gate","Deferred decision","Waiting on event","Informational"];
const knowledgeStatuses:KnowledgeStatus[]=["Known","Estimate","Need to think","Need information","Waiting on event","Decided","Not applicable"];
const areaLabels={Clear:"Current Responsibilities",Build:"Move Foundation",Become:"Life After the Move"} as const;

function Logo() { return <div className="logo"><strong>Randy’s Move Plan</strong><small>CHICAGO FIRST · 2026</small></div>; }
function Button({children, onClick, kind="secondary", type="button"}:{children:React.ReactNode;onClick?:()=>void;kind?:string;type?:"button"|"submit"}) {
  return <button type={type} className={`button ${kind}`} onClick={onClick}>{children}</button>;
}

export function MoveOS() {
  const [data,setData] = useState<MoveData|null>(null);
  const [page,setPage] = useState<Page>("Overview");
  const [dark,setDark] = useState(false);
  const [overwhelmed,setOverwhelmed] = useState(false);
  const [editing,setEditing] = useState<MoveItem|null>(null);
  const [searchOpen,setSearchOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ moveRepository.load().then(setData); },[]);
  useEffect(()=>{ if(data) moveRepository.save(data); },[data]);
  useEffect(()=>{ document.documentElement.dataset.theme = dark ? "dark" : "light"; },[dark]);
  useEffect(()=>{ window.scrollTo({top:0,behavior:"instant" as ScrollBehavior}); },[page]);
  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setSearchOpen(true)}if(event.key==="Escape")setSearchOpen(false)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
  if(!data) return <div className="loading">Gathering your move plan…</div>;
  const update=(next:MoveData)=>setData(next);
  const progress=(area:Exclude<Area,"Vault">)=>{const items=data.items.filter(item=>item.area===area&&isAction(item)&&!item.optional&&item.timing!=="Allowed to wait");return items.length?Math.round(items.filter(isDone).length/items.length*100):0};
  return <div className="app-shell">
    <header className="site-header">
      <div className="header-primary"><Logo/><nav aria-label="Primary" className="top-tabs">
        <button className={page==="Overview"?"active":""} onClick={()=>{setPage("Overview");setOverwhelmed(false)}}>Overview</button>
        <button className={page==="Hub"?"active":""} onClick={()=>setPage("Hub")}>Progress Hub</button>
        <button className={`tab-clear ${page==="Clear"?"active":""}`} onClick={()=>setPage("Clear")}>{areaLabels.Clear}</button>
        <div className="build-tab-group"><button className={`tab-build ${["Build","Apartments"].includes(page)?"active":""}`} onClick={()=>setPage("Build")}>{areaLabels.Build}</button><div className="build-submenu"><button onClick={()=>setPage("Build")}>Move tasks</button><button onClick={()=>setPage("Apartments")}>Apartment Matrix</button></div></div>
        <button className={`tab-become ${page==="Become"?"active":""}`} onClick={()=>setPage("Become")}>{areaLabels.Become}</button>
        <button className={page==="Calendar"?"active":""} onClick={()=>setPage("Calendar")}>Calendar</button>
        <button className={page==="Connections"?"active":""} onClick={()=>setPage("Connections")}>Dependencies</button>
      </nav><div className="header-actions"><button onClick={()=>setSearchOpen(true)} aria-label="Search the plan">⌕</button><button onClick={()=>setPage("Vault")}>Vault</button><button onClick={()=>setPage("Settings")}>Settings</button><button onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?"☀︎":"☾"}</button></div></div>
      <div className="header-progress"><span>REQUIRED TASKS</span>{(["Clear","Build","Become"] as const).map(area=><button key={area} onClick={()=>setPage(area)} className={`progress-${area.toLowerCase()}`}><b>{areaLabels[area]}</b><i><em style={{width:`${progress(area)}%`}}/></i><strong>{progress(area)}%</strong></button>)}<label><input type="checkbox" checked={data.hideCompleted} onChange={event=>update({...data,hideCompleted:event.target.checked})}/> Hide completed</label></div>
    </header>
    <main>
      {page==="Overview" && <Today data={data} update={update} overwhelmed={overwhelmed} setOverwhelmed={setOverwhelmed} edit={setEditing} goTo={setPage}/>}
      {page==="Hub" && <ProgressHub data={data} edit={setEditing} goTo={setPage}/>}
      {page==="Calendar" && <CalendarPage data={data} update={update} edit={setEditing}/>}
      {page==="Connections" && <ConnectionsPage data={data} edit={setEditing} goTo={setPage}/>}
      {page==="Apartments" && <ApartmentMatrix data={data} update={update}/>}
      {(page==="Clear"||page==="Build"||page==="Become") && <AreaPage area={page} data={data} update={update} edit={setEditing} goTo={setPage}/>}
      {page==="Vault" && <Vault data={data} update={update}/>}
      {page==="Settings" && <Settings data={data} update={update} dark={dark} setDark={setDark} fileRef={fileRef}/>}
    </main>
    {searchOpen&&<PlanSearch data={data} onClose={()=>setSearchOpen(false)} onOpen={item=>{setEditing(item);setSearchOpen(false)}} goTo={next=>{setPage(next);setSearchOpen(false)}}/>}
    {editing && <ItemModal item={editing} all={data.items} onOpen={setEditing} onClose={()=>setEditing(null)} onSave={saved=>{update({...data,items:data.items.some(i=>i.id===saved.id)?data.items.map(i=>i.id===saved.id?saved:i):[...data.items,saved]});setEditing(null)}} onDelete={()=>{update({...data,items:data.items.filter(i=>i.id!==editing.id)});setEditing(null)}}/>}
  </div>;
}

function PlanSearch({data,onClose,onOpen,goTo}:{data:MoveData;onClose:()=>void;onOpen:(item:MoveItem)=>void;goTo:(page:Page)=>void}){
  const [query,setQuery]=useState("");
  const normalized=query.trim().toLowerCase();
  const visible=data.items.filter(item=>!data.hideCompleted||!isDone(item));
  const results=normalized?visible.filter(item=>[item.title,item.description,item.section,item.notes,item.status,item.knowledgeStatus].some(value=>value?.toLowerCase().includes(normalized))).slice(0,12):visible.filter(item=>isAction(item)&&!isDone(item)&&!item.optional&&item.timing!=="Allowed to wait").slice(0,8);
  return <div className="search-backdrop" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><section className="plan-search" role="dialog" aria-modal="true" aria-label="Find anything in Randy's move plan"><header><span>⌕</span><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search tasks, sections, notes, or statuses…"/><button onClick={onClose} aria-label="Close search">×</button></header><div className="search-area-shortcuts">{(["Clear","Build","Become"] as const).map((area,index)=><button key={area} onClick={()=>goTo(area)}><span>0{index+1}</span>{areaLabels[area]}</button>)}</div><div className="search-results"><small>{normalized?`${results.length} MATCH${results.length===1?"":"ES"}`:"OPEN REQUIRED ACTIONS"}</small>{results.length?results.map(item=><button key={item.id} onClick={()=>onOpen(item)}><span className={`search-area search-${item.area.toLowerCase()}`}>{item.kind==="Reference"?"FYI":item.kind==="Reflection"?"NOTE":item.area.slice(0,1)}</span><div><b>{item.title}</b><small>{item.kind==="Reference"?"Decision guidance · not scored":item.kind==="Reflection"?"Discovery / inner work · not scored":`${item.section} · ${item.optional?"Optional":item.status}`}</small></div><i>→</i></button>):<p>No pieces match that search.</p>}</div><footer><span><kbd>ESC</kbd> close</span><p>One place to remember everything.</p></footer></section></div>
}

function Today({data,update,overwhelmed,setOverwhelmed,edit,goTo}:{data:MoveData;update:(d:MoveData)=>void;overwhelmed:boolean;setOverwhelmed:(v:boolean)=>void;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const [now] = useState(() => Date.now());
  const mantras=["I do not need perfect certainty to keep moving.","Every fact I learn gives the future more shape.","My preparation serves my freedom—not my fear.","I can love where I am and still choose what comes next.","The life I want is allowed to influence the plan.","Small settled pieces become a real crossing.","Ready enough is a doorway, not a finish line."];
  const suggested=useMemo(()=>recommendations(data.items),[data.items]);
  const waiting=data.items.filter(i=>isAction(i)&&blocker(i,data.items)).slice(0,3);
  const settled=data.hideCompleted?[]:data.items.filter(i=>isAction(i)&&isDone(i)).slice(-3).reverse();
  const days=Math.max(0,Math.ceil((new Date(data.profile.targetMoveDate).getTime()-now)/86400000));
  const todayDate=new Date(now);
  const mantra=mantras[Math.floor(now/86400000)%mantras.length];
  const active=data.items.filter(i=>i.timing!=="Allowed to wait"&&!i.optional&&isAction(i));
  const complete=active.filter(isDone).length;
  const completion=active.length?Math.round(complete/active.length*100):0;
  const areaProgress=(["Clear","Build","Become"] as const).map(area=>{const items=active.filter(i=>i.area===area);const done=items.filter(isDone).length;return {area,done,total:items.length,percent:items.length?Math.round(done/items.length*100):0}});
  if(overwhelmed) {
    const small=suggested.find(i=>isAction(i)&&i.priority==="Relief") || suggested.find(isAction);
    const ignore=data.items.find(i=>isAction(i)&&(i.optional||i.timing==="Allowed to wait"));
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
    <section className="overview-intro"><div><p className="eyebrow">RANDY’S CHICAGO-FIRST PLAN</p><h1>The next useful step.<br/><span>Not the whole move.</span></h1><p className="overview-reason">{data.profile.reason}</p></div><aside><small>{todayDate.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</small><p>“{mantra}”</p><div><strong>{days}</strong><span>days to<br/>{new Date(data.profile.targetMoveDate+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span></div></aside></section>
    <section className="reality-brief"><div><small>WHAT CHANGED</small><h2>The plan has a new center of gravity.</h2><p>Element income is no longer part of the move. Chicago is now the stronger destination, with Denver held as a lighter backup.</p></div><div><span><b>1</b> Secure a remote or Chicago-hybrid role</span><span><b>2</b> Build toward a 625+ credit score</span><span><b>3</b> Compare leases, sublets, and specials using verified terms</span></div></section>
    <section className="unlock"><div className="unlock-mark">↗</div><div><span>CURRENT UNLOCK</span><h2>{data.profile.currentUnlock}</h2><p>Income and credit are parallel approval pillars. Neighborhood learning and the apartment matrix can move beside them.</p></div><Button kind="ink" onClick={()=>edit(data.items.find(i=>i.id==="income-evidence")!)}>Continue <b>→</b></Button></section>
    <section className="overview-dashboard"><div className={`overview-score progress-${completion<35?"low":completion<75?"medium":"high"}`}><span>{completion}%</span><div><small>REQUIRED PLAN COMPLETE</small><b>{complete} of {active.length} actions</b></div></div><div className="overview-progress-bars">{areaProgress.map(stat=><button key={stat.area} onClick={()=>goTo(stat.area)}><div><b>{areaLabels[stat.area]}</b><span>{stat.done}/{stat.total}</span></div><i><em style={{width:`${stat.percent}%`}}/></i></button>)}</div><button className="overview-hub-link" onClick={()=>goTo("Hub")}><b>Open the Progress Hub</b><span>Milestones, completion, and timeline →</span></button></section>
    <div className="section-heading"><div><p className="eyebrow">A SMALL WORKING SET</p><h2>What matters now</h2></div><p>Up to three real actions—never a PSA disguised as work.</p></div>
    <div className="suggestions">{suggested.map((item,index)=><ActionCard key={item.id} item={item} number={index+1} edit={edit} data={data} update={update}/>)}</div>
    <details className="overview-areas"><summary><div><span>03</span><div><small>PLAN AREAS</small><b>See all three parts of the move</b></div></div><i>⌄</i></summary><div>{(["Clear","Build","Become"] as const).map((area,index)=><button key={area} onClick={()=>goTo(area)}><span>0{index+1}</span><div><b>{areaLabels[area]}</b><small>{["Credit, responsibilities, documents, family support, and closure.","Income, money, rental readiness, housing, health, and logistics.","Home, creativity, relationships, community, and the first month."][index]}</small></div><i>→</i></button>)}</div></details>
    <div className="lower-grid">
      <section className="quiet-list"><div className="list-title"><h3>Waiting on another step</h3><span>{waiting.length}</span></div>{waiting.map(i=><button onClick={()=>edit(i)} key={i.id}><b>{i.title}</b><small>{blocker(i,data.items)}</small></button>)}</section>
      <section className="quiet-list settled"><div className="list-title"><h3>Recently completed</h3><span>✓</span></div>{settled.length?settled.map(i=><button onClick={()=>edit(i)} key={i.id}><b>{i.title}</b><small>Completed · quietly done</small></button>):<p className="hidden-complete-note">Completed work is hidden. You can show it again from the left rail.</p>}</section>
    </div>
    <button className="overwhelm" onClick={()=>setOverwhelmed(true)}><span>○</span><div><b>I feel overwhelmed</b><small>Show me just one kind next step.</small></div><i>→</i></button>
    <p className="principle">One place to remember everything. <b>A few things to work on.</b> One life I am moving toward.</p>
  </div>;
}

function ActionCard({item,number,edit,data,update}:{item:MoveItem;number:number;edit:(i:MoveItem)=>void;data:MoveData;update:(d:MoveData)=>void}) {
  const colors={Clear:"coral",Build:"sage",Become:"lavender",Vault:"sand"};
  return <article className={`action-card ${colors[item.area]}`}><div className="card-top"><span>{areaLabels[item.area as keyof typeof areaLabels]||item.area}</span><i>0{number}</i></div><h3>{item.title}</h3><p>{item.description}</p><div className="why-now"><small>WHY THIS NOW</small><span>{itemReason(item,data.items)}</span></div><div className="card-bottom"><button onClick={()=>update({...data,items:data.items.map(i=>i.id===item.id?{...i,status:"Completed",updatedAt:new Date().toISOString().slice(0,10)}:i)})} aria-label={`Complete ${item.title}`}>○</button><button onClick={()=>edit(item)}>Open <b>→</b></button></div></article>;
}

function ProgressHub({data,edit,goTo}:{data:MoveData;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const [view,setView]=useState<"progress"|"timeline">("progress");
  const actionable=data.items.filter(i=>i.timing!=="Allowed to wait"&&!i.optional&&isAction(i));
  const settled=actionable.filter(isDone).length;
  const percent=actionable.length?Math.round(settled/actionable.length*100):0;
  const areaData=(["Clear","Build","Become"] as const).map(area=>{
    const items=actionable.filter(i=>i.area===area);
    const done=items.filter(isDone).length;
    return {area,items,done,percent:items.length?Math.round(done/items.length*100):0};
  });
  const timeline=[
    {label:"Now · Foundation",note:"Facts, relief, and preparation that do not need a final job or address.",items:data.items.filter(i=>i.timing==="Now"&&!isDone(i)).slice(0,6)},
    {label:"Now · Build approval strength",note:"Pursue income evidence, begin the 625+ credit plan, and learn Chicago first.",items:data.items.filter(i=>["income-evidence","remote-search","chicago-hybrid","credit-plan","application-packet"].includes(i.id)).slice(0,6)},
    {label:"October 15–31 · Move window",note:"Commit only with enough evidence. October 24 remains the temporary planning date.",items:data.items.filter(i=>i.stage==="Commit"||i.id==="holiday-plan").slice(0,6)},
    {label:"After the lease",note:"A confirmed address unlocks accurate bookings and administrative setup.",items:data.items.filter(i=>i.timing==="After the lease").slice(0,6)},
    {label:"Arrival · Protect the landing",note:"Functional home, steady routines, one repeated connection, and room to feel the new life.",items:data.items.filter(i=>isAction(i)&&(i.timing==="After arrival"||i.stage==="Land")).slice(0,6)},
  ];
  return <div className="page hub-page">
    <div className="hub-heading"><div><p className="eyebrow">YOUR CENTRAL VIEW</p><h1>See the move taking shape.</h1><p className="lede">Progress without pretending every task is equal—or that every unknown is a problem.</p></div><div className="view-switch" role="group" aria-label="Hub view"><button className={view==="progress"?"active":""} onClick={()=>setView("progress")}>Progress</button><button className={view==="timeline"?"active":""} onClick={()=>setView("timeline")}>Timeline</button></div></div>
    {view==="progress"?<>
      <section className="overall-progress">
        <div className="progress-ring" style={{"--progress":`${percent*3.6}deg`} as React.CSSProperties}><span><strong>{percent}%</strong><small>complete</small></span></div>
        <div><small>THE WHOLE ACTIVE PLAN</small><h2>{settled} of {actionable.length} required tasks are completed</h2><p>FYIs and reflections are excluded. “Allowed to Wait” and optional tasks are visible in their sections without lowering progress.</p></div>
        <div className="progress-key"><span><i className="done"/>Completed <b>{settled}</b></span><span><i className="motion"/>In motion <b>{actionable.filter(i=>i.status==="In motion").length}</b></span><span><i className="open"/>Open <b>{actionable.filter(i=>!isDone(i)&&i.status!=="In motion").length}</b></span></div>
      </section>
      <div className="area-progress-grid">{areaData.map(({area,items,done,percent:areaPercent})=><article className={`area-progress ${area.toLowerCase()} progress-${areaPercent<35?"low":areaPercent<75?"medium":"high"}`} key={area}>
        <div className="area-progress-top"><span>{areaLabels[area]}</span><strong>{areaPercent}%</strong></div><div className="area-bar"><i style={{width:`${areaPercent}%`}}/></div>
        <h2>{done} completed <small>of {items.length}</small></h2>
        <p>{area==="Clear"?"Finish this chapter without turning love or responsibility into an endless gate.":area==="Build"?"Create trustworthy options for money, housing, income, health, and the move itself.":"Keep the desired home, relationships, creativity, and belonging inside the plan."}</p>
        <button onClick={()=>goTo(area)}>Open {areaLabels[area]} →</button>
      </article>)}</div>
      <section className="milestone-lane"><div className="hub-section-title"><div><p className="eyebrow">THE MAIN STORY</p><h2>Five milestones—not fifty disconnected tasks</h2></div><p>Each milestone gathers the smaller work beneath it.</p></div><div className="milestones">{[
        ["1","Credit to 625+","Build a concrete score plan for applying alone.","credit-plan"],
        ["2","Income evidence","Secure a remote or Chicago-hybrid role and usable verification.","income-evidence"],
        ["3","Rental packet","Prepare documents and compare standard leases with sublets.","application-packet"],
        ["4","A real home","Use the matrix to compare true cost, restrictions, specials, and fit.","lease"],
        ["5","Move and land","Unlock logistics with the lease, then protect the first month.","move-plan"],
      ].map(([number,title,copy,id],index)=>{const milestone=data.items.find(i=>i.id===id);const children=data.items.filter(i=>i.parentId===id);const done=isDone(milestone!)||children.length>0&&children.every(isDone);return <button className={`milestone-${index+1} ${done?"is-complete":""}`} key={id} onClick={()=>milestone&&edit(milestone)}><span className={done?"complete":""}>{done?"✓":number}</span><div><small>MILESTONE 0{index+1}</small><b>{title}</b><em>{copy}</em></div><i>→</i></button>})}</div></section>
    </>:<section className="journey-timeline">
      <div className="timeline-intro"><div><p className="eyebrow">A CALM SEQUENCE</p><h2>The plan across time</h2></div><p>This is an order of attention, not a rule that says you cannot move until life is perfect.</p></div>
      {timeline.map((period,index)=><article key={period.label} className="timeline-period"><div className="timeline-date"><span>0{index+1}</span><div><h3>{period.label}</h3><p>{period.note}</p></div></div><div className="timeline-items">{period.items.length?period.items.map(item=><button key={item.id} onClick={()=>edit(item)}><span className={isDone(item)?"done":""}>{isDone(item)?"✓":"○"}</span><div><b>{item.title}</b><small>{item.relationship==="Hard dependency"?(blocker(item,data.items)||"Ready when its prerequisite is completed"):item.status+" · "+item.knowledgeStatus}</small></div><i>→</i></button>):<p className="empty-period">Nothing needs your attention here yet.</p>}</div></article>)}
    </section>}
  </div>;
}

function CalendarPage({data,update,edit}:{data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void}) {
  const [cursor,setCursor]=useState(()=>{const date=new Date();date.setDate(1);date.setHours(12,0,0,0);return date});
  const year=cursor.getFullYear(), month=cursor.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const count=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:Math.ceil((firstDay+count)/7)*7},(_,index)=>index<firstDay?null:index-firstDay+1>count?null:index-firstDay+1);
  const dated=data.items.filter(item=>isAction(item)&&item.dueDate);
  const undated=data.items.filter(item=>isAction(item)&&!item.dueDate&&!isDone(item)&&item.timing!=="Allowed to wait").slice(0,8);
  const iso=(day:number)=>`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const addForDay=(day:number)=>edit({id:crypto.randomUUID(),title:"",description:"",area:"Build",section:"Post-Move Income",status:"Not started",priority:"Relief",timing:"Now",kind:"Action",dueDate:iso(day),createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10)});
  const today=new Date();
  return <div className="page calendar-page">
    <div className="calendar-heading"><div><p className="eyebrow">DATES, DEADLINES, AND POSSIBILITIES</p><h1>Move calendar</h1><p className="lede">See what is due on actual days. Select a task to edit it, or add a task directly to a date.</p></div><label>PLANNING DATE<input type="date" value={data.profile.targetMoveDate} onChange={e=>update({...data,profile:{...data.profile,targetMoveDate:e.target.value}})}/></label></div>
    <div className="calendar-layout"><section className="month-calendar"><header><button aria-label="Previous month" onClick={()=>setCursor(new Date(year,month-1,1))}>←</button><h2>{cursor.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2><button aria-label="Next month" onClick={()=>setCursor(new Date(year,month+1,1))}>→</button></header><div className="weekday-row">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((day,index)=>day===null?<div className="calendar-day empty" key={`blank-${index}`}/>:<div className={`calendar-day ${today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===day?"today-date":""}`} key={day}><div className="day-head"><b>{day}</b><button aria-label={`Add task on ${cursor.toLocaleDateString("en-US",{month:"long"})} ${day}`} onClick={()=>addForDay(day)}>＋</button></div><div className="day-events">{dated.filter(item=>item.dueDate===iso(day)).map(item=><button className={`${item.area.toLowerCase()} ${isDone(item)?"done":""}`} key={item.id} onClick={()=>edit(item)}>{isDone(item)?"✓ ":""}{item.title}</button>)}{data.profile.targetMoveDate===iso(day)&&<span className="planning-event">Planning date</span>}</div></div>)}</div></section><aside className="calendar-sidebar"><small>OPEN TASKS WITHOUT A DATE</small><h2>Place these when ready</h2><p>An undated task is not automatically missing information. Give it a date only when the date is genuinely useful.</p>{undated.map(item=><button key={item.id} onClick={()=>edit(item)}><span>{areaLabels[item.area as keyof typeof areaLabels]||item.area}</span><b>{item.title}</b><i>→</i></button>)}</aside></div>
  </div>;
}

function ConnectionsPage({data,edit,goTo}:{data:MoveData;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const [selectedStar,setSelectedStar]=useState<string|null>(null);
  const nodes=[
    {area:"Clear" as Page,title:"Raise credit to 625+",copy:"Understand the score, stop new damage, and follow a concrete improvement plan.",item:"credit-plan"},
    {area:"Build" as Page,title:"Secure income evidence",copy:"Pursue remote and Chicago-hybrid work until an offer letter or paystubs can support housing.",item:"income-evidence"},
    {area:"Build" as Page,title:"Complete the rental packet",copy:"Gather identity, income, credit, dog, and reference documents before applying.",item:"application-packet"},
    {area:"Build" as Page,title:"Choose and secure a home",copy:"Compare leases, sublets, specials, true move-in cost, and daily-life fit.",item:"lease"},
    {area:"Build" as Page,title:"Prepare the physical move",copy:"Use the signed home and confirmed date to book, pack, travel, and arrive.",item:"move-plan"},
  ];
  const selectedNode=nodes.find(node=>node.item===selectedStar);
  const selectedTasks=(!selectedStar?[]:selectedStar==="credit-plan"?data.items.filter(i=>i.area==="Clear"&&["Money, Credit and Old Obligations","Allowed to Wait"].includes(i.section)):selectedStar==="application-packet"?data.items.filter(i=>["Rental Readiness","Preferences in Search"].includes(i.section)):selectedStar==="income-evidence"?data.items.filter(i=>i.section==="Post-Move Income"||i.id==="income-proof"):selectedStar==="lease"?data.items.filter(i=>i.section==="Getting a Place"):data.items.filter(i=>["Physical Move — Pre","Physical Move","Post Arrival"].includes(i.section))).filter(isAction);
  const selectedMain=data.items.find(i=>i.id===selectedStar);
  const tasks=selectedTasks.filter(i=>i.id!==selectedStar&&(!data.hideCompleted||!isDone(i))).slice(0,12);
  const nextItems=data.items.filter(i=>i.dependency===selectedStar||selectedMain?.unlocks?.includes(i.id)).slice(0,8);
  return <div className="page connections-page">
    <div className="connections-heading"><div><p className="eyebrow">WHAT LEADS TO WHAT</p><h1>Dependency map</h1><p className="lede">Read the move from left to right. Select a milestone to see its tasks, prerequisites, and what it unlocks.</p></div><button onClick={()=>goTo("Hub")}>Open Progress Hub →</button></div>
    {!selectedNode?<section className="dependency-flow">{nodes.map((node,index)=>{const piece=data.items.find(i=>i.id===node.item);return <div className="flow-step" key={node.item}><button className={`${node.area.toLowerCase()} ${piece&&isDone(piece)?"done":""}`} onClick={()=>setSelectedStar(node.item)}><span>0{index+1}</span><small>{areaLabels[node.area as keyof typeof areaLabels]||node.area}</small><b>{node.title}</b><p>{node.copy}</p><em>{piece?.status||"Open"}</em></button>{index<nodes.length-1&&<i>→</i>}</div>})}</section>:<section className="connection-focus"><header><button onClick={()=>setSelectedStar(null)}>← All milestones</button><div><small>FOCUSED MILESTONE</small><h2>{selectedNode.title}</h2><p>{selectedNode.copy}</p></div></header><div className="connection-focus-grid"><div className="focus-column prerequisite"><small>01 · PREREQUISITES</small>{selectedMain?.dependency&&data.items.find(i=>i.id===selectedMain.dependency)?<button onClick={()=>edit(data.items.find(i=>i.id===selectedMain.dependency)!)}><b>{data.items.find(i=>i.id===selectedMain.dependency)?.title}</b><span>{isDone(data.items.find(i=>i.id===selectedMain.dependency)!)?"Completed":"Needed first"}</span></button>:<p>No single gate. Work here can begin now.</p>}</div><div className="focus-column tasks"><small>02 · ACTIONS IN THIS MILESTONE</small><button className="main-task" onClick={()=>selectedMain&&edit(selectedMain)}><b>{selectedMain?.title||selectedNode.title}</b><span>{selectedMain?.status}</span></button>{tasks.map(task=><button className={isDone(task)?"done":""} key={task.id} onClick={()=>edit(task)}><b>{task.title}</b><span>{task.parentId===selectedStar?"Subtask":task.section} · {task.status}</span></button>)}</div><div className="focus-column unlocks"><small>03 · WHAT THIS UNLOCKS</small>{nextItems.length?nextItems.map(item=><button key={item.id} onClick={()=>edit(item)}><b>{item.title}</b><span>{item.status}</span></button>):<p>Its value is readiness and fewer unknowns; no later task is hard-locked to it.</p>}</div></div></section>}
    <aside className="parallel-note"><b>Also moving in parallel:</b> savings, neighborhood learning, health continuity, family plans, closure, and the life you want. The map shows sequence—not permission to move.</aside>
  </div>;
}

const sectionId=(section:string)=>`section-${section.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}`;
function AreaDashboard({area,data,update}:{area:Exclude<Area,"Vault">;data:MoveData;update:(d:MoveData)=>void}) {
  const sections=areaSections[area].filter(section=>section!=="My Fuel Source");
  const items=data.items.filter(i=>i.area===area&&i.timing!=="Allowed to wait"&&!i.optional&&isAction(i));
  const complete=items.filter(isDone).length;
  const percent=items.length?Math.round(complete/items.length*100):0;
  const meanings={Clear:{label:"WHAT THIS AREA IS FOR",definition:"Responsibilities from the current chapter that could create harm, follow you, or deserve one finite act of care."},Build:{label:"WHAT THIS AREA IS FOR",definition:"Income, credit, money, housing, health, and logistics that make the move credible and workable."},Become:{label:"WHAT THIS AREA IS FOR",definition:"The home, relationships, creativity, community, and ordinary life that the practical plan is meant to protect."}}[area];
  return <section className={`area-dashboard dashboard-${area.toLowerCase()}`}><div className="area-dashboard-summary"><div className="area-definition"><small>{meanings.label}</small><p>{meanings.definition}</p></div><div className={`area-completion progress-${percent<35?"low":percent<75?"medium":"high"}`}><strong>{percent}%</strong><span>{complete} of {items.length} required actions complete</span></div></div><nav className="area-toc" aria-label={`${areaLabels[area]} section overview`}><small>JUMP TO A SECTION · SET A WORKING DATE WHEN USEFUL</small><div className="toc-grid">{sections.map((section,index)=>{const sectionItems=data.items.filter(i=>i.area===area&&i.section===section&&!i.optional&&isAction(i));const optional=data.items.filter(i=>i.area===area&&i.section===section&&i.optional&&isAction(i)).length;const done=sectionItems.filter(isDone).length;return <article className="toc-row" key={section}><button className="toc-jump" onClick={()=>document.getElementById(sectionId(section))?.scrollIntoView({behavior:"smooth",block:"start"})}><span>0{index+1}</span><div><b>{section}</b><small>{sectionItems.length?`${done}/${sectionItems.length} required complete`:"Reference section"}{optional?` · ${optional} optional`:""}</small></div><i>↓</i></button><label className="section-target"><span>Target date</span><input type="date" value={data.sectionTargets[section]||""} onChange={e=>update({...data,sectionTargets:{...data.sectionTargets,[section]:e.target.value}})}/></label></article>})}</div></nav></section>;
}

function AreaPage({area,data,update,edit,goTo}:{area:Area;data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void;goTo:(p:Page)=>void}) {
  const intro={
    Clear:["Current Responsibilities","Finish what can cause harm or follow you; make a finite plan for the rest."],
    Build:["Move Foundation","Build a Chicago-first path through income, credit, housing, money, health, and logistics."],
    Become:["Life After the Move","Keep the life you want visible while the practical plan takes shape."],
    Vault:["",""],
  }[area];
  const permission={Clear:"A plan, boundary, acknowledgment, or release may be a complete resolution.",Build:"Income and credit can move in parallel. Commit money only when terms and evidence are real.",Become:"Nothing here must be earned, optimized, or scored.",Vault:""}[area];
  const add=(section:string)=>edit({id:crypto.randomUUID(),title:"",description:"",area,section,status:"Not started",priority:"Relief",timing:"Now",kind:"Action",createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10)});
  return <div className={`page area-page area-${area.toLowerCase()}`}>
    <header className="area-page-heading"><span>AREA {area==="Clear"?"01":area==="Build"?"02":"03"}</span><div><h1>{intro[0]}</h1><p>{intro[1]}</p></div><aside><small>GOOD-ENOUGH RULE</small><p>{permission}</p></aside></header>
    {area!=="Vault"&&<AreaDashboard area={area} data={data} update={update}/>} 
    {area==="Build" && <><button className="build-subtool-link" onClick={()=>goTo("Apartments")}><span>APARTMENT SEARCH TOOL</span><div><b>Open the Apartment Matrix</b><small>Compare price, fit, approval rules, fees, deposits, sublets, and move-in specials.</small></div><i>→</i></button><DependencyChain/></>}
    {area==="Become" && <Fuel data={data} update={update}/>}
    {areaSections[area].filter(section=>!(area==="Become"&&section==="My Fuel Source")).map((section,index)=>{
      if(area==="Build"&&section==="Timeline") return <div id={sectionId(section)} className="section-anchor" key={section}><Timeline data={data} update={update}/></div>;
      if(area==="Build"&&section==="Move Money") return <div id={sectionId(section)} className="section-anchor" key={section}><Money data={data} update={update}/></div>;
      if(area==="Build"&&section==="Post-Move Income") return <div id={sectionId(section)} className="section-anchor" key={section}><Routes data={data} update={update}/></div>;
      if(area==="Become"&&section==="Flowering Period: First 30 Days") return <div id={sectionId(section)} className="section-anchor" key={section}><Flowering data={data} update={update}/></div>;
      const items=data.items.filter(i=>i.area===area&&i.section===section&&isAction(i)&&(!data.hideCompleted||!isDone(i))).sort((a,b)=>Number(!!a.parentId)-Number(!!b.parentId));
      const references=data.items.filter(i=>i.area===area&&i.section===section&&i.kind==="Reference");
      const reflections=data.items.filter(i=>i.area===area&&i.section===section&&i.kind==="Reflection");
      const locked=false;
      const reason=sectionReasoning[section];
      return <details id={sectionId(section)} className={`section-card section-anchor ${locked?"locked":""}`} key={section} open={index<2&&!locked}>
        <summary><div className="section-number"><span>{locked?"LOCKED":"0"+(index+1)}</span></div><div className="section-summary"><h2>{section}</h2><p>{sectionCopy[section] || reflectiveCopy(section)}</p></div><div className="section-count"><b>{items.filter(isDone).length}/{items.length}</b><small>actions</small></div><i>⌄</i></summary>
        <div className="section-body"><div className="section-action-heading"><div><small>ACTIONS</small><b>{reason?.why||"Work that creates a clear, useful result."}</b></div>{reason&&<span>Unlocks: {reason.unlocks}</span>}</div>{items.map(item=><ItemRow key={item.id} item={item} all={data.items} edit={edit}/>)}{reflections.length>0&&<aside className="section-reflections"><small>REFLECTIONS · NOT SCORED</small>{reflections.map(reflection=><button key={reflection.id} onClick={()=>edit(reflection)}><span>NOTE</span><div><b>{reflection.title}</b><small>{reflection.description}</small></div><i>→</i></button>)}</aside>}{references.length>0&&<aside className="section-guidance"><small>FYI · USE WHILE MAKING A DECISION</small>{references.map(reference=><button key={reference.id} onClick={()=>edit(reference)}><span>FYI</span><div><b>{reference.title}</b><small>{reference.description}</small></div><i>→</i></button>)}</aside>}{!locked&&<button className="add-row" onClick={()=>add(section)}>＋ Add an action</button>}</div>
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

function DependencyChain(){return <section className="dependency-chain"><span>INCOME EVIDENCE</span><b>＋</b><span>625+ CREDIT PATH</span><b>→</b><span>REAL PROPERTY TERMS</span><b>→</b><span>LEASE OR SUBLET</span><b>→</b><span>MOVE LOGISTICS</span></section>}
function Timeline({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="feature-card timeline"><div><span>TEMPORARY PLANNING DATE</span><input type="date" value={data.profile.targetMoveDate} onChange={e=>update({...data,profile:{...data.profile,targetMoveDate:e.target.value}})}/></div><p>October 24 still anchors planning. The new critical work is replacing Element income, moving the credit score toward 625+, and comparing Chicago-first housing with real qualification terms. The date can move if the evidence needs more time.</p><div className="timeline-track"><i/><i/><i/><i/><i/></div><div className="timeline-labels"><span>Income + credit<br/><b>Now</b></span><span>Neighborhood learning<br/><b>In parallel</b></span><span>Verified candidates<br/><b>When ready</b></span><span>Lease or sublet<br/><b>Evidence first</b></span><span>Planning date<br/><b>Oct 24</b></span></div></section>}
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
function Routes({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="routes"><div className="section-heading"><div><p className="eyebrow">NEW INCOME REALITY</p><h2>Replace Element income with usable evidence.</h2></div><p>Remote and Chicago-hybrid searches are both real routes. Denver remains visible without receiving equal attention.</p></div>{data.routes.map(route=><details key={route.id} className={`route ${route.active?"active":""}`} open={route.active}><summary><div className="route-number">{route.id.slice(1)}</div><div><small>{route.subtitle}</small><h3>{route.name}</h3><span>{route.status}</span></div><button onClick={e=>{e.preventDefault();update({...data,routes:data.routes.map(r=>({...r,active:r.id===route.id}))})}}>{route.active?"In focus":"Bring into focus"}</button></summary><ul>{route.details.map(d=><li key={d}>○ <span>{d}</span></li>)}</ul></details>)}</section>}
function Fuel({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="fuel"><p className="eyebrow">MY FUEL SOURCE</p><textarea aria-label="Personal statement" value={data.profile.reason} onChange={e=>update({...data,profile:{...data.profile,reason:e.target.value}})}/><div className="reflection-grid">{data.reflections.map(r=><label key={r.id}><span>{r.prompt}</span><textarea value={r.value} onChange={e=>update({...data,reflections:data.reflections.map(x=>x.id===r.id?{...x,value:e.target.value}:x)})}/></label>)}</div></section>}
function Flowering({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="flowering"><div><p className="eyebrow">FIRST 30 DAYS</p><h2>Protect the flowering period.</h2><p>Safe home. Steady routines. One repeated connection. One reminder of why you moved.</p></div><label className="protect"><input type="checkbox" checked={data.profile.protectedMonth} onChange={e=>update({...data,profile:{...data.profile,protectedMonth:e.target.checked}})}/><span><b>Keep this month intentionally protected</b><small>Unnecessary commitments can wait.</small></span></label></section>}
function ItemRow({item,all,edit}:{item:MoveItem;all:MoveItem[];edit:(i:MoveItem)=>void}){const blocked=blocker(item,all);const parent=all.find(i=>i.id===item.parentId);return <button className={`item-row ${item.parentId?"subtask-row":""} ${isDone(item)?"item-completed":""}`} onClick={()=>edit(item)}><span className={`status-dot ${isDone(item)?"done":""}`}>{isDone(item)?"✓":"○"}</span><span>{item.parentId&&<small className="subtask-label">SUBTASK OF {parent?.title||"A LARGER ACTION"}</small>}<b>{item.title}</b><small>{blocked || item.description || `${item.status} · ${item.timing}`}</small></span><em>{item.optional?"Optional":blocked?"Waiting":item.status}</em><i>→</i></button>}

function itemReason(item:MoveItem,all:MoveItem[]) {
  const blocked=blocker(item,all);
  if(blocked) return `It stays visible because ${blocked.toLowerCase()}, but it is not work for today.`;
  if(item.optional) return "This may help, but it is not required for move readiness and will not lower your progress.";
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

function ApartmentMatrix({data,update}:{data:MoveData;update:(d:MoveData)=>void}) {
  const [editingApartment,setEditingApartment]=useState<ApartmentListing|null>(null);
  const statuses:ApartmentStatus[]=["Considering","Researching","Touring","Applied","Top choice","Passed","Lease signed"];
  const newListing=():ApartmentListing=>({id:crypto.randomUUID(),name:"",city:"Chicago",neighborhood:"",url:"",housingType:"Standard lease",monthlyRent:0,bedrooms:"",qualities:"",incomeRequirement:"",minimumCredit:625,applicationFee:0,deposit:0,petCost:0,parkingCost:0,otherMoveInCosts:0,moveInSpecial:"",specialSavings:0,status:"Considering",notes:""});
  const total=(home:ApartmentListing)=>Math.max(0,home.monthlyRent+home.applicationFee+home.deposit+home.petCost+home.parkingCost+home.otherMoveInCosts-home.specialSavings);
  const save=(home:ApartmentListing)=>{const exists=data.apartments.some(item=>item.id===home.id);update({...data,apartments:exists?data.apartments.map(item=>item.id===home.id?home:item):[...data.apartments,home]});setEditingApartment(null)};
  const chicago=data.apartments.filter(home=>home.city==="Chicago").length;
  const sublets=data.apartments.filter(home=>home.housingType==="Sublet").length;
  const top=data.apartments.filter(home=>home.status==="Top choice"||home.status==="Applied").length;
  return <div className="page apartment-page">
    <div className="apartment-hero"><div><p className="eyebrow">CHICAGO FIRST · DENVER AS BACKUP</p><h1>The Apartment Matrix.</h1><p className="lede">One calm place to compare what a home costs, how it feels, and whether its approval rules fit the evidence you will actually have.</p></div><button className="button primary" onClick={()=>setEditingApartment(newListing())}>＋ Add a property</button></div>
    <section className="approval-spine"><div><small>THE TWO APPROVAL PILLARS</small><h2>Income evidence <span>＋</span> 625+ credit path</h2><p>An offer letter or paystubs establish income. The credit plan strengthens the path to applying alone. A sublet may use different verification, so record its actual rules.</p></div><button onClick={()=>setEditingApartment(newListing())}>Compare a standard lease, sublet, or special →</button></section>
    <section className="apartment-stats"><article><span>{data.apartments.length}</span><small>saved options</small></article><article><span>{chicago}</span><small>Chicago options</small></article><article><span>{sublets}</span><small>sublets</small></article><article><span>{top}</span><small>active finalists</small></article></section>
    {data.apartments.length?<div className="apartment-table-wrap"><table className="apartment-table"><thead><tr><th>Property & fit</th><th>Monthly</th><th>Approval rules</th><th>Move-in cash</th><th>Special</th><th>Status</th><th/></tr></thead><tbody>{data.apartments.map(home=><tr key={home.id} className={home.status==="Passed"?"passed":""}><td><b>{home.name||"Untitled property"}</b><span>{home.city} · {home.neighborhood||"Neighborhood not noted"} · {home.housingType}</span><small>{home.bedrooms||"Size not noted"}{home.squareFeet?` · ${home.squareFeet} sq ft`:""}</small><p>{home.qualities||"Add the qualities that matter here."}</p></td><td><strong>${home.monthlyRent.toLocaleString()}</strong><small>rent</small><span>＋ ${home.parkingCost+home.petCost}/mo known extras</span></td><td><b>{home.incomeRequirement||"Need income rule"}</b><span>{home.minimumCredit?`${home.minimumCredit}+ credit noted`:"Need credit rule"}</span></td><td><strong>${total(home).toLocaleString()}</strong><small>estimated cash to enter</small><span>${home.applicationFee} application · ${home.deposit} deposit</span></td><td><b>{home.moveInSpecial||"None confirmed"}</b><span>{home.specialSavings?`− $${home.specialSavings.toLocaleString()} estimated value`:"Verify before counting savings"}</span></td><td><span className={`apartment-status status-${home.status.toLowerCase().replaceAll(" ","-")}`}>{home.status}</span></td><td><button onClick={()=>setEditingApartment(home)}>Edit →</button></td></tr>)}</tbody></table></div>:<section className="apartment-empty"><span>⌂</span><h2>No candidates yet—and no fake assumptions.</h2><p>Add properties as you find them. Chicago is the default, but Denver and “Other” remain available. The matrix will calculate a calm move-in estimate from the terms you enter.</p><Button kind="primary" onClick={()=>setEditingApartment(newListing())}>Add the first property</Button></section>}
    <aside className="matrix-method"><small>HOW THE NUMBER TRACES</small><p><b>Estimated cash to enter</b> = first month’s rent + application fee + deposit + pet cost + first known parking cost + other move-in costs − the dollar value of a verified special. Monthly utilities are not included unless you enter them in notes.</p></aside>
    {editingApartment&&<ApartmentModal home={editingApartment} statuses={statuses} onClose={()=>setEditingApartment(null)} onSave={save} onDelete={()=>{update({...data,apartments:data.apartments.filter(home=>home.id!==editingApartment.id)});setEditingApartment(null)}}/>}
  </div>;
}

function ApartmentModal({home,statuses,onClose,onSave,onDelete}:{home:ApartmentListing;statuses:ApartmentStatus[];onClose:()=>void;onSave:(home:ApartmentListing)=>void;onDelete:()=>void}) {
  const [draft,setDraft]=useState(home);
  const number=(key:keyof ApartmentListing,value:string)=>setDraft({...draft,[key]:Number(value)||0});
  return <div className="modal-backdrop" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><form className="modal apartment-modal" onSubmit={event=>{event.preventDefault();onSave(draft)}}><div className="modal-head"><div><span>PROPERTY CANDIDATE</span><h2>{draft.name||"Add a home"}</h2></div><button type="button" onClick={onClose}>×</button></div>
    <div className="form-grid"><label>Name<input required value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></label><label>Listing link<input type="url" value={draft.url} onChange={event=>setDraft({...draft,url:event.target.value})}/></label></div>
    <div className="form-grid"><label>City<select value={draft.city} onChange={event=>setDraft({...draft,city:event.target.value as ApartmentListing["city"]})}><option>Chicago</option><option>Denver</option><option>Other</option></select></label><label>Neighborhood<input value={draft.neighborhood} onChange={event=>setDraft({...draft,neighborhood:event.target.value})}/></label></div>
    <div className="form-grid"><label>Housing route<select value={draft.housingType} onChange={event=>setDraft({...draft,housingType:event.target.value as HousingType})}><option>Standard lease</option><option>Sublet</option></select></label><label>Status<select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as ApartmentStatus})}>{statuses.map(status=><option key={status}>{status}</option>)}</select></label></div>
    <div className="form-grid three"><label>Monthly rent<input type="number" min="0" value={draft.monthlyRent} onChange={event=>number("monthlyRent",event.target.value)}/></label><label>Bedrooms / layout<input value={draft.bedrooms} onChange={event=>setDraft({...draft,bedrooms:event.target.value})}/></label><label>Square feet<input type="number" min="0" value={draft.squareFeet||0} onChange={event=>number("squareFeet",event.target.value)}/></label></div>
    <label>How it fits location, space, size, and desired qualities<textarea value={draft.qualities} placeholder="Safety, dog access, parking, privacy, light, gym, community, music…" onChange={event=>setDraft({...draft,qualities:event.target.value})}/></label>
    <div className="form-grid"><label>Income restriction / verification<input value={draft.incomeRequirement} placeholder="Example: 3× rent; offer letter accepted" onChange={event=>setDraft({...draft,incomeRequirement:event.target.value})}/></label><label>Minimum credit<input type="number" min="0" value={draft.minimumCredit||0} onChange={event=>number("minimumCredit",event.target.value)}/></label></div>
    <details className="editor-details" open><summary>Move-in cost details <span>⌄</span></summary><div className="form-grid three"><label>Application fee<input type="number" min="0" value={draft.applicationFee} onChange={event=>number("applicationFee",event.target.value)}/></label><label>Deposit<input type="number" min="0" value={draft.deposit} onChange={event=>number("deposit",event.target.value)}/></label><label>Pet cost<input type="number" min="0" value={draft.petCost} onChange={event=>number("petCost",event.target.value)}/></label><label>Parking cost<input type="number" min="0" value={draft.parkingCost} onChange={event=>number("parkingCost",event.target.value)}/></label><label>Other move-in costs<input type="number" min="0" value={draft.otherMoveInCosts} onChange={event=>number("otherMoveInCosts",event.target.value)}/></label><label>Verified special value<input type="number" min="0" value={draft.specialSavings} onChange={event=>number("specialSavings",event.target.value)}/></label></div></details>
    <label>Move-in special<input value={draft.moveInSpecial} placeholder="Example: first month free; reduced deposit" onChange={event=>setDraft({...draft,moveInSpecial:event.target.value})}/></label><label>Notes<textarea value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})}/></label>
    <div className="modal-actions">{home.name&&<button type="button" className="delete" onClick={onDelete}>Remove property</button>}<span/><Button onClick={onClose}>Close</Button><Button type="submit" kind="primary">Save property</Button></div>
  </form></div>;
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
  const parent=all.find(i=>i.id===draft.parentId);
  const dependency=all.find(i=>i.id===draft.dependency);
  const children=all.filter(i=>i.parentId===draft.id);
  const unlocked=all.filter(i=>i.dependency===draft.id||draft.unlocks?.includes(i.id));
  const references=all.filter(i=>i.kind!=="Action"&&i.referenceFor?.includes(draft.id));
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <form className={`modal task-editor editor-${draft.area.toLowerCase()}`} onSubmit={e=>{e.preventDefault();onSave({...draft,updatedAt:new Date().toISOString().slice(0,10)})}}>
      <div className="task-editor-head"><div><small>{areaLabels[draft.area as keyof typeof areaLabels]||draft.area} · {draft.section}</small><h2>{item.title?"Edit task":"Add an action"}</h2></div><button type="button" onClick={onClose} aria-label="Close editor">×</button></div>
      <section className="task-primary-fields"><label><span>Task or piece</span><input autoFocus required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label><span>What does done—or useful—look like?</span><textarea value={draft.description} placeholder="Describe the clear outcome in plain language…" onChange={e=>setDraft({...draft,description:e.target.value})}/></label><label><span>Type</span><select value={draft.kind||"Action"} onChange={e=>setDraft({...draft,kind:e.target.value as MoveItem["kind"]})}><option value="Action">Action — something with a clear finish</option><option value="Reflection">Reflection — produces clarity, not a score</option><option value="Reference">FYI — guidance attached to decisions</option></select></label></section>
      {draft.kind==="Action"?<section className="task-action-controls"><div className="form-grid three"><label><span>Status</span><select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label><span>Due date</span><input type="date" value={draft.dueDate||""} onChange={e=>setDraft({...draft,dueDate:e.target.value||undefined})}/></label><label><span>Timing</span><select value={draft.timing} onChange={e=>setDraft({...draft,timing:e.target.value as Timing})}>{timings.map(t=><option key={t}>{t}</option>)}</select></label></div><label className="optional-toggle"><input type="checkbox" checked={!!draft.optional} onChange={e=>setDraft({...draft,optional:e.target.checked})}/><span><b>Optional action</b><small>It stays visible but does not lower required progress.</small></span></label></section>:<div className="reference-notice"><b>{draft.kind==="Reflection"?"Reflection—not a scored task.":"FYI—not an action item."}</b><span>This stays available as context and never affects completion.</span></div>}
      {references.length>0&&<aside className="attached-reference"><small>FYI ATTACHED TO THIS TASK</small>{references.map(reference=><button type="button" key={reference.id} onClick={()=>onOpen(reference)}><span>FYI</span><div><b>{reference.title}</b><small>{reference.description}</small></div><i>→</i></button>)}</aside>}
      <label className="task-notes"><span>Notes</span><textarea value={draft.notes||""} placeholder="Context, links, what good enough means, or what to remember…" onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
      <details className="editor-details"><summary>Organization details <span>Area, section, phase, and knowledge status</span></summary><div className="form-grid"><label><span>Area</span><select value={draft.area} onChange={e=>{const next=e.target.value as Area;setDraft({...draft,area:next,section:areaSections[next][0]||draft.section})}}>{(["Clear","Build","Become"] as const).map(area=><option key={area} value={area}>{areaLabels[area]}</option>)}</select></label><label><span>Section</span><select value={draft.section} onChange={e=>setDraft({...draft,section:e.target.value})}>{areaSections[draft.area].map(section=><option key={section}>{section}</option>)}</select></label></div><div className="form-grid"><label><span>Move phase</span><select value={draft.stage||"Foundation"} onChange={e=>setDraft({...draft,stage:e.target.value as MoveStage})}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><label><span>Life stream</span><select value={draft.stream||"Clear"} onChange={e=>setDraft({...draft,stream:e.target.value as MoveStream})}>{streams.map(s=><option key={s}>{s}</option>)}</select></label></div><div className="form-grid"><label><span>Relationship</span><select value={draft.relationship||"Parallel"} onChange={e=>setDraft({...draft,relationship:e.target.value as RelationshipType})}>{relationships.map(s=><option key={s}>{s}</option>)}</select></label><label><span>Knowledge status</span><select value={draft.knowledgeStatus||"Need to think"} onChange={e=>setDraft({...draft,knowledgeStatus:e.target.value as KnowledgeStatus})}>{knowledgeStatuses.map(s=><option key={s}>{s}</option>)}</select></label></div></details>
      <details className="editor-details"><summary>Task connections <span>Parent, subtask, and dependency links</span></summary><label><span>Part of a larger task</span><select value={draft.parentId||""} onChange={e=>setDraft({...draft,parentId:e.target.value||undefined})}><option value="">This is a main task</option>{all.filter(i=>i.id!==draft.id&&!i.parentId&&isAction(i)).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label><label><span>Must wait for</span><select value={draft.dependency||""} onChange={e=>setDraft({...draft,dependency:e.target.value||undefined})}><option value="">Nothing — this can move now</option>{all.filter(i=>i.id!==draft.id&&isAction(i)).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label>{parent&&<button type="button" className="editor-linked-item" onClick={()=>onOpen(parent)}>Parent task: <b>{parent.title}</b> →</button>}{dependency&&<button type="button" className="editor-linked-item" onClick={()=>onOpen(dependency)}>Prerequisite: <b>{dependency.title}</b> →</button>}{children.length>0&&<div className="editor-child-list"><small>SUBTASKS</small>{children.map(child=><button type="button" key={child.id} onClick={()=>onOpen(child)}><span>{isDone(child)?"✓":"○"}</span><b>{child.title}</b><em>{child.status}</em></button>)}</div>}{unlocked.length>0&&<div className="editor-child-list"><small>UNLOCKS</small>{unlocked.map(next=><button type="button" key={next.id} onClick={()=>onOpen(next)}><span>→</span><b>{next.title}</b><em>{next.status}</em></button>)}</div>}{blocker(draft,all)&&<p className="blocker">Waiting because: {blocker(draft,all)}.</p>}</details>
      <div className="task-editor-footer">{item.title&&<button type="button" className="delete" onClick={onDelete}>Delete</button>}<span/><Button onClick={onClose}>Cancel</Button><Button type="submit" kind="primary">Save</Button></div>
    </form>
  </div>;
}
