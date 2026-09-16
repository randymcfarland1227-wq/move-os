"use client";

import { useState } from "react";
import type { MoveAssumption, MoveDecision, WatchItem } from "../../domain/readiness";
import type { MoveData, MoveItem, WorkArea } from "../../types";

type CaptureKind="Something to do"|"Something I decided"|"Something I’m assuming"|"Something to remember/watch";
const kinds:CaptureKind[]=["Something to do","Something I decided","Something I’m assuming","Something to remember/watch"];
const areas:{label:string;value:WorkArea}[]=[{label:"Money",value:"Money"},{label:"Work",value:"Income"},{label:"Home",value:"Housing"},{label:"Moving",value:"Logistics"},{label:"Life",value:"Health + Marvel"}];

export function CaptureModal({data,save,close}:{data:MoveData;save:(data:MoveData)=>void;close:()=>void}){
  const [text,setText]=useState("");
  const [kind,setKind]=useState<CaptureKind>("Something to do");
  const [area,setArea]=useState<WorkArea>("Housing");
  const submit=(event:React.FormEvent)=>{
    event.preventDefault();
    const id=crypto.randomUUID();const now=new Date().toISOString();
    if(kind==="Something to do"){
      const item:MoveItem={id,title:text,description:"",phase:"Pre-Move",type:"Task",workArea:area,status:"Not Started",importance:"Normal",schedule:"This Week",kind:"Action",createdAt:now.slice(0,10),updatedAt:now.slice(0,10)};
      save({...data,items:[...data.items,item]});
    }else if(kind==="Something I decided"){
      const decision:MoveDecision={id,title:text,selected:"Decided",decidedAt:now.slice(0,10)};save({...data,decisions:[...data.decisions,decision]});
    }else if(kind==="Something I’m assuming"){
      const assumption:MoveAssumption={id,title:text,value:text,confidence:"Working",updatedAt:now};save({...data,assumptions:[...data.assumptions,assumption]});
    }else{
      const watch:WatchItem={id,title:text,reason:"Captured to remember; no action required yet.",state:"Watching"};save({...data,watches:[...data.watches,watch]});
    }
    close();
  };
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&close()}><form className="modal capture-modal" onSubmit={submit}><header className="modal-head"><div><small>QUICK CAPTURE</small><h2>Get it out of your head.</h2></div><button type="button" onClick={close}>×</button></header><label className="field"><span>What should Move OS remember?</span><textarea autoFocus required value={text} placeholder="If I don't have qualifying employment in time, I may need a sublet." onChange={event=>setText(event.target.value)}/></label><fieldset><legend>What kind of thing is this?</legend>{kinds.map(value=><label key={value}><input type="radio" name="capture-kind" checked={kind===value} onChange={()=>setKind(value)}/><span>{value}</span></label>)}</fieldset>{kind==="Something to do"&&<label className="field"><span>Which part of the move?</span><select value={area} onChange={event=>setArea(event.target.value as WorkArea)}>{areas.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}<footer className="modal-actions"><span/><button className="button" type="button" onClick={close}>Cancel</button><button className="button primary" type="submit">Capture</button></footer></form></div>;
}
