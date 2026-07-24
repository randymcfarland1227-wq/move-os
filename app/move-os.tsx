"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Area, MoveData, MoveItem, Status, Timing, VaultEntry } from "./types";
import { moveRepository } from "./repository";
import { blocker, isDone, recommendations } from "./priorities";

type Page = "Today" | "Clear" | "Build" | "Become" | "Vault" | "Settings";
const pages: {name:Page; icon:string}[] = [
  {name:"Today",icon:"⌂"},{name:"Clear",icon:"↗"},{name:"Build",icon:"◇"},
  {name:"Become",icon:"✦"},{name:"Vault",icon:"□"},{name:"Settings",icon:"○"},
];
const sectionCopy: Record<string,string> = {
  "Money, Credit and Old Obligations":"Prevent new damage and make the old things finite.",
  "Car, Documents and Responsibilities":"Safety, reliability, records, and loose ends.",
  "Family: What I Can Help With":"Offer love with a clear edge around your role.",
  "Closure Before I Leave":"Honor what mattered without forcing an ending.",
  "Allowed to Wait":"Important is not the same as move-blocking.",
  "Post-Move Income":"The first hinge in the move plan.",
  "Rental Readiness":"Know what a landlord will need before the search begins.",
  "Housing and Lease":"Explore lightly now. Act seriously when readiness is secure.",
  "Land Softly":"Prepare the future so arrival has room to breathe.",
  "Physical Move":"Logistics begin when there is a real address.",
};
const areaSections: Record<Area,string[]> = {
  Clear:["Money, Credit and Old Obligations","Car, Documents and Responsibilities","Family: What I Can Help With","Closure Before I Leave","Allowed to Wait"],
  Build:["Timeline","Move Money","Post-Move Income","Rental Readiness","Housing and Lease","Land Softly","Physical Move"],
  Become:["My Fuel Source","The Life I Want","People and Relationships","Spiritual Preparation","Community and Belonging","Flowering Period: First 30 Days"],
  Vault:[],
};
const statuses:Status[] = ["Not started","In motion","Waiting","Blocked","Good enough","Secure","Settled","Carry forward","Released"];
const timings:Timing[] = ["Now","Prepare early","After the lease","First 72 hours","After arrival","Allowed to wait"];

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
    <section className="unlock"><div className="unlock-mark">↗</div><div><span>CURRENT UNLOCK</span><h2>{data.profile.currentUnlock}</h2><p>This answer makes income—and the housing plan behind it—more trustworthy.</p></div><Button kind="ink" onClick={()=>edit(data.items.find(i=>i.id==="remote-policy")!)}>Continue <b>→</b></Button></section>
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
  return <article className={`action-card ${colors[item.area]}`}><div className="card-top"><span>{item.area.toUpperCase()}</span><i>0{number}</i></div><h3>{item.title}</h3><p>{item.description}</p><div className="card-bottom"><button onClick={()=>update({...data,items:data.items.map(i=>i.id===item.id?{...i,status:"Settled",updatedAt:new Date().toISOString().slice(0,10)}:i)})} aria-label={`Settle ${item.title}`}>○</button><button onClick={()=>edit(item)}>Open <b>→</b></button></div></article>;
}

function AreaPage({area,data,update,edit}:{area:Area;data:MoveData;update:(d:MoveData)=>void;edit:(i:MoveItem)=>void}) {
  const intro={
    Clear:["Clear what’s unfinished.","Make responsibility finite. Leave with love, not an impossible burden."],
    Build:["Build the way there.","A dependency-aware path from income to a signed lease—and a soft landing."],
    Become:["Keep the future alive.","This is not a scorecard. It’s a place to remember who you’re becoming."],
    Vault:["",""],
  }[area];
  const add=(section:string)=>edit({id:crypto.randomUUID(),title:"",description:"",area,section,status:"Not started",priority:"Relief",timing:"Now",createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10)});
  return <div className="page area-page">
    <p className="eyebrow">{area==="Build"?"THE PRACTICAL FOUNDATION":area==="Clear"?"CURRENT CHAPTER":"THE LIFE AHEAD"}</p><h1>{intro[0]}</h1><p className="lede">{intro[1]}</p>
    {area==="Clear" && <blockquote className="grounding">I want to leave with love and responsibility, but I do not need to solve every problem before I am allowed to move forward.</blockquote>}
    {area==="Build" && <DependencyChain/>}
    {area==="Become" && <Fuel data={data} update={update}/>}
    {areaSections[area].filter(section=>!(area==="Become"&&section==="My Fuel Source")).map((section,index)=>{
      if(area==="Build"&&section==="Timeline") return <Timeline key={section} data={data} update={update}/>;
      if(area==="Build"&&section==="Move Money") return <Money key={section} data={data} update={update}/>;
      if(area==="Build"&&section==="Post-Move Income") return <Routes key={section} data={data} update={update}/>;
      if(area==="Become"&&section==="Flowering Period: First 30 Days") return <Flowering key={section} data={data} update={update}/>;
      const items=data.items.filter(i=>i.area===area&&i.section===section);
      const locked=section==="Physical Move" && !data.items.some(i=>i.id==="lease"&&isDone(i));
      return <details className={`section-card ${locked?"locked":""}`} key={section} open={index<2&&!locked}>
        <summary><div><span>{locked?"LOCKED UNTIL LEASE":"0"+(index+1)}</span><h2>{section}</h2><p>{sectionCopy[section] || reflectiveCopy(section)}</p></div><i>⌄</i></summary>
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

function DependencyChain(){return <section className="dependency-chain"><span>POST-MOVE INCOME</span><b>→</b><span>HOUSING BUDGET</span><b>→</b><span>RENTAL READY</span><b>→</b><span>APARTMENT</span><b>→</b><span>LEASE</span><b>→</b><span>MOVE</span></section>}
function Timeline({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="feature-card timeline"><div><span>MOVE DAY</span><input type="date" value={data.profile.targetMoveDate} onChange={e=>update({...data,profile:{...data.profile,targetMoveDate:e.target.value}})}/></div><p>Suggested windows will anchor to this date. Serious logistics stay quiet until the lease is signed.</p><div className="timeline-track"><i/><i/><i/><i/><i/></div><div className="timeline-labels"><span>Income<br/><b>Now</b></span><span>Rental ready<br/><b>− 150 days</b></span><span>Search<br/><b>− 100 days</b></span><span>Lease<br/><b>− 60 days</b></span><span>Move<br/><b>{new Date(data.profile.targetMoveDate+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</b></span></div></section>}
function Money({data,update}:{data:MoveData;update:(d:MoveData)=>void}){const total=data.money.reduce((s,m)=>s+m.current,0),target=data.money.reduce((s,m)=>s+m.target,0);return <section className="feature-card money"><div className="money-head"><div><span>MOVE MONEY</span><h2>${total.toLocaleString()} <small>set aside</small></h2></div><div><small>WORKING TARGET</small><strong>${target.toLocaleString()}</strong></div></div><div className="calm-progress"><i style={{width:`${Math.min(100,total/target*100)}%`}}/></div><p className="money-note">A target is a planning tool, not a permission slip. Readiness also depends on income, housing costs, and what is still uncertain.</p><div className="money-grid">{data.money.map(bucket=><label key={bucket.id}><span>{bucket.label}</span><div>$ <input type="number" value={bucket.current} onChange={e=>update({...data,money:data.money.map(m=>m.id===bucket.id?{...m,current:+e.target.value}:m)})}/><small>/ ${bucket.target.toLocaleString()}</small></div>{bucket.uncertain&&<em>Uncertain: {bucket.uncertain}</em>}</label>)}</div></section>}
function Routes({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="routes"><div className="section-heading"><div><p className="eyebrow">POST-MOVE INCOME</p><h2>Choose the route you’re testing</h2></div><p>Only one route asks for your attention at a time.</p></div>{data.routes.map(route=><details key={route.id} className={`route ${route.active?"active":""}`} open={route.active}><summary><div className="route-number">{route.id.slice(1)}</div><div><small>{route.subtitle}</small><h3>{route.name}</h3><span>{route.status}</span></div><button onClick={e=>{e.preventDefault();update({...data,routes:data.routes.map(r=>({...r,active:r.id===route.id}))})}}>{route.active?"Active":"Activate"}</button></summary><ul>{route.details.map(d=><li key={d}>○ <span>{d}</span></li>)}</ul></details>)}</section>}
function Fuel({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="fuel"><p className="eyebrow">MY FUEL SOURCE</p><textarea aria-label="Personal statement" value={data.profile.reason} onChange={e=>update({...data,profile:{...data.profile,reason:e.target.value}})}/><div className="reflection-grid">{data.reflections.map(r=><label key={r.id}><span>{r.prompt}</span><textarea value={r.value} onChange={e=>update({...data,reflections:data.reflections.map(x=>x.id===r.id?{...x,value:e.target.value}:x)})}/></label>)}</div></section>}
function Flowering({data,update}:{data:MoveData;update:(d:MoveData)=>void}){return <section className="flowering"><div><p className="eyebrow">FIRST 30 DAYS</p><h2>Protect the flowering period.</h2><p>Safe home. Steady routines. One repeated connection. One reminder of why you moved.</p></div><label className="protect"><input type="checkbox" checked={data.profile.protectedMonth} onChange={e=>update({...data,profile:{...data.profile,protectedMonth:e.target.checked}})}/><span><b>Keep this month intentionally protected</b><small>Unnecessary commitments can wait.</small></span></label></section>}
function ItemRow({item,all,edit}:{item:MoveItem;all:MoveItem[];edit:(i:MoveItem)=>void}){const blocked=blocker(item,all);return <button className="item-row" onClick={()=>edit(item)}><span className={`status-dot ${isDone(item)?"done":""}`}>{isDone(item)?"✓":"○"}</span><span><b>{item.title}</b><small>{blocked || item.description || `${item.status} · ${item.timing}`}</small></span><em>{blocked?"Waiting":item.status}</em><i>→</i></button>}

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
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><form className="modal" onSubmit={e=>{e.preventDefault();onSave({...draft,updatedAt:new Date().toISOString().slice(0,10)})}}><div className="modal-head"><div><span>{draft.area} · {draft.section}</span><h2>{item.title?"Edit this piece":"Add something"}</h2></div><button type="button" onClick={onClose}>×</button></div><label>Title<input autoFocus required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>Description<textarea value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><div className="form-grid"><label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Timing<select value={draft.timing} onChange={e=>setDraft({...draft,timing:e.target.value as Timing})}>{timings.map(t=><option key={t}>{t}</option>)}</select></label></div><label>Depends on<select value={draft.dependency||""} onChange={e=>setDraft({...draft,dependency:e.target.value||undefined})}><option value="">Nothing — this can move now</option>{all.filter(i=>i.id!==draft.id).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select></label>{blocker(draft,all)&&<p className="blocker">This stays quiet for now: {blocker(draft,all)}.</p>}<label>Notes<textarea value={draft.notes||""} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><div className="modal-actions">{item.title&&<button type="button" className="delete" onClick={onDelete}>Delete</button>}<span/><Button onClick={onClose}>Cancel</Button><Button type="submit" kind="primary">Save</Button></div></form></div>;
}
