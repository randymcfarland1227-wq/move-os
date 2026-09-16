"use client";

import { useEffect, useRef, useState } from "react";
import type { ApartmentListing, ApartmentStatus, HousingType, ItemType, MoveData, MoveItem, MovePhase, Schedule, Status, SyncState, VaultEntry, WorkArea } from "./types";
import { getSheetEndpoint, moveRepository, setSheetEndpoint } from "./repository";
import { blocker, childProgress, isAction, isDone, isWorkItem, recommendations, taskScore } from "./priorities";
import { HomeDashboard } from "./components/home/HomeDashboard";
import { ReadinessDetail } from "./components/readiness/ReadinessDetail";
import { CashFlowTool } from "./components/cash-flow/CashFlowTool";
import { CaptureModal } from "./components/capture/CaptureModal";

type Page="Home"|"Pre-Move"|"Post-Move"|"FullPlan"|"Apartments"|"CashFlow"|"Readiness"|"MoveFund"|"JobSearch"|"References"|"Settings";
type PhaseFilter="All"|"Active"|"Now"|"This Week"|"Later"|"Waiting"|"Done"|"First 72 Hours"|"First Week"|"First Month";
type SurfaceArea="All areas"|"Money"|"Work"|"Home"|"Moving"|"Life";

const preAreas:WorkArea[]=["Money","Income","Housing","Packing","Logistics","Health + Marvel","Admin","People + Closure"];
const postAreas:WorkArea[]=["Home Setup","Admin","Money","Health + Marvel","Community","Settling In"];
const statuses:Status[]=["Not Started","In Progress","Blocked","Done"];
const schedules:Schedule[]=["Now","This Week","Later","First 72 Hours","First Week","First Month"];
const areaGlyph:Record<string,string>={Money:"$",Income:"↗",Housing:"⌂",Packing:"□",Logistics:"→","Health + Marvel":"♡",Admin:"✓","People + Closure":"∞","Home Setup":"⌂",Community:"◎","Settling In":"✦"};
const areaCopy:Record<string,string>={};

const isoToday=()=>new Date().toISOString().slice(0,10);
const formatDate=(value?:string,options:Intl.DateTimeFormatOptions={month:"short",day:"numeric"})=>value?new Intl.DateTimeFormat("en-US",options).format(new Date(`${value}T12:00:00`)):"No date";
const daysUntil=(value:string)=>Math.max(0,Math.ceil((new Date(`${value}T12:00:00`).getTime()-Date.now())/86400000));
const displayDestination=(value:string)=>value.split("·")[0].trim();
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const supporting=(item:MoveItem)=>item.kind==="Reference"||item.kind==="Reflection";
const phaseAreas=(phase:MovePhase)=>phase==="Pre-Move"?preAreas:postAreas;
const filterLabel=(phase:MovePhase):PhaseFilter[]=>phase==="Pre-Move"?["Active","Waiting","Later","Done"]:["First 72 Hours","First Week","First Month","Later","Done"];
const surfaceArea=(item:MoveItem):Exclude<SurfaceArea,"All areas">=>item.workArea==="Money"?"Money":item.workArea==="Income"?"Work":item.workArea==="Housing"||item.workArea==="Home Setup"?"Home":item.workArea==="Packing"||item.workArea==="Logistics"?"Moving":"Life";
const surfaceAreas:SurfaceArea[]=["All areas","Money","Work","Home","Moving","Life"];

function Logo(){return <div className="brand"><span>MO</span><div><b>Randy’s Move</b><small>A calmer path to Chicago</small></div></div>}
function Button({children,onClick,type="button",kind="secondary"}:{children:React.ReactNode;onClick?:()=>void;type?:"button"|"submit";kind?:"primary"|"secondary"|"quiet"}){return <button type={type} className={`button ${kind}`} onClick={onClick}>{children}</button>}

export function MoveOS(){
  const [data,setData]=useState<MoveData|null>(null);
  const [page,setPage]=useState<Page>("Home");
  const [editing,setEditing]=useState<MoveItem|null>(null);
  const [adding,setAdding]=useState<MoveItem|null>(null);
  const [searchOpen,setSearchOpen]=useState(false);
  const [captureOpen,setCaptureOpen]=useState(false);
  const [selectedReadiness,setSelectedReadiness]=useState("income-proof");
  const [dark,setDark]=useState(false);
  const [sync,setSync]=useState<SyncState>(moveRepository.getSyncState());
  const ready=useRef(false);
  useEffect(()=>{moveRepository.load().then(value=>{setData(value);setSync(moveRepository.getSyncState());ready.current=true})},[]);
  useEffect(()=>{if(!data||!ready.current)return;const timer=window.setTimeout(()=>moveRepository.save(data).then(()=>setSync(moveRepository.getSyncState())),250);return()=>window.clearTimeout(timer)},[data]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
  useEffect(()=>{window.scrollTo({top:0,behavior:"instant" as ScrollBehavior})},[page]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setSearchOpen(true)}if(event.key==="Escape")setSearchOpen(false)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[]);
  if(!data)return <div className="loading"><span/><p>Gathering the plan…</p></div>;
  const updateItem=(saved:MoveItem)=>setData(current=>current&&({...current,items:current.items.some(item=>item.id===saved.id)?current.items.map(item=>item.id===saved.id?saved:item):[...current.items,saved]}));
  const deleteItem=(id:string)=>setData(current=>current&&({...current,items:current.items.filter(item=>item.id!==id).map(item=>item.parentId===id?{...item,parentId:undefined}:item)}));
  const currentPhase:MovePhase=new Date()<=new Date(`${data.profile.targetMoveDate}T23:59:59`)?"Pre-Move":"Post-Move";
  const openPage=(next:Page)=>setPage(next);
  return <div className="app-shell">
    <header className="site-header">
      <Logo/>
      <nav className="primary-nav" aria-label="Primary navigation">
        {(["Home","Pre-Move","Post-Move"] as Page[]).map(tab=><button key={tab} className={page===tab?"active":""} onClick={()=>openPage(tab)}>{tab}</button>)}
      </nav>
      <div className="header-tools">
        <button className="search-button" onClick={()=>setSearchOpen(true)}><span>⌕</span><b>Search</b><kbd>⌘K</kbd></button>
        <div className="utility-menu"><button aria-label="Open utilities">•••</button><div><button onClick={()=>openPage("FullPlan")}>View full plan</button><button onClick={()=>openPage("CashFlow")}>Cash Flow</button><button onClick={()=>openPage("Apartments")}>Apartment Search</button><button onClick={()=>openPage("References")}>References</button><button onClick={()=>openPage("Settings")}>Settings</button></div></div>
        <button className="quick-add" onClick={()=>setCaptureOpen(true)}>＋ Capture</button>
      </div>
    </header>
    <main>
      {page==="Home"&&<HomeDashboard data={data} update={setData} editItem={setEditing} openReadiness={id=>{setSelectedReadiness(id);openPage("Readiness")}} openPreMove={()=>openPage("Pre-Move")} openCashFlow={()=>openPage("CashFlow")} openApartments={()=>openPage("Apartments")} openReferences={()=>openPage("References")}/>}
      {(page==="Pre-Move"||page==="Post-Move")&&<PhasePage phase={page} data={data} update={setData} edit={setEditing} add={(type,area)=>setAdding({...newItem(type,page),...(area?{workArea:area}:{})})} go={openPage}/>}
      {page==="FullPlan"&&<FullPlan data={data} update={setData} edit={setEditing} go={openPage}/>}
      {page==="Apartments"&&<ApartmentMatrix data={data} update={setData} back={()=>openPage("Pre-Move")}/>}
      {page==="CashFlow"&&<CashFlowTool plan={data.cashFlow} onChange={cashFlow=>setData({...data,cashFlow,moveFund:{...data.moveFund,current:cashFlow.accounts.reduce((sum,account)=>sum+account.balance,0)}})} back={()=>openPage("Home")}/>}
      {page==="Readiness"&&<ReadinessDetail gateId={selectedReadiness} data={data} update={setData} editItem={setEditing} back={()=>openPage("Home")} openCashFlow={()=>openPage("CashFlow")}/>}
      {page==="MoveFund"&&<MoveFundPage data={data} update={setData} back={()=>openPage("Pre-Move")}/>}
      {page==="JobSearch"&&<JobSearchPage data={data} update={setData} back={()=>openPage("Pre-Move")}/>}
      {page==="References"&&<ReferencesPage data={data} update={setData} edit={setEditing}/>}
      {page==="Settings"&&<SettingsPage data={data} update={setData} dark={dark} setDark={setDark} sync={sync}/>}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{(["Home","Pre-Move","Post-Move"] as Page[]).map(tab=><button key={tab} className={page===tab?"active":""} onClick={()=>openPage(tab)}><span>{tab==="Home"?"⌂":tab==="Pre-Move"?"→":"✦"}</span>{tab.replace("-"," ")}</button>)}<button onClick={()=>setCaptureOpen(true)}><span>＋</span>Capture</button></nav>
    {searchOpen&&<Search data={data} close={()=>setSearchOpen(false)} edit={item=>{setEditing(item);setSearchOpen(false)}} go={next=>{openPage(next);setSearchOpen(false)}}/>}
    {(editing||adding)&&<ItemEditor item={editing||adding!} all={data.items} onClose={()=>{setEditing(null);setAdding(null)}} onSave={saved=>{updateItem(saved);setEditing(null);setAdding(null)}} onDelete={editing?()=>{deleteItem(editing.id);setEditing(null)}:undefined} onOpen={setEditing}/>}
    {captureOpen&&<CaptureModal data={data} save={setData} close={()=>setCaptureOpen(false)}/>}
  </div>;
}

function newItem(type:ItemType,phase:MovePhase):MoveItem{
  return {id:crypto.randomUUID(),title:"",description:"",phase,type,workArea:phase==="Pre-Move"?"Housing":"Settling In",status:"Not Started",importance:"Normal",schedule:phase==="Pre-Move"?"This Week":"First Month",kind:"Action",createdAt:isoToday(),updatedAt:isoToday()};
}

function Home({data,update,edit,go}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;go:(page:Page)=>void}){
  const preMove=data.items.filter(item=>item.phase==="Pre-Move");
  const next=recommendations(preMove,4);
  const waiting=preMove.filter(item=>isWorkItem(item)&&item.type!=="Goal"&&!isDone(item)&&(item.status==="Blocked"||!!blocker(item,data.items)));
  const goals=[data.items.find(item=>item.id==="credit-plan"),data.items.find(item=>item.id==="income-evidence"),data.items.find(item=>item.id==="lease")].filter(Boolean) as MoveItem[];
  const complete=(task:MoveItem)=>update({...data,items:data.items.map(item=>item.id===task.id?{...item,status:isDone(item)?"Not Started":"Done",completedAt:isDone(item)?undefined:new Date().toISOString(),updatedAt:isoToday()}:item)});
  return <div className="page simple-home">
    <header className="simple-home-head"><div><p className="kicker">YOUR MOVE</p><h1>{displayDestination(data.profile.destination)}</h1></div><div><strong>{daysUntil(data.profile.targetMoveDate)}</strong><span>days to move</span><small>{formatDate(data.profile.targetMoveDate,{month:"long",day:"numeric"})}</small></div></header>
    <section className="simple-next"><header><div><p className="kicker">NEXT</p><h2>A few things worth doing now.</h2></div></header><div className="flat-list">{next.map(item=><TaskRow key={item.id} item={item} all={data.items} check={()=>complete(item)} edit={()=>edit(item)} compact/>)}{!next.length&&<Empty copy="Nothing needs your attention right now."/>}</div><button className="text-link" onClick={()=>go("FullPlan")}>View full plan →</button></section>
    <div className="simple-lower">
      <section className="simple-waiting"><header><h2>Waiting</h2><span>{waiting.length} {waiting.length===1?"item":"items"}</span></header>{waiting.slice(0,2).map(item=><button key={item.id} onClick={()=>edit(item)}><b>{item.title}</b><small>{blocker(item,data.items)||item.blocker||"Needs another step first"}</small></button>)}{waiting.length>2&&<button className="text-link" onClick={()=>go("Pre-Move")}>See all waiting →</button>}</section>
      <section className="simple-status"><h2>Status</h2>{goals.map(goal=><button key={goal.id} onClick={()=>edit(goal)}><span>{surfaceArea(goal)}</span><b>{goal.title}</b><small>{goalState(goal,data.items)}</small></button>)}<button onClick={()=>go("MoveFund")}><span>Money</span><b>Move Fund</b><small>{money(data.moveFund.current)} / {data.moveFund.workingTarget?money(data.moveFund.workingTarget):"target not set"}</small></button></section>
    </div>
    <ToolsStrip data={data} go={go}/>
  </div>;
}

function PhasePage({phase,data,update,edit,add,go}:{phase:MovePhase;data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;add:(type:ItemType,area?:WorkArea)=>void;go:(page:Page)=>void}){
  const [filter,setFilter]=useState<PhaseFilter>(phase==="Pre-Move"?"Active":"First 72 Hours");
  const [area,setArea]=useState<SurfaceArea>("All areas");
  const work=data.items.filter(item=>item.phase===phase&&isWorkItem(item));
  const inArea=(item:MoveItem)=>area==="All areas"||surfaceArea(item)===area;
  const waiting=work.filter(item=>!isDone(item)&&(item.status==="Blocked"||!!blocker(item,data.items))&&!item.optional);
  const later=work.filter(item=>!isDone(item)&&item.schedule==="Later"&&!item.optional);
  const optional=work.filter(item=>!isDone(item)&&item.optional);
  let visible:MoveItem[];
  if(filter==="Active"){
    visible=work.filter(item=>inArea(item)&&item.type==="Task"&&!item.optional&&!isDone(item)&&item.schedule!=="Later"&&!blocker(item,data.items)).sort((a,b)=>taskScore(b,data.items)-taskScore(a,data.items));
  }else visible=work.filter(item=>{
    if(!inArea(item)||item.optional)return false;
    if(filter==="Done")return isDone(item);
    if(filter==="Waiting")return !isDone(item)&&(item.status==="Blocked"||!!blocker(item,data.items));
    return !isDone(item)&&item.schedule===filter;
  }).sort((a,b)=>taskScore(b,data.items)-taskScore(a,data.items));
  const heading=filter;
  return <div className="page simple-phase">
    <header className="simple-phase-head"><p className="kicker">{phase.toUpperCase()}</p><h1>{phase==="Pre-Move"?"The deeper workspace for what must happen before leaving.":"Captured for later—you do not need to solve this yet."}</h1></header>
    <div className="simple-controls"><div className="filter-row" role="group" aria-label={`${phase} filters`}>{filterLabel(phase).map(value=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{value}</button>)}</div><label className="area-filter"><span>Area</span><select value={area} onChange={event=>setArea(event.target.value as SurfaceArea)}>{surfaceAreas.map(value=><option key={value}>{value}</option>)}</select></label></div>
    <section className="flow-section"><header><h2>{heading}</h2><span>{visible.length} {visible.length===1?"item":"items"}</span></header><div className="flat-list">{visible.map(item=><FlatWorkItem key={item.id} item={item} all={data.items} data={data} update={update} edit={edit}/>)}{!visible.length&&<Empty copy={filter==="Active"?"No actionable tasks here right now.":phase==="Post-Move"?"This is already captured for later.":`No ${filter.toLowerCase()} items in this view.`}/>}</div></section>
    {filter==="Active"&&<div className="quiet-queues"><button onClick={()=>setFilter("Later")}><span>Later</span><b>{later.length} items</b><i>View →</i></button><button onClick={()=>setFilter("Waiting")}><span>Waiting</span><b>{waiting.length} items</b><i>View →</i></button><button onClick={()=>go("FullPlan")}><span>Optional</span><b>{optional.length} items</b><i>View →</i></button></div>}
    {phase==="Post-Move"&&<button className="reflection-link" onClick={()=>go("FullPlan")}><span>Personal compass</span><b>Reflections stay separate from tasks.</b><i>Open →</i></button>}
    <button className="simple-add" onClick={()=>add("Task")}>＋ Add a task</button>
  </div>;
}

function FlatWorkItem({item,all,data,update,edit}:{item:MoveItem;all:MoveItem[];data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  if(item.type==="Goal")return <button className="flat-goal" onClick={()=>edit(item)}><span>Goal</span><div><b>{item.title}</b><small>{surfaceArea(item)} · {goalState(item,all)}</small></div><i>View related work →</i></button>;
  if(item.type==="Project"){
    const children=all.filter(child=>child.parentId===item.id&&isAction(child)&&!child.optional);
    const done=children.filter(isDone).length;
    return <details className="flat-project"><summary><span>◇</span><div><b>{item.title}</b><small>{surfaceArea(item)} · {children.length?`${done} of ${children.length} complete`:item.status}</small></div><i>Open</i></summary><div>{children.map(child=><FlatWorkItem key={child.id} item={child} all={all} data={data} update={update} edit={edit}/>)}<button onClick={()=>edit(item)}>Edit project details →</button></div></details>;
  }
  const toggle=()=>update({...data,items:data.items.map(candidate=>candidate.id===item.id?{...candidate,status:isDone(candidate)?"Not Started":"Done",completedAt:isDone(candidate)?undefined:new Date().toISOString(),updatedAt:isoToday()}:candidate)});
  return <TaskRow item={item} all={all} check={toggle} edit={()=>edit(item)} compact/>;
}

function ToolsStrip({data,go}:{data:MoveData;go:(page:Page)=>void}){
  const activeRoute=data.routes.find(route=>route.active);
  return <section className="tools-strip"><h2>Tools</h2><div><button onClick={()=>go("Apartments")}><span>⌂</span><b>Apartment Search</b><small>{data.apartments.length} homes saved</small><i>→</i></button><button onClick={()=>go("MoveFund")}><span>$</span><b>Move Fund</b><small>{money(data.moveFund.current)} / {data.moveFund.workingTarget?money(data.moveFund.workingTarget):"set target"}</small><i>→</i></button><button onClick={()=>go("JobSearch")}><span>↗</span><b>Job Search</b><small>{activeRoute?.name||"Choose a route"}</small><i>→</i></button></div></section>;
}

function FullPlan({data,update,edit,go}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;go:(page:Page)=>void}){
  return <div className="page full-plan"><button className="back-link" onClick={()=>go("Home")}>← Home</button><header><p className="kicker">FULL PLAN</p><h1>Everything, when you want to see it.</h1><p>Goals, projects, tasks, optional work, and completed history live here without crowding the daily view.</p></header>{(["Pre-Move","Post-Move"] as MovePhase[]).map(phase=><section key={phase}><h2>{phase}</h2>{surfaceAreas.slice(1).map(area=>{const items=data.items.filter(item=>item.phase===phase&&isWorkItem(item)&&surfaceArea(item)===area);const roots=items.filter(item=>!item.parentId||!items.some(parent=>parent.id===item.parentId));return roots.length?<details key={area} className="full-area"><summary><b>{area}</b><span>{items.length} items</span><i>⌄</i></summary><div className="flat-list">{roots.map(item=><FlatWorkItem key={item.id} item={item} all={data.items} data={data} update={update} edit={edit}/>)}</div></details>:null})}</section>)}<ReflectionShelf data={data} update={update}/></div>;
}

function HomeLegacy({data,update,edit,go,overwhelmed,setOverwhelmed}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;go:(page:Page)=>void;overwhelmed:boolean;setOverwhelmed:(value:boolean)=>void}){
  const next=recommendations(data.items,overwhelmed?3:5);
  const goals=data.items.filter(item=>isWorkItem(item)&&item.type==="Goal"&&item.phase==="Pre-Move").slice(0,4);
  const waiting=data.items.filter(item=>isWorkItem(item)&&item.type!=="Goal"&&!isDone(item)&&(item.status==="Blocked"||blocker(item,data.items))).slice(0,4);
  const upcoming:Array<{id:string;title:string;date:string;item?:MoveItem}>=[...data.items.filter(item=>item.dueDate&&!isDone(item)).map(item=>({id:item.id,title:item.title,date:item.dueDate!,item})),{id:"move-day",title:"Move Day",date:data.profile.targetMoveDate}].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const completeTask=(task:MoveItem)=>update({...data,items:data.items.map(item=>item.id===task.id?{...item,status:item.status==="Done"?"Not Started":"Done",completedAt:item.status==="Done"?undefined:new Date().toISOString(),updatedAt:isoToday()}:item)});
  if(overwhelmed)return <div className="page home-page focus-mode"><div className="focus-orb"/><p className="kicker">QUIET MODE</p><h1>You only need to look at these right now.</h1><p>Three concrete actions. One reason. Everything else can wait offscreen.</p><section className="focus-actions">{next.map(item=><TaskRow key={item.id} item={item} all={data.items} check={()=>completeTask(item)} edit={()=>edit(item)} compact/>)}{!next.length&&<Empty copy="There is no urgent action waiting for you."/>}</section>{goals[0]&&<button className="focus-goal" onClick={()=>edit(goals[0])}><small>ONE GOAL TO HOLD</small><b>{goals[0].title}</b><span>{goalState(goals[0],data.items)}</span></button>}<blockquote>“{data.profile.reason}”</blockquote><Button kind="primary" onClick={()=>setOverwhelmed(false)}>Return to the full view</Button></div>;
  return <div className="page home-page">
    <section className="move-summary">
      <div><p className="kicker">YOUR MOVE, AT A GLANCE</p><h1>{displayDestination(data.profile.destination)}</h1><p>{data.profile.reason}</p></div>
      <dl><div><dt>Target</dt><dd>{formatDate(data.profile.targetMoveDate,{month:"long",day:"numeric"})}</dd></div><div><dt>Days</dt><dd>{daysUntil(data.profile.targetMoveDate)}</dd></div><div><dt>Phase</dt><dd>Pre-Move</dd></div></dl>
    </section>
    <div className="home-grid">
      <section className="home-panel next-panel"><header><div><p className="kicker">NEXT</p><h2>What matters now</h2></div><button onClick={()=>setOverwhelmed(true)}>I feel overwhelmed</button></header><div className="task-list">{next.map(item=><TaskRow key={item.id} item={item} all={data.items} check={()=>completeTask(item)} edit={()=>edit(item)} compact/>)}{!next.length&&<Empty copy="Nothing urgent is asking for you right now."/>}</div><button className="panel-link" onClick={()=>go("Pre-Move")}>See all Pre-Move work →</button></section>
      <section className="home-panel goal-panel"><header><div><p className="kicker">MAJOR GOALS</p><h2>The outcomes taking shape</h2></div></header><div className="goal-list">{goals.map(goal=><MiniGoal key={goal.id} item={goal} all={data.items} edit={()=>edit(goal)}/>) }<button className="mini-goal fund-goal" onClick={()=>go("Pre-Move")}><span className="goal-icon">$</span><div><small>MOVE FUND</small><b>{money(data.moveFund.current)} <em>/ {data.moveFund.workingTarget?money(data.moveFund.workingTarget):"set target"}</em></b><Progress value={data.moveFund.current} max={data.moveFund.workingTarget}/></div></button></div></section>
      <section className="home-panel waiting-panel"><header><div><p className="kicker">BLOCKED</p><h2>Useful things to wait on</h2></div><span>{waiting.length}</span></header>{waiting.length?<div>{waiting.map(item=><button key={item.id} onClick={()=>edit(item)}><b>{item.title}</b><small>{blocker(item,data.items)||item.blocker||"Needs another step first"}</small></button>)}</div>:<Empty copy="Nothing is blocked right now."/>}</section>
      <section className="home-panel upcoming-panel"><header><div><p className="kicker">UPCOMING</p><h2>Dates on the horizon</h2></div></header><div>{upcoming.map(entry=><button key={entry.id} onClick={()=>entry.item&&edit(entry.item)}><time>{formatDate(entry.date)}</time><b>{entry.title}</b></button>)}</div></section>
    </div>
    <button className="apartment-callout" onClick={()=>go("Apartments")}><span>⌂</span><div><small>PRE-MOVE · HOUSING</small><b>Open Apartment Search</b><p>Compare Chicago-first options, approval rules, move-in cash, and specials.</p></div><i>→</i></button>
  </div>;
}

function MiniGoal({item,all,edit}:{item:MoveItem;all:MoveItem[];edit:()=>void}){
  return <button className="mini-goal" onClick={edit}><span className="goal-icon">{areaGlyph[item.workArea]||"◎"}</span><div><small>{item.workArea.toUpperCase()}</small><b>{item.title}</b><span>{goalState(item,all)}</span>{item.metric?.target?<Progress value={item.metric.current||0} max={item.metric.target}/>:null}</div></button>;
}
function goalState(item:MoveItem,all:MoveItem[]){if(item.metric?.target)return `${item.metric.current??"—"} → ${item.metric.target}${item.metric.unit==="credit score"?"+":""}`;const progress=childProgress(item,all);return progress.total?`${progress.done} of ${progress.total} tasks complete`:item.status;}
function Progress({value,max}:{value:number;max:number}){const percent=max?Math.min(100,Math.round(value/max*100)):0;return <span className="progress-track" aria-label={`${percent}% complete`}><i style={{width:`${percent}%`}}/></span>}

function PhasePageLegacy({phase,data,update,edit,add,go}:{phase:MovePhase;data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;add:(type:ItemType,area?:WorkArea)=>void;go:(page:Page)=>void}){
  const [filter,setFilter]=useState<PhaseFilter>("All");
  const work=data.items.filter(item=>item.phase===phase&&isWorkItem(item));
  const visible=work.filter(item=>{
    if(filter==="Done")return isDone(item);
    if(filter==="Waiting")return item.status==="Blocked"||!!blocker(item,data.items);
    if(filter==="All")return !data.hideCompleted||!isDone(item);
    if(filter==="Now"||filter==="This Week"||filter==="Later"||filter==="First 72 Hours"||filter==="First Week"||filter==="First Month")return item.schedule===filter&&!isDone(item);
    return true;
  });
  const areas=phaseAreas(phase).filter(area=>visible.some(item=>item.workArea===area)||area==="Money"&&phase==="Pre-Move");
  const completed=work.filter(item=>isAction(item)&&!item.optional&&isDone(item)).length;
  const total=work.filter(item=>isAction(item)&&!item.optional).length;
  return <div className={`page phase-page ${phase==="Pre-Move"?"pre":"post"}`}>
    <section className="phase-intro"><div><p className="kicker">{phase.toUpperCase()}</p><h1>{phase==="Pre-Move"?"Build a move you can trust.":"Let the new life become real."}</h1><p>{phase==="Pre-Move"?"Everything that must happen before or during the crossing—organized by the kind of work it is.":"The first days and weeks after arrival, kept separate from what must be solved now."}</p></div><div className="phase-progress"><b>{completed}<span> / {total}</span></b><small>tasks complete</small><Progress value={completed} max={total}/></div></section>
    <div className="filter-row" role="group" aria-label={`${phase} filters`}>{filterLabel(phase).map(value=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{value}</button>)}</div>
    <div className="area-jump">{areas.map(area=><a key={area} href={`#${area.replaceAll(" ","-").replaceAll("+","and")}`}><span>{areaGlyph[area]}</span>{area}</a>)}</div>
    {areas.map(area=><AreaSection key={area} phase={phase} area={area} items={visible.filter(item=>item.workArea===area)} all={data.items} data={data} update={update} edit={edit} add={add} go={go}/>) }
    {phase==="Post-Move"&&<ReflectionShelf data={data} update={update}/>}
  </div>;
}

function AreaSection({phase,area,items,all,data,update,edit,add,go}:{phase:MovePhase;area:WorkArea;items:MoveItem[];all:MoveItem[];data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;add:(type:ItemType,area?:WorkArea)=>void;go:(page:Page)=>void}){
  const roots=items.filter(item=>!item.parentId||!items.some(candidate=>candidate.id===item.parentId)).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
  const rootRequired=roots.filter(item=>!item.optional);
  const rootOptional=roots.filter(item=>item.optional);
  const required=items.filter(item=>isAction(item)&&!item.optional);
  const done=required.filter(isDone).length;
  return <section id={area.replaceAll(" ","-").replaceAll("+","and")} className={`work-area area-${area.toLowerCase().replaceAll(" ","-").replaceAll("+","and")}`}>
    <header className="area-heading"><span>{areaGlyph[area]}</span><div><h2>{area}</h2><p>{areaCopy[area]}</p></div><div><b>{done}/{required.length}</b><small>tasks</small></div></header>
    {phase==="Pre-Move"&&area==="Money"&&<MoveMoney data={data} update={update}/>}
    {phase==="Pre-Move"&&area==="Income"&&<EmploymentRoutes data={data} update={update}/>}
    {phase==="Pre-Move"&&area==="Housing"&&<button className="inline-tool" onClick={()=>go("Apartments")}><span>⌂</span><div><small>HOUSING TOOL</small><b>Compare homes in Apartment Search</b><p>Keep rent, approval requirements, move-in costs, and specials together.</p></div><i>Open →</i></button>}
    <div className="work-stack">{rootRequired.length?rootRequired.map(item=><WorkItem key={item.id} item={item} all={all} data={data} update={update} edit={edit}/>):!rootOptional.length&&<Empty copy="Nothing lives here yet."/>}{rootOptional.length>0&&<details className="optional-group root-optional"><summary><span>Optional</span><b>{rootOptional.length} item{rootOptional.length===1?"":"s"} kept out of the main path</b><i>⌄</i></summary><div>{rootOptional.map(item=><WorkItem key={item.id} item={item} all={all} data={data} update={update} edit={edit}/>)}</div></details>}</div>
    <button className="area-add" onClick={()=>add("Task",area)}>＋ Add a task to {area}</button>
  </section>;
}

function WorkItem(props:{item:MoveItem;all:MoveItem[];data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  if(props.item.type==="Goal")return <GoalCard {...props}/>;
  if(props.item.type==="Project")return <ProjectCard {...props}/>;
  const toggle=()=>props.update({...props.data,items:props.data.items.map(item=>item.id===props.item.id?{...item,status:isDone(item)?"Not Started":"Done",completedAt:isDone(item)?undefined:new Date().toISOString(),updatedAt:isoToday()}:item)});
  return <TaskRow item={props.item} all={props.all} check={toggle} edit={()=>props.edit(props.item)}/>;
}

function GoalCard({item,all,data,update,edit}:{item:MoveItem;all:MoveItem[];data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  const children=all.filter(child=>child.parentId===item.id&&isWorkItem(child)&&child.phase===item.phase&&child.workArea===item.workArea);
  const required=children.filter(child=>!child.optional);
  const optional=children.filter(child=>child.optional);
  const progress=childProgress(item,all);
  return <article className="goal-card"><button className="goal-card-head" onClick={()=>edit(item)}><span className="goal-mark">◎</span><div><small>GOAL · {item.status}</small><h3>{item.title}</h3><p>{item.description}</p></div><div className="goal-outcome">{item.metric?.target?<><b>{item.metric.current??"—"} <i>→</i> {item.metric.target}{item.metric.unit==="credit score"?"+":""}</b><small>{item.metric.unit}</small></>:<><b>{progress.total?`${progress.done}/${progress.total}`:item.status}</b><small>{progress.total?"tasks complete":"current state"}</small></>}</div></button>{children.length>0&&<div className="goal-children">{required.map(child=><WorkItem key={child.id} item={child} all={all} data={data} update={update} edit={edit}/>)}{optional.length>0&&<details className="optional-group"><summary><span>Optional</span><b>{optional.length} linked {optional.length===1?"item":"items"}</b><i>⌄</i></summary><div>{optional.map(child=><WorkItem key={child.id} item={child} all={all} data={data} update={update} edit={edit}/>)}</div></details>}</div>}</article>;
}

function ProjectCard({item,all,data,update,edit}:{item:MoveItem;all:MoveItem[];data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  const children=all.filter(child=>child.parentId===item.id&&isWorkItem(child));
  const required=children.filter(child=>isAction(child)&&!child.optional);
  const optional=children.filter(child=>isAction(child)&&child.optional);
  const done=required.filter(isDone).length;
  return <details className="project-card"><summary><span className="project-mark">{areaGlyph[item.workArea]||"→"}</span><div><small>PROJECT</small><h3>{item.title}</h3><p>{item.description}</p></div><div className="project-progress"><b>{required.length?`${done}/${required.length}`:item.status}</b><small>{required.length?"tasks":"current state"}</small>{required.length>0&&<Progress value={done} max={required.length}/>}</div><i>⌄</i></summary><div className="project-body">{item.decision&&<DecisionCard item={item} data={data} update={update}/>}<div className="task-list">{required.map(child=><WorkItem key={child.id} item={child} all={all} data={data} update={update} edit={edit}/>)}</div>{optional.length>0&&<details className="optional-group"><summary><span>Optional</span><b>{optional.length} linked {optional.length===1?"task":"tasks"}</b><i>⌄</i></summary><div>{optional.map(child=><WorkItem key={child.id} item={child} all={all} data={data} update={update} edit={edit}/>)}</div></details>}<button className="edit-project" onClick={()=>edit(item)}>Edit project details →</button></div></details>;
}

function DecisionCard({item,data,update}:{item:MoveItem;data:MoveData;update:(data:MoveData)=>void}){
  if(!item.decision)return null;
  const select=(selected:string)=>update({...data,items:data.items.map(candidate=>candidate.id===item.id?{...candidate,decision:{...item.decision!,selected},updatedAt:isoToday()}:candidate)});
  return <div className="decision-card"><small>DECISION INSIDE THIS PROJECT</small><b>{item.decision.prompt}</b><div>{item.decision.options.map(option=><button key={option} className={item.decision?.selected===option?"active":""} onClick={()=>select(option)}>{option}</button>)}</div></div>;
}

function TaskRow({item,all,check,edit,compact=false}:{item:MoveItem;all:MoveItem[];check:()=>void;edit:()=>void;compact?:boolean}){
  const waiting=blocker(item,all);
  const meta=[surfaceArea(item),item.dueDate&&formatDate(item.dueDate),waiting||item.blocker,item.status==="In Progress"?"In progress":null,item.optional?"Optional":null].filter(Boolean).join(" · ");
  return <div className={`task-row ${compact?"compact":""} ${isDone(item)?"done":""} ${waiting||item.status==="Blocked"?"blocked":""}`}><button className="task-check" onClick={check} aria-label={isDone(item)?`Mark ${item.title} not done`:`Complete ${item.title}`}>{isDone(item)?"✓":""}</button><button className="task-main" onClick={edit}><b>{item.title}</b><small>{meta}</small></button><button className="task-open" onClick={edit} aria-label={`Open ${item.title}`}>→</button></div>;
}

function MoveFundPage({data,update,back}:{data:MoveData;update:(data:MoveData)=>void;back:()=>void}){
  return <div className="page standalone-tool"><button className="back-link" onClick={back}>← Pre-Move</button><header><p className="kicker">MOVE FUND</p><h1>Keep the landing financially gentle.</h1><p>One current balance, one working target, and the cost buckets that explain the number.</p></header><MoveMoney data={data} update={update} expanded/></div>;
}

function JobSearchPage({data,update,back}:{data:MoveData;update:(data:MoveData)=>void;back:()=>void}){
  return <div className="page standalone-tool"><button className="back-link" onClick={back}>← Pre-Move</button><header><p className="kicker">JOB SEARCH</p><h1>Keep the active route clear.</h1><p>Remote and Chicago work can move in parallel without giving every possibility equal attention.</p></header><EmploymentRoutes data={data} update={update} expanded/></div>;
}

function MoveMoney({data,update,expanded=false}:{data:MoveData;update:(data:MoveData)=>void;expanded?:boolean}){
  const target=data.moveFund.workingTarget||data.money.reduce((sum,bucket)=>sum+bucket.target,0);
  return <details className="special-tool money-tool" open={expanded||undefined}><summary><div><small>MOVE FUND</small><h3>{money(data.moveFund.current)} <span>saved</span></h3></div><div><b>{target?money(Math.max(0,target-data.moveFund.current)):"Set a target"}</b><small>{target?"remaining":"when ready"}</small></div><i>⌄</i></summary><div className="money-body"><Progress value={data.moveFund.current} max={target}/><div className="money-total-fields"><label>Current<input type="number" min="0" value={data.moveFund.current} onChange={event=>update({...data,moveFund:{...data.moveFund,current:Number(event.target.value)||0}})}/></label><label>Working target<input type="number" min="0" value={data.moveFund.workingTarget} onChange={event=>update({...data,moveFund:{...data.moveFund,workingTarget:Number(event.target.value)||0}})}/></label></div><div className="bucket-grid">{data.money.map(bucket=><label key={bucket.id}><span>{bucket.label}</span><input aria-label={`${bucket.label} target`} type="number" min="0" value={bucket.target} onChange={event=>update({...data,money:data.money.map(candidate=>candidate.id===bucket.id?{...candidate,target:Number(event.target.value)||0}:candidate)})}/><small>{bucket.included}</small></label>)}</div></div></details>;
}

function EmploymentRoutes({data,update,expanded=false}:{data:MoveData;update:(data:MoveData)=>void;expanded?:boolean}){
  const active=data.routes.find(route=>route.active);
  return <details className="special-tool route-tool" open={expanded||undefined}><summary><div><small>JOB SEARCH ROUTES</small><h3>{active?.name||"Choose an active route"}</h3></div><i>⌄</i></summary><div className="route-list">{data.routes.map(route=><button key={route.id} className={route.active?"active":""} onClick={()=>update({...data,routes:data.routes.map(candidate=>({...candidate,active:candidate.id===route.id}))})}><span>{route.active?"●":"○"}</span><div><b>{route.name}</b><small>{route.status}</small></div></button>)}</div>{active&&<div className="active-route-details"><small>WHAT THIS ROUTE NEEDS</small><ul>{active.details.map(detail=><li key={detail}>{detail}</li>)}</ul></div>}</details>;
}
function ReflectionShelf({data,update}:{data:MoveData;update:(data:MoveData)=>void}){return <section className="reflection-shelf"><header><p className="kicker">PERSONAL COMPASS</p><h2>What this move is making room for</h2><p>These are reflections, not tasks. They never affect completion.</p></header><div>{data.reflections.map(reflection=><label key={reflection.id}><span>{reflection.prompt}</span><textarea value={reflection.value} onChange={event=>update({...data,reflections:data.reflections.map(candidate=>candidate.id===reflection.id?{...candidate,value:event.target.value}:candidate)})}/></label>)}</div></section>}
function Empty({copy}:{copy:string}){return <div className="empty-state"><span>○</span><p>{copy}</p></div>}

function Search({data,close,edit,go}:{data:MoveData;close:()=>void;edit:(item:MoveItem)=>void;go:(page:Page)=>void}){
  const [query,setQuery]=useState("");
  const normalized=query.trim().toLowerCase();
  const itemResults=normalized?data.items.filter(item=>[item.title,item.description,item.notes,item.workArea].some(value=>value?.toLowerCase().includes(normalized))).slice(0,10):recommendations(data.items,6);
  const apartments=normalized?data.apartments.filter(home=>[home.name,home.city,home.neighborhood,home.notes].some(value=>value.toLowerCase().includes(normalized))).slice(0,4):[];
  const refs=normalized?data.vault.filter(entry=>[entry.title,entry.notes,entry.category].some(value=>value.toLowerCase().includes(normalized))).slice(0,4):[];
  const context=normalized?[...data.decisions.map(item=>({...item,resultType:"Decision",copy:item.selected})),...data.assumptions.map(item=>({...item,resultType:"Assumption",copy:item.value})),...data.watches.map(item=>({...item,resultType:"Watch",copy:item.reason}))].filter(item=>`${item.title} ${item.copy}`.toLowerCase().includes(normalized)).slice(0,6):[];
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&close()}><section className="search-dialog" role="dialog" aria-modal="true"><header><span>⌕</span><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search the whole move…"/><button onClick={close}>×</button></header><div className="search-results"><small>{normalized?"RESULTS":"SUGGESTED NEXT ACTIONS"}</small>{itemResults.map(item=><button key={item.id} onClick={()=>edit(item)}><span>{item.type==="Goal"?"◎":item.type==="Project"?"◇":"○"}</span><div><b>{item.title}</b><small>{item.type} · {item.workArea}</small></div><i>→</i></button>)}{context.map(item=><button key={item.id} onClick={()=>go("References")}><span>·</span><div><b>{item.title}</b><small>{item.resultType} · {item.copy}</small></div><i>→</i></button>)}{apartments.map(home=><button key={home.id} onClick={()=>go("Apartments")}><span>⌂</span><div><b>{home.name}</b><small>{home.neighborhood} · {home.city}</small></div><i>→</i></button>)}{refs.map(entry=><button key={entry.id} onClick={()=>go("References")}><span>↗</span><div><b>{entry.title}</b><small>Reference · {entry.category}</small></div><i>→</i></button>)}{normalized&&!itemResults.length&&!apartments.length&&!refs.length&&!context.length&&<Empty copy="No matching move information found."/>}</div></section></div>;
}

function ApartmentMatrix({data,update,back}:{data:MoveData;update:(data:MoveData)=>void;back:()=>void}){
  const [editing,setEditing]=useState<ApartmentListing|null>(null);
  const newHome=():ApartmentListing=>({id:crypto.randomUUID(),name:"",city:"Chicago",neighborhood:"",url:"",housingType:"Standard lease",monthlyRent:0,bedrooms:"",qualities:"",incomeRequirement:"",minimumCredit:625,applicationFee:0,deposit:0,petCost:0,parkingCost:0,otherMoveInCosts:0,moveInSpecial:"",specialSavings:0,status:"Considering",notes:""});
  const entryCost=(home:ApartmentListing)=>Math.max(0,home.monthlyRent+home.applicationFee+home.deposit+home.petCost+home.parkingCost+home.otherMoveInCosts-home.specialSavings);
  const save=(home:ApartmentListing)=>{update({...data,apartments:data.apartments.some(candidate=>candidate.id===home.id)?data.apartments.map(candidate=>candidate.id===home.id?home:candidate):[...data.apartments,home]});setEditing(null)};
  return <div className="page apartment-page"><button className="back-link" onClick={back}>← Pre-Move / Housing</button><section className="tool-heading"><div><p className="kicker">APARTMENT SEARCH</p><h1>Compare the homes, not the noise.</h1><p>Chicago first. Denver remains available only when the evidence makes it useful.</p></div><Button kind="primary" onClick={()=>setEditing(newHome())}>＋ Add a home</Button></section><section className="approval-note"><span>THE APPROVAL PICTURE</span><b>Income evidence <i>＋</i> a 625+ credit path</b><p>Record what each property actually requires. A sublet or verified special may change the picture.</p></section>{data.apartments.length?<div className="apartment-cards">{data.apartments.map(home=><article key={home.id} className={home.status==="Passed"?"passed":""}><header><div><small>{home.city} · {home.housingType}</small><h2>{home.name||"Untitled home"}</h2><p>{home.neighborhood||"Neighborhood not noted"}</p></div><span>{home.status}</span></header><div className="apartment-numbers"><div><small>MONTHLY RENT</small><b>{money(home.monthlyRent)}</b></div><div><small>EST. CASH TO ENTER</small><b>{money(entryCost(home))}</b></div></div><dl><div><dt>Income</dt><dd>{home.incomeRequirement||"Need the real rule"}</dd></div><div><dt>Credit</dt><dd>{home.minimumCredit?`${home.minimumCredit}+ noted`:"Need the real rule"}</dd></div><div><dt>Special</dt><dd>{home.moveInSpecial||"None confirmed"}</dd></div></dl><p className="home-fit">{home.qualities||"Add how this home fits location, light, space, Marvel, and daily life."}</p><button onClick={()=>setEditing(home)}>Edit comparison →</button></article>)}</div>:<Empty copy="No homes saved yet. Add real candidates when you find them—no placeholder assumptions."/>}{editing&&<ApartmentEditor home={editing} save={save} close={()=>setEditing(null)} remove={()=>{update({...data,apartments:data.apartments.filter(home=>home.id!==editing.id)});setEditing(null)}}/>}</div>;
}

function ApartmentEditor({home,save,close,remove}:{home:ApartmentListing;save:(home:ApartmentListing)=>void;close:()=>void;remove:()=>void}){
  const [draft,setDraft]=useState(home);const number=(key:keyof ApartmentListing,value:string)=>setDraft({...draft,[key]:Number(value)||0});const statuses:ApartmentStatus[]=["Considering","Researching","Touring","Applied","Top choice","Passed","Lease signed"];
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&close()}><form className="modal" onSubmit={event=>{event.preventDefault();save(draft)}}><header className="modal-head"><div><small>HOME CANDIDATE</small><h2>{draft.name||"Add a home"}</h2></div><button type="button" onClick={close}>×</button></header><div className="form-grid"><Field label="Name"><input required value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></Field><Field label="Listing link"><input type="url" value={draft.url} onChange={event=>setDraft({...draft,url:event.target.value})}/></Field><Field label="City"><select value={draft.city} onChange={event=>setDraft({...draft,city:event.target.value as ApartmentListing["city"]})}><option>Chicago</option><option>Denver</option><option>Other</option></select></Field><Field label="Neighborhood"><input value={draft.neighborhood} onChange={event=>setDraft({...draft,neighborhood:event.target.value})}/></Field><Field label="Housing route"><select value={draft.housingType} onChange={event=>setDraft({...draft,housingType:event.target.value as HousingType})}><option>Standard lease</option><option>Sublet</option></select></Field><Field label="Status"><select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as ApartmentStatus})}>{statuses.map(status=><option key={status}>{status}</option>)}</select></Field><Field label="Monthly rent"><input type="number" min="0" value={draft.monthlyRent} onChange={event=>number("monthlyRent",event.target.value)}/></Field><Field label="Bedrooms / layout"><input value={draft.bedrooms} onChange={event=>setDraft({...draft,bedrooms:event.target.value})}/></Field><Field label="Income requirement"><input value={draft.incomeRequirement} onChange={event=>setDraft({...draft,incomeRequirement:event.target.value})}/></Field><Field label="Minimum credit"><input type="number" min="0" value={draft.minimumCredit||0} onChange={event=>number("minimumCredit",event.target.value)}/></Field></div><Field label="How it fits"><textarea value={draft.qualities} placeholder="Location, light, space, Marvel, parking, community…" onChange={event=>setDraft({...draft,qualities:event.target.value})}/></Field><details className="advanced-fields" open><summary>Move-in costs</summary><div className="form-grid three">{([['applicationFee','Application fee'],['deposit','Deposit'],['petCost','Pet cost'],['parkingCost','Parking'],['otherMoveInCosts','Other costs'],['specialSavings','Verified special value']] as [keyof ApartmentListing,string][]).map(([key,label])=><Field key={key} label={label}><input type="number" min="0" value={Number(draft[key])||0} onChange={event=>number(key,event.target.value)}/></Field>)}</div></details><Field label="Move-in special"><input value={draft.moveInSpecial} onChange={event=>setDraft({...draft,moveInSpecial:event.target.value})}/></Field><Field label="Notes"><textarea value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})}/></Field><footer className="modal-actions">{home.name&&<button type="button" className="delete" onClick={remove}>Remove</button>}<span/><Button onClick={close}>Cancel</Button><Button type="submit" kind="primary">Save home</Button></footer></form></div>;
}

function ReferencesPage({data,update,edit}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void}){
  const [draft,setDraft]=useState<VaultEntry|null>(null);const context=data.items.filter(supporting);
  return <div className="page references-page"><section className="tool-heading"><div><p className="kicker">REFERENCES & MEMORY</p><h1>Helpful context, kept out of the task list.</h1><p>Decisions, working assumptions, watches, rules, links, and reflections live here without becoming more work.</p></div><Button kind="primary" onClick={()=>setDraft({id:crypto.randomUUID(),title:"",category:"Notes",url:"",date:isoToday(),notes:""})}>＋ Add a reference</Button></section><div className="reference-grid">{data.decisions.map(item=><article key={item.id} className="memory-reference"><span>DECIDED</span><h2>{item.title}</h2><p>{item.selected}</p><small>{item.reason}</small></article>)}{data.assumptions.map(item=><article key={item.id} className="memory-reference"><span>{item.confidence.toUpperCase()} ASSUMPTION</span><h2>{item.title}</h2><p>{item.value}</p><small>{item.notes}</small></article>)}{data.watches.map(item=><article key={item.id} className="memory-reference"><span>{item.state.toUpperCase()}</span><h2>{item.title}</h2><p>{item.reason}</p></article>)}{context.map(item=><button key={item.id} onClick={()=>edit(item)}><span>{item.kind==="Reflection"?"REFLECTION":"HELPFUL NOTE"}</span><h2>{item.title}</h2><p>{item.description}</p>{item.referenceFor?.length?<small>Attached to {item.referenceFor.length} {item.referenceFor.length===1?"item":"items"}</small>:null}</button>)}{data.vault.map(entry=><article key={entry.id}><span>{entry.category.toUpperCase()}</span><h2>{entry.title}</h2><p>{entry.notes}</p><div>{entry.url&&entry.url!=="#"?<a href={entry.url} target="_blank" rel="noreferrer">Open ↗</a>:<span/>}<button onClick={()=>update({...data,vault:data.vault.filter(candidate=>candidate.id!==entry.id)})}>Remove</button></div></article>)}</div>{draft&&<div className="overlay"><form className="modal compact-modal" onSubmit={event=>{event.preventDefault();update({...data,vault:[...data.vault,draft]});setDraft(null)}}><header className="modal-head"><div><small>REFERENCE</small><h2>Add helpful context</h2></div><button type="button" onClick={()=>setDraft(null)}>×</button></header><Field label="Title"><input required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field><Field label="Category"><input value={draft.category} onChange={event=>setDraft({...draft,category:event.target.value})}/></Field><Field label="Link"><input type="url" value={draft.url} onChange={event=>setDraft({...draft,url:event.target.value})}/></Field><Field label="Notes"><textarea value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})}/></Field><footer className="modal-actions"><span/><Button onClick={()=>setDraft(null)}>Cancel</Button><Button kind="primary" type="submit">Save</Button></footer></form></div>}</div>;
}

function SettingsPage({data,update,dark,setDark,sync}:{data:MoveData;update:(data:MoveData)=>void;dark:boolean;setDark:(value:boolean)=>void;sync:SyncState}){
  const [endpoint,setEndpoint]=useState(getSheetEndpoint());const file=useRef<HTMLInputElement>(null);const exportData=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="move-os-export.json";link.click();URL.revokeObjectURL(link.href)};
  return <div className="page settings-page"><p className="kicker">SETTINGS</p><h1>Keep the plan personal and portable.</h1><div className="settings-grid"><section><h2>Move profile</h2><Field label="Destination"><input value={data.profile.destination} onChange={event=>update({...data,profile:{...data.profile,destination:event.target.value}})}/></Field><div className="form-grid"><Field label="Target Move Day"><input type="date" value={data.profile.targetMoveDate} onChange={event=>update({...data,profile:{...data.profile,targetMoveDate:event.target.value}})}/></Field><Field label="Backup date"><input type="date" value={data.profile.backupDate} onChange={event=>update({...data,profile:{...data.profile,backupDate:event.target.value}})}/></Field></div><Field label="Why I am moving"><textarea value={data.profile.reason} onChange={event=>update({...data,profile:{...data.profile,reason:event.target.value}})}/></Field></section><section><h2>Appearance & visibility</h2><label className="switch"><div><b>Dark mode</b><small>A lower-light palette for evenings.</small></div><input type="checkbox" checked={dark} onChange={event=>setDark(event.target.checked)}/></label><label className="switch"><div><b>Hide completed tasks</b><small>Done work stays in History without competing for attention.</small></div><input type="checkbox" checked={data.hideCompleted} onChange={event=>update({...data,hideCompleted:event.target.checked})}/></label></section><section><h2>Move Action Items sync</h2><div className={`sync-state ${sync.mode}`}><span>{sync.mode==="sheet"?"✓":sync.mode==="offline"?"!":"○"}</span><div><b>{sync.label}</b><small>{sync.pending?"A browser copy is protecting your changes.":sync.lastSyncedAt?`Last saved ${new Date(sync.lastSyncedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`:"No remote Sheet configured."}</small></div></div><Field label="Google Apps Script sync URL"><input value={endpoint} placeholder="Optional — paste the deployed web app URL" onChange={event=>setEndpoint(event.target.value)}/></Field><p className="setting-note">The repository is ready to use <b>Move Action Items</b> as its source. Until a Sheet endpoint is connected, changes remain safely in this browser.</p><Button onClick={()=>{setSheetEndpoint(endpoint);window.location.reload()}}>Save connection & reload</Button></section><section><h2>Backup</h2><p className="setting-note">Export a complete portable copy, or restore one you saved earlier.</p><div className="data-actions"><Button kind="primary" onClick={exportData}>Export JSON</Button><Button onClick={()=>file.current?.click()}>Import JSON</Button><input ref={file} hidden type="file" accept="application/json" onChange={event=>{const selected=event.target.files?.[0];if(selected)selected.text().then(text=>update(JSON.parse(text) as MoveData))}}/></div></section></div></div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}

function ItemEditorLegacy({item,all,onClose,onSave,onDelete,onOpen}:{item:MoveItem;all:MoveItem[];onClose:()=>void;onSave:(item:MoveItem)=>void;onDelete?:()=>void;onOpen:(item:MoveItem)=>void}){
  const [draft,setDraft]=useState(item);const areas=phaseAreas(draft.phase);const refs=all.filter(candidate=>supporting(candidate)&&candidate.referenceFor?.includes(draft.id));const children=all.filter(candidate=>candidate.parentId===draft.id&&isWorkItem(candidate));
  const changePhase=(phase:MovePhase)=>setDraft({...draft,phase,workArea:phaseAreas(phase)[0]});
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><form className={`modal item-editor type-${draft.type.toLowerCase()}`} onSubmit={event=>{event.preventDefault();onSave({...draft,updatedAt:isoToday(),completedAt:draft.status==="Done"?(draft.completedAt||new Date().toISOString()):undefined})}}><header className="modal-head"><div><small>{draft.type.toUpperCase()}</small><h2>{item.title?`Edit ${draft.type.toLowerCase()}`:`Add a ${draft.type.toLowerCase()}`}</h2></div><button type="button" onClick={onClose}>×</button></header><section className="editor-primary"><Field label={draft.type==="Task"?"What can you sit down and complete?":draft.type==="Project"?"What body of work are you organizing?":"What outcome are you moving toward?"}><input autoFocus required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field><Field label={draft.type==="Task"?"What does done look like?":"Helpful context"}><textarea value={draft.description} onChange={event=>setDraft({...draft,description:event.target.value})}/></Field></section><div className="form-grid three"><Field label="Type"><select value={draft.type} onChange={event=>setDraft({...draft,type:event.target.value as ItemType})}><option>Task</option><option>Project</option><option>Goal</option></select></Field><Field label="Phase"><select value={draft.phase} onChange={event=>changePhase(event.target.value as MovePhase)}><option>Pre-Move</option><option>Post-Move</option></select></Field><Field label="Area"><select value={draft.workArea} onChange={event=>setDraft({...draft,workArea:event.target.value as WorkArea})}>{areas.map(area=><option key={area}>{area}</option>)}</select></Field></div>{draft.type==="Task"&&<div className="form-grid three"><Field label="Status"><select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as Status})}>{statuses.map(status=><option key={status}>{status}</option>)}</select></Field><Field label="Due date"><input type="date" value={draft.dueDate||""} onChange={event=>setDraft({...draft,dueDate:event.target.value||undefined})}/></Field><Field label="When"><select value={draft.schedule||"Later"} onChange={event=>setDraft({...draft,schedule:event.target.value as Schedule})}>{schedules.filter(value=>draft.phase==="Pre-Move"?!["First 72 Hours","First Week","First Month"].includes(value):!["Now","This Week"].includes(value)).map(value=><option key={value}>{value}</option>)}</select></Field></div>}{draft.type==="Goal"&&<section className="metric-editor"><small>OPTIONAL PROGRESS MEASURE</small><div className="form-grid three"><Field label="Current"><input type="number" value={draft.metric?.current??""} onChange={event=>setDraft({...draft,metric:{...draft.metric,current:event.target.value===""?undefined:Number(event.target.value)}})}/></Field><Field label="Target"><input type="number" value={draft.metric?.target??""} onChange={event=>setDraft({...draft,metric:{...draft.metric,target:event.target.value===""?undefined:Number(event.target.value)}})}/></Field><Field label="Unit"><input value={draft.metric?.unit||""} placeholder="dollars, boxes…" onChange={event=>setDraft({...draft,metric:{...draft.metric,unit:event.target.value}})}/></Field></div></section>}<details className="advanced-fields"><summary>More options <span>Parent, blocker, importance, and notes</span></summary><Field label="Part of"><select value={draft.parentId||""} onChange={event=>setDraft({...draft,parentId:event.target.value||undefined})}><option value="">No parent</option>{all.filter(candidate=>candidate.id!==draft.id&&isWorkItem(candidate)&&candidate.type!=="Task"&&candidate.phase===draft.phase).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></Field><Field label="Depends on"><select value={draft.dependency||""} onChange={event=>setDraft({...draft,dependency:event.target.value||undefined})}><option value="">Nothing</option>{all.filter(candidate=>candidate.id!==draft.id&&isWorkItem(candidate)).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></Field><Field label="Blocker in plain language"><input value={draft.blocker||""} placeholder="Example: Waiting for signed lease" onChange={event=>setDraft({...draft,blocker:event.target.value||undefined})}/></Field><div className="form-grid"><Field label="Importance"><select value={draft.importance} onChange={event=>setDraft({...draft,importance:event.target.value as MoveItem["importance"]})}><option>Normal</option><option>Important</option></select></Field><label className="switch compact"><div><b>Optional</b><small>Does not count toward required progress.</small></div><input type="checkbox" checked={!!draft.optional} onChange={event=>setDraft({...draft,optional:event.target.checked})}/></label></div><Field label="Notes"><textarea value={draft.notes||""} onChange={event=>setDraft({...draft,notes:event.target.value})}/></Field></details>{refs.length>0&&<section className="attached-context"><small>HELPFUL CONTEXT ATTACHED</small>{refs.map(reference=><button type="button" key={reference.id} onClick={()=>onOpen(reference)}><b>{reference.title}</b><span>→</span></button>)}</section>}{children.length>0&&<section className="editor-children"><small>{draft.type==="Goal"?"WORK INSIDE THIS GOAL":"TASKS INSIDE THIS PROJECT"}</small>{children.map(child=><button type="button" key={child.id} onClick={()=>onOpen(child)}><span>{child.type==="Task"?(isDone(child)?"✓":"○"):"◇"}</span><b>{child.title}</b><i>→</i></button>)}</section>}<footer className="modal-actions">{onDelete&&<button type="button" className="delete" onClick={onDelete}>Delete</button>}<span/><Button onClick={onClose}>Cancel</Button><Button type="submit" kind="primary">Save</Button></footer></form></div>;
}

function ItemEditor({item,all,onClose,onSave,onDelete,onOpen}:{item:MoveItem;all:MoveItem[];onClose:()=>void;onSave:(item:MoveItem)=>void;onDelete?:()=>void;onOpen:(item:MoveItem)=>void}){
  const [draft,setDraft]=useState(item);
  const areas=phaseAreas(draft.phase);
  const refs=all.filter(candidate=>supporting(candidate)&&candidate.referenceFor?.includes(draft.id));
  const children=all.filter(candidate=>candidate.parentId===draft.id&&isWorkItem(candidate));
  const changePhase=(phase:MovePhase)=>setDraft({...draft,phase,workArea:phaseAreas(phase)[0]});
  const save=(event:React.FormEvent)=>{event.preventDefault();onSave({...draft,updatedAt:isoToday(),completedAt:draft.status==="Done"?(draft.completedAt||new Date().toISOString()):undefined})};
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><form className={`modal item-editor simple-editor type-${draft.type.toLowerCase()}`} onSubmit={save}>
    <header className="modal-head"><div><small>{draft.type.toUpperCase()}</small><h2>{item.title?`Edit ${draft.type.toLowerCase()}`:`Add a ${draft.type.toLowerCase()}`}</h2></div><button type="button" onClick={onClose}>×</button></header>
    <section className="editor-quick"><Field label={draft.type==="Task"?"What needs doing?":draft.type==="Project"?"Project name":"Goal name"}><input autoFocus required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field><div className="form-grid three"><Field label="Area"><select value={draft.workArea} onChange={event=>setDraft({...draft,workArea:event.target.value as WorkArea})}>{areas.map(area=><option key={area}>{area}</option>)}</select></Field>{draft.type==="Task"&&<Field label="Due date"><input type="date" value={draft.dueDate||""} onChange={event=>setDraft({...draft,dueDate:event.target.value||undefined})}/></Field>}<Field label="Status"><select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as Status})}>{statuses.map(status=><option key={status}>{status}</option>)}</select></Field></div></section>
    <details className="advanced-fields"><summary>More options <span>Description, organization, blocker, and notes</span></summary><Field label="Description"><textarea value={draft.description} placeholder="Useful context or what done looks like…" onChange={event=>setDraft({...draft,description:event.target.value})}/></Field><div className="form-grid three"><Field label="Type"><select value={draft.type} onChange={event=>setDraft({...draft,type:event.target.value as ItemType})}><option>Task</option><option>Project</option><option>Goal</option></select></Field><Field label="Phase"><select value={draft.phase} onChange={event=>changePhase(event.target.value as MovePhase)}><option>Pre-Move</option><option>Post-Move</option></select></Field>{draft.type==="Task"&&<Field label="When"><select value={draft.schedule||"Later"} onChange={event=>setDraft({...draft,schedule:event.target.value as Schedule})}>{schedules.filter(value=>draft.phase==="Pre-Move"?!["First 72 Hours","First Week","First Month"].includes(value):!["Now","This Week"].includes(value)).map(value=><option key={value}>{value}</option>)}</select></Field>}</div><Field label="Part of"><select value={draft.parentId||""} onChange={event=>setDraft({...draft,parentId:event.target.value||undefined})}><option value="">No parent</option>{all.filter(candidate=>candidate.id!==draft.id&&isWorkItem(candidate)&&candidate.type!=="Task"&&candidate.phase===draft.phase).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></Field><Field label="Depends on"><select value={draft.dependency||""} onChange={event=>setDraft({...draft,dependency:event.target.value||undefined})}><option value="">Nothing</option>{all.filter(candidate=>candidate.id!==draft.id&&isWorkItem(candidate)).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></Field><Field label="Blocker in plain language"><input value={draft.blocker||""} placeholder="Example: Needs a signed lease" onChange={event=>setDraft({...draft,blocker:event.target.value||undefined})}/></Field><div className="form-grid"><Field label="Importance"><select value={draft.importance} onChange={event=>setDraft({...draft,importance:event.target.value as MoveItem["importance"]})}><option>Normal</option><option>Important</option></select></Field><label className="switch compact"><div><b>Optional</b><small>Hidden from the focused plan.</small></div><input type="checkbox" checked={!!draft.optional} onChange={event=>setDraft({...draft,optional:event.target.checked})}/></label></div><Field label="Notes"><textarea value={draft.notes||""} onChange={event=>setDraft({...draft,notes:event.target.value})}/></Field>{draft.type==="Goal"&&<section className="metric-editor"><small>OPTIONAL PROGRESS MEASURE</small><div className="form-grid three"><Field label="Current"><input type="number" value={draft.metric?.current??""} onChange={event=>setDraft({...draft,metric:{...draft.metric,current:event.target.value===""?undefined:Number(event.target.value)}})}/></Field><Field label="Target"><input type="number" value={draft.metric?.target??""} onChange={event=>setDraft({...draft,metric:{...draft.metric,target:event.target.value===""?undefined:Number(event.target.value)}})}/></Field><Field label="Unit"><input value={draft.metric?.unit||""} onChange={event=>setDraft({...draft,metric:{...draft.metric,unit:event.target.value}})}/></Field></div></section>}</details>
    {refs.length>0&&<section className="attached-context"><small>HELPFUL CONTEXT</small>{refs.map(reference=><button type="button" key={reference.id} onClick={()=>onOpen(reference)}><b>{reference.title}</b><span>→</span></button>)}</section>}
    {children.length>0&&<section className="editor-children"><small>{draft.type==="Goal"?"RELATED WORK":"TASKS IN THIS PROJECT"}</small>{children.map(child=><button type="button" key={child.id} onClick={()=>onOpen(child)}><span>{child.type==="Task"?(isDone(child)?"✓":"○"):"◇"}</span><b>{child.title}</b><i>→</i></button>)}</section>}
    <footer className="modal-actions">{onDelete&&<button type="button" className="delete" onClick={onDelete}>Delete</button>}<span/><Button onClick={onClose}>Cancel</Button><Button type="submit" kind="primary">Save</Button></footer>
  </form></div>;
}
