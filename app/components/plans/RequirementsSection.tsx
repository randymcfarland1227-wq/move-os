"use client";

import { useState } from "react";
import type { MoveData } from "../../types";
import type { PlanRequirement, PlanSection, RequirementStatus } from "../../domain/plans";
import { removeById, upsert } from "../../domain/plans";
import { RequirementEditor } from "./PlanEditors";

const marks:Record<RequirementStatus,string>={"Met":"✓","Not Yet":"","Unknown":"?","Not Needed":"–"};
const cycle:Record<RequirementStatus,RequirementStatus>={"Not Yet":"Met","Met":"Unknown","Unknown":"Not Needed","Not Needed":"Not Yet"};

export function RequirementList({planId,requirements,data,update,sections=[],sectionId,addLabel="＋ Add requirement"}:{planId:string;requirements:PlanRequirement[];data:MoveData;update:(data:MoveData)=>void;sections?:PlanSection[];sectionId?:string;addLabel?:string}){
  const [editing,setEditing]=useState<{record:PlanRequirement;isNew:boolean}|null>(null);
  const save=(record:PlanRequirement)=>{update({...data,planRequirements:upsert(data.planRequirements,record)});setEditing(null)};
  return <>
    <ul className="requirement-list">{requirements.map(requirement=><li key={requirement.id} className={`req-${requirement.status.toLowerCase().replace(" ","-")}`}>
      <button className="req-mark" title={`${requirement.status} — click to change`} aria-label={`${requirement.title}: ${requirement.status}. Change status`} onClick={()=>save({...requirement,status:cycle[requirement.status]})}>{marks[requirement.status]}</button>
      <button className="req-copy" onClick={()=>setEditing({record:requirement,isNew:false})}><span>{requirement.title}</span>{requirement.status!=="Not Yet"&&requirement.status!=="Met"&&<i>{requirement.status}</i>}{requirement.whyItMatters&&<small>{requirement.whyItMatters}</small>}</button>
    </li>)}</ul>
    {!requirements.length&&<p className="plan-empty">Nothing recorded yet.</p>}
    <button className="plan-add" onClick={()=>setEditing({record:{id:crypto.randomUUID(),planId,sectionId,title:"",status:"Not Yet",order:data.planRequirements.length+1},isNew:true})}>{addLabel}</button>
    {editing&&<RequirementEditor record={editing.record} isNew={editing.isNew} sections={sections} onSave={save} onDelete={()=>{update({...data,planRequirements:removeById(data.planRequirements,editing.record.id)});setEditing(null)}} onClose={()=>setEditing(null)}/>}
  </>;
}
