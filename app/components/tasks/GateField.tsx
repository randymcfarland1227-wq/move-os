"use client";

import type { MoveItem } from "../../types";
import { gateChoice, gatesFor, type GateChoice } from "../../domain/gates";

/** "Can I do this now?" — classifies new and edited work as doable now or locked behind a milestone or item. */
export function GateField({gates,onChange,all,selfId}:{gates?:string[];onChange:(gates:string[]|undefined)=>void;all:MoveItem[];selfId?:string}){
  const current=gateChoice({gates});
  const candidates=all.filter(item=>item.id!==selfId&&(!item.kind||item.kind==="Action")&&item.status!=="Done");
  const pick=(choice:GateChoice,itemId?:string)=>onChange(gatesFor(choice,choice==="item"?(itemId||current.itemId||candidates[0]?.id):undefined));
  return <div className="form-grid gate-field">
    <label className="field"><span>Can I do this now?</span><select value={current.choice} onChange={event=>pick(event.target.value as GateChoice)}>
      <option value="now">Yes, now</option>
      <option value="ready-to-search">After Ready to search (the three goals)</option>
      <option value="lease-signed">After Lease signed</option>
      <option value="item">After a specific item</option>
    </select></label>
    {current.choice==="item"&&<label className="field"><span>After which item?</span><select value={current.itemId||""} onChange={event=>pick("item",event.target.value)}>{candidates.map(item=><option key={item.id} value={item.id}>{item.type==="Task"?"":`${item.type}: `}{item.title}</option>)}</select></label>}
  </div>;
}
