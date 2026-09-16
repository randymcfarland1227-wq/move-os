import type { ReadinessGate } from "./readiness";

export const readinessConfig: ReadinessGate[] = [
  {id:"cash-flow", title:"Cash Flow for the Move", question:"Can I cover bills, move-in, the physical move, and still arrive with usable cash?", state:"Needs Attention", relatedItemIds:["credit-plan"], watchIds:["watch-unemployment"], nextTaskId:"update-current-cash"},
  {id:"income-proof", title:"Income & Rental Proof", question:"What income route can give me ongoing money and proof a landlord can actually use?", state:"Active", routeIds:["route-remote","route-chicago","route-denver","route-unemployment","route-resale"], relatedItemIds:["income-evidence","income-proof"], nextTaskId:"apply-remote-roles"},
  {id:"housing", title:"Housing Route & Approval", question:"Where can I realistically get approved without forcing a bad financial decision?", state:"Waiting", routeIds:["route-standard-lease","route-sublet"], relatedItemIds:["credit-plan","income-proof","lease"], watchIds:["watch-qualification"]},
  {id:"move-window", title:"Move Window & Decision Timing", question:"When can I leave without forcing a bad housing, money, or household decision?", state:"Active", watchIds:["watch-move-window"]},
  {id:"physical-move", title:"Physical Move Plan", question:"Once the city and date are real, how do I move myself, Marvel, and my belongings without overspending?", state:"No Action Yet", routeIds:["route-trailer"], relatedItemIds:["move-plan","packing"], watchIds:["watch-physical-move"]},
  {id:"continuity", title:"Health & Landing Continuity", question:"What must be handled before I leave so I arrive with basic care and stability in place?", state:"Needs Attention", relatedItemIds:["health-continuity","dog-ready","arrival-kit"], nextTaskId:"health-continuity"},
];

export const readinessById = (id:string) => readinessConfig.find(gate => gate.id === id);
