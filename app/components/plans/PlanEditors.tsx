"use client";

import { useState } from "react";
import type { GuideBlock, PlanQuestion, PlanRequirement, PlanRoute, PlanSection, RequirementStatus, RouteStatus, WatchItem } from "../../domain/plans";

export const requirementStatuses:RequirementStatus[]=["Met","Not Yet","Unknown","Not Needed"];
export const routeStatuses:RouteStatus[]=["Leading","Considering","Backup","Chosen","Rejected"];

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}

function EditorShell({kicker,title,onClose,onSave,onDelete,children}:{kicker:string;title:string;onClose:()=>void;onSave:()=>void;onDelete?:()=>void;children:React.ReactNode}){
  return <div className="overlay" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><form className="modal compact-modal plan-editor" onSubmit={event=>{event.preventDefault();onSave()}}>
    <header className="modal-head"><div><small>{kicker}</small><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
    {children}
    <footer className="modal-actions">{onDelete&&<button type="button" className="delete" onClick={onDelete}>Delete</button>}<span/><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button type="submit" className="button primary">Save</button></footer>
  </form></div>;
}

const SectionSelect=({sections,value,onChange}:{sections:PlanSection[];value?:string;onChange:(value?:string)=>void})=>sections.length?<Field label="Part of the plan"><select value={value||""} onChange={event=>onChange(event.target.value||undefined)}><option value="">Whole plan</option>{sections.map(section=><option key={section.id} value={section.id}>{section.title}</option>)}</select></Field>:null;

interface EditorProps<T>{record:T;isNew:boolean;sections?:PlanSection[];onSave:(record:T)=>void;onDelete:()=>void;onClose:()=>void}

export function RequirementEditor({record,isNew,sections=[],onSave,onDelete,onClose}:EditorProps<PlanRequirement>){
  const [draft,setDraft]=useState(record);
  return <EditorShell kicker="WHAT NEEDS TO BE TRUE" title={isNew?"Add requirement":"Edit requirement"} onClose={onClose} onSave={()=>onSave(draft)} onDelete={isNew?undefined:onDelete}>
    <Field label="What must become true?"><input autoFocus required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field>
    <div className="form-grid"><Field label="Status"><select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as RequirementStatus})}>{requirementStatuses.map(status=><option key={status}>{status}</option>)}</select></Field><SectionSelect sections={sections} value={draft.sectionId} onChange={sectionId=>setDraft({...draft,sectionId})}/></div>
    <Field label="Why it matters"><textarea value={draft.whyItMatters||""} onChange={event=>setDraft({...draft,whyItMatters:event.target.value||undefined})}/></Field>
    <Field label="Notes"><textarea value={draft.notes||""} onChange={event=>setDraft({...draft,notes:event.target.value||undefined})}/></Field>
  </EditorShell>;
}

export function RouteEditor({record,isNew,sections=[],onSave,onDelete,onClose}:EditorProps<PlanRoute>){
  const [draft,setDraft]=useState(record);
  return <EditorShell kicker="ROUTE / OPTION" title={isNew?"Add route or option":"Edit route"} onClose={onClose} onSave={()=>onSave({...draft,updatedAt:new Date().toISOString().slice(0,10)})} onDelete={isNew?undefined:onDelete}>
    <Field label="Route name"><input autoFocus required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field>
    <div className="form-grid"><Field label="Status"><select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value as RouteStatus})}>{routeStatuses.map(status=><option key={status}>{status}</option>)}</select></Field><SectionSelect sections={sections} value={draft.sectionId} onChange={sectionId=>setDraft({...draft,sectionId})}/></div>
    <Field label="Short explanation"><input value={draft.summary||""} onChange={event=>setDraft({...draft,summary:event.target.value||undefined})}/></Field>
    <Field label="Why it could work"><textarea value={draft.whyItCouldWork||""} onChange={event=>setDraft({...draft,whyItCouldWork:event.target.value||undefined})}/></Field>
    <Field label="Concerns"><textarea value={draft.concerns||""} onChange={event=>setDraft({...draft,concerns:event.target.value||undefined})}/></Field>
    <div className="form-grid"><Field label="Estimated cost"><input type="number" min="0" value={draft.estimatedCost??""} onChange={event=>setDraft({...draft,estimatedCost:event.target.value===""?undefined:Number(event.target.value)})}/></Field><Field label="Cost status"><input value={draft.costStatus||""} placeholder="Still needs a quote" onChange={event=>setDraft({...draft,costStatus:event.target.value||undefined})}/></Field></div>
    <Field label="Notes"><textarea value={draft.notes||""} onChange={event=>setDraft({...draft,notes:event.target.value||undefined})}/></Field>
  </EditorShell>;
}

export function QuestionEditor({record,isNew,onSave,onDelete,onClose}:EditorProps<PlanQuestion>){
  const [draft,setDraft]=useState(record);
  return <EditorShell kicker="STILL NEED TO FIGURE OUT" title={isNew?"Add question":"Edit question"} onClose={onClose} onSave={()=>onSave({...draft,status:draft.answer?.trim()?"Answered":draft.status==="Answered"&&!draft.answer?"Open":draft.status})} onDelete={isNew?undefined:onDelete}>
    <Field label="What do you need to find out?"><input autoFocus required value={draft.question} onChange={event=>setDraft({...draft,question:event.target.value})}/></Field>
    <Field label="Answer (once known)"><textarea value={draft.answer||""} placeholder="Answering it moves it into what you already know." onChange={event=>setDraft({...draft,answer:event.target.value||undefined})}/></Field>
  </EditorShell>;
}

export function GuideBlockEditor({record,isNew,onSave,onDelete,onClose}:EditorProps<GuideBlock>){
  const [draft,setDraft]=useState(record);
  const instruction=draft.kind==="instruction";
  return <EditorShell kicker={instruction?"HOW THIS CAN WORK":"WHAT I ALREADY KNOW"} title={isNew?(instruction?"Add instruction":"Add planning note"):"Edit"} onClose={onClose} onSave={()=>onSave(draft)} onDelete={isNew?undefined:onDelete}>
    <Field label={instruction?"Step or topic":"Headline"}><input autoFocus required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field>
    <Field label="Details"><textarea value={draft.body} onChange={event=>setDraft({...draft,body:event.target.value})}/></Field>
    <Field label="Type"><select value={draft.kind||"note"} onChange={event=>setDraft({...draft,kind:event.target.value as GuideBlock["kind"]})}><option value="note">Planning note</option><option value="instruction">Instruction</option></select></Field>
  </EditorShell>;
}

export function WatchEditor({record,isNew,onSave,onDelete,onClose}:EditorProps<WatchItem>){
  const [draft,setDraft]=useState(record);
  return <EditorShell kicker="WAITING ON" title={isNew?"Add something you're waiting on":"Edit"} onClose={onClose} onSave={()=>onSave(draft)} onDelete={isNew?undefined:onDelete}>
    <Field label="What are you waiting on?"><input autoFocus required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></Field>
    <Field label="Why it matters"><textarea value={draft.reason} onChange={event=>setDraft({...draft,reason:event.target.value})}/></Field>
    <div className="form-grid"><Field label="Label"><select value={draft.label||"Waiting on"} onChange={event=>setDraft({...draft,label:event.target.value as WatchItem["label"]})}><option>Waiting on</option><option>Open loop</option><option>Worth remembering</option></select></Field><Field label="State"><select value={draft.state} onChange={event=>setDraft({...draft,state:event.target.value as WatchItem["state"]})}><option>Watching</option><option>Resolved</option></select></Field></div>
  </EditorShell>;
}
