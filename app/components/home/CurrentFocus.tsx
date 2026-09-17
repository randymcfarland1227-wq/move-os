"use client";

import type { MoveData, MoveItem } from "../../types";
import { currentFocus } from "../../domain/plans";
import { TaskLine } from "../tasks/TaskLine";

export function CurrentFocus({data,update,edit,openPreMove,linkLabel="All Pre-Move work →"}:{data:MoveData;update:(data:MoveData)=>void;edit:(item:MoveItem)=>void;openPreMove:()=>void;linkLabel?:string}){
  const focus=currentFocus(data,5);
  return <section className="home-block current-focus">
    <header><div><h2>Current focus</h2><p>The few actions that actually deserve attention now.</p></div><button onClick={openPreMove}>{linkLabel}</button></header>
    <div className="focus-list">{focus.map(item=><TaskLine key={item.id} item={item} data={data} update={update} edit={edit}/>)}{!focus.length&&<p className="plan-empty">Nothing needs action right now.</p>}</div>
  </section>;
}
