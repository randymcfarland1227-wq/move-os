"use client";

import type { MoveData, MoveItem } from "../../types";
import { lockedGroups, nowList } from "../../domain/plans";
import { TaskLine } from "../tasks/TaskLine";

/** Everything Randy can actually do right now. */
export function NowList({data,update,edit,openPreMove}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;openPreMove:()=>void}){
  const list=nowList(data);
  return <section className="home-block current-focus now-list">
    <header><div><h2>Now</h2><p>Things you can do today, without waiting on anything else.</p></div><button onClick={openPreMove}>All Pre-Move work →</button></header>
    <div className="focus-list">{list.map(item=><TaskLine key={item.id} item={item} data={data} update={update} edit={edit}/>)}{!list.length&&<p className="plan-empty">Nothing is doable right now. Keep working on the three goals.</p>}</div>
  </section>;
}

/** Locked work stays out of the way, folded, with what unlocks it. */
export function LockedList({data,edit}:{data:MoveData;edit:(item:MoveItem)=>void}){
  const groups=lockedGroups(data);
  const total=groups.reduce((sum,group)=>sum+group.items.length,0);
  if(!total) return null;
  return <details className="home-block locked-list">
    <summary><div><h2>Locked for now</h2><p>Not doable yet. Each one unlocks on its own.</p></div><span>{total} {total===1?"item":"items"}</span></summary>
    {groups.map(group=><div key={group.reason} className="locked-group"><h3>{group.reason}</h3><ul>{group.items.map(item=><li key={item.id}><button type="button" onClick={()=>edit(item)}><span aria-hidden="true">🔒</span><b>{item.title}</b>{item.type!=="Task"&&<small>{item.type}</small>}</button></li>)}</ul></div>)}
  </details>;
}
