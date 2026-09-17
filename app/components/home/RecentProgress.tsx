"use client";

import type { MoveData, MoveItem } from "../../types";
import { recentProgress } from "../../domain/plans";

export function RecentProgress({data,edit}:{data:MoveData;edit:(item:MoveItem)=>void}){
  const entries=recentProgress(data,6);
  if(!entries.length)return null;
  return <section className="home-block recent-progress">
    <header><div><h2>Recent progress</h2><p>Handled or settled, so it doesn't have to live in your head.</p></div></header>
    <ul>{entries.map(entry=>{
      const task=entry.taskId?data.items.find(item=>item.id===entry.taskId):undefined;
      return <li key={entry.id}>{task?<button onClick={()=>edit(task)}><span>✓</span>{entry.title}</button>:<p><span>✓</span>{entry.title}</p>}</li>;
    })}</ul>
  </section>;
}
