"use client";

import { useState } from "react";
import type { MoveData } from "../../types";
import type { PlanQuestion } from "../../domain/plans";
import { removeById, upsert } from "../../domain/plans";
import { QuestionEditor } from "./PlanEditors";

export function QuestionsSection({planId,questions,data,update}:{planId:string;questions:PlanQuestion[];data:MoveData;update:(data:MoveData)=>void}){
  const [editing,setEditing]=useState<{record:PlanQuestion;isNew:boolean}|null>(null);
  return <section className="plan-part">
    <h2>Still need to figure out</h2>
    <ul className="question-list">{questions.map(question=><li key={question.id}><button onClick={()=>setEditing({record:question,isNew:false})}><span>○</span>{question.question}</button></li>)}</ul>
    {!questions.length&&<p className="plan-empty">No open questions right now.</p>}
    <button className="plan-add" onClick={()=>setEditing({record:{id:crypto.randomUUID(),planId,question:"",status:"Open",order:data.planQuestions.length+1},isNew:true})}>＋ Add question</button>
    {editing&&<QuestionEditor record={editing.record} isNew={editing.isNew} onSave={record=>{update({...data,planQuestions:upsert(data.planQuestions,record)});setEditing(null)}} onDelete={()=>{update({...data,planQuestions:removeById(data.planQuestions,editing.record.id)});setEditing(null)}} onClose={()=>setEditing(null)}/>}
  </section>;
}
