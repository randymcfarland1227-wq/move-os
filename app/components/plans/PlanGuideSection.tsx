"use client";

import { useState } from "react";
import type { MoveData } from "../../types";
import type { GuideBlock, PlanGuide, PlanQuestion } from "../../domain/plans";
import { GuideBlockEditor, QuestionEditor } from "./PlanEditors";
import { upsert } from "../../domain/plans";

const sortBlocks=(blocks:GuideBlock[])=>[...blocks].sort((a,b)=>(a.order??0)-(b.order??0));

export function PlanGuideSection({guide,answered,data,update}:{guide:PlanGuide;answered:PlanQuestion[];data:MoveData;update:(data:MoveData)=>void}){
  const [editing,setEditing]=useState<{record:GuideBlock;isNew:boolean}|null>(null);
  const [question,setQuestion]=useState<PlanQuestion|null>(null);
  const saveGuide=(next:PlanGuide)=>update({...data,planGuides:data.planGuides.some(candidate=>candidate.planId===next.planId)?data.planGuides.map(candidate=>candidate.planId===next.planId?next:candidate):[...data.planGuides,next]});
  const instructions=sortBlocks(guide.instructions.filter(block=>block.kind==="instruction"));
  const notes=sortBlocks(guide.instructions.filter(block=>block.kind!=="instruction"));
  const add=(kind:GuideBlock["kind"])=>setEditing({record:{id:crypto.randomUUID(),kind,title:"",body:"",order:guide.instructions.length+1},isNew:true});
  return <>
    <section className="plan-part">
      <h2>What I already know</h2>
      {guide.overview&&<p className="plan-lede">{guide.overview}</p>}
      <ul className="knowledge-list">
        {notes.map(block=><li key={block.id}><button onClick={()=>setEditing({record:block,isNew:false})}><b>{block.title}</b>{block.body&&<span>{block.body}</span>}</button></li>)}
        {answered.map(item=><li key={item.id} className="answered"><button onClick={()=>setQuestion(item)}><b>{item.question}</b><span>{item.answer}</span></button></li>)}
      </ul>
      {!notes.length&&!answered.length&&<p className="plan-empty">Research and prior thinking will live here.</p>}
      <button className="plan-add" onClick={()=>add("note")}>＋ Add planning note</button>
    </section>
    <section className="plan-part">
      <h2>How this can work</h2>
      <div className="guide-blocks">{instructions.map(block=><button key={block.id} onClick={()=>setEditing({record:block,isNew:false})}><b>{block.title}</b><p>{block.body}</p></button>)}</div>
      {!instructions.length&&<p className="plan-empty">No instructions yet.</p>}
      <button className="plan-add" onClick={()=>add("instruction")}>＋ Add instruction</button>
    </section>
    {editing&&<GuideBlockEditor record={editing.record} isNew={editing.isNew} onSave={record=>{saveGuide({...guide,instructions:upsert(guide.instructions,record)});setEditing(null)}} onDelete={()=>{saveGuide({...guide,instructions:guide.instructions.filter(block=>block.id!==editing.record.id)});setEditing(null)}} onClose={()=>setEditing(null)}/>}
    {question&&<QuestionEditor record={question} isNew={false} onSave={record=>{update({...data,planQuestions:upsert(data.planQuestions,record)});setQuestion(null)}} onDelete={()=>{update({...data,planQuestions:data.planQuestions.filter(item=>item.id!==question.id)});setQuestion(null)}} onClose={()=>setQuestion(null)}/>}
  </>;
}
