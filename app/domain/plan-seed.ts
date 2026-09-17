import type { MoveItem } from "../types";
import type { ActionStage, GuideBlock, MovePlan, PlanGuide, PlanQuestion, PlanRequirement, PlanRoute, PlanSection } from "./plans";

const seeded = "2026-09-16";

export const seedPlans: MovePlan[] = [
  {id:"cash-flow",title:"Cash Flow for the Move",question:"Can I cover my current obligations, move-in costs, the physical move, and still have usable cash after arriving?",outcome:"Arrive with bills covered, move-in and transport paid for, and usable cash left over—without counting pending money as money I already have.",status:"Active",summary:"Unknown costs still need real numbers.",sectionIds:["cf-numbers","cf-income","cf-costs"],order:1,createdAt:seeded,updatedAt:seeded},
  {id:"secure-home",title:"Get Approved & Secure a Home",question:"What income, credit, documentation, and housing route will get me approved for a workable home?",outcome:"A signed lease or workable sublet at a home I actually want, backed by income and credit evidence a landlord accepts—ending in a confirmed address.",status:"Active",summary:"Qualification path in progress.",sectionIds:["sh-qualify","sh-route","sh-find","sh-apply"],order:2,createdAt:seeded,updatedAt:seeded},
  {id:"physical-move",title:"Physical Move Plan",question:"What is the most practical and affordable way to move me, Marvel, my car, and my belongings once the destination and timing are real?",outcome:"Have a practical, affordable transportation plan that gets me, Marvel, the car, and my belongings to the new home safely.",status:"Planning",summary:"No booking needed yet.",sectionIds:["pm-load","pm-compare","pm-vehicle","pm-book","pm-day"],order:3,createdAt:seeded,updatedAt:seeded},
  {id:"continuity",title:"Medication & Essential Continuity",question:"What do I need to prepare before leaving so medication and essential care continue through the transition?",outcome:"Maintain medication continuity through the move and establish a workable next-provider/pharmacy route without having to reconstruct treatment history from scratch.",status:"Needs Attention",summary:"Pre-move plan needs attention.",sectionIds:["mc-history","mc-care","mc-transition","mc-next"],order:4,createdAt:seeded,updatedAt:seeded},
];

export const seedSections: PlanSection[] = [
  {id:"cf-numbers",planId:"cash-flow",title:"Know the Numbers",description:"Accounts, bills, and what is truly available.",order:1},
  {id:"cf-income",planId:"cash-flow",title:"Bring Money In",description:"Unemployment, resale, and new income.",order:2},
  {id:"cf-costs",planId:"cash-flow",title:"Estimate Move Costs",description:"Move-in, transport, and travel.",order:3},
  {id:"sh-qualify",planId:"secure-home",title:"Build a Qualification Path",description:"Income, credit, and the documents that prove them.",order:1},
  {id:"sh-route",planId:"secure-home",title:"Choose the Housing Route",description:"Standard lease or a sublet.",order:2},
  {id:"sh-find",planId:"secure-home",title:"Find the Home",description:"Compare real candidates in Apartment Search.",order:3},
  {id:"sh-apply",planId:"secure-home",title:"Apply & Secure It",description:"Application, approval, lease, confirmed address.",order:4},
  {id:"pm-load",planId:"physical-move",title:"Understand the Load",order:1},
  {id:"pm-compare",planId:"physical-move",title:"Compare Options",order:2},
  {id:"pm-vehicle",planId:"physical-move",title:"Prepare Vehicle",order:3},
  {id:"pm-book",planId:"physical-move",title:"Book the Move",order:4},
  {id:"pm-day",planId:"physical-move",title:"Execute Move Day",order:5},
  {id:"mc-history",planId:"continuity",title:"Gather History",order:1},
  {id:"mc-care",planId:"continuity",title:"Talk to Current Care Team",order:2},
  {id:"mc-transition",planId:"continuity",title:"Understand Transition",order:3},
  {id:"mc-next",planId:"continuity",title:"Establish Next Care Route",order:4},
];

const req = (planId:string,order:number,id:string,title:string,status:PlanRequirement["status"],extra:Partial<PlanRequirement>={}):PlanRequirement=>({id,planId,order,title,status,...extra});

export const seedRequirements: PlanRequirement[] = [
  req("cash-flow",1,"req-cash-accounts","Cash accounts updated","Not Yet",{relatedTaskIds:["update-current-cash"],whyItMatters:"The projection is only as trustworthy as today's balances."}),
  req("cash-flow",2,"req-october-bills","October bills entered","Not Yet",{relatedTaskIds:["cf-october-bills"]}),
  req("cash-flow",3,"req-move-in-estimate","Move-in costs estimated","Not Yet",{whyItMatters:"Deposit, fees, and first month come from the real property."}),
  req("cash-flow",4,"req-transport-estimate","Transportation cost estimated","Not Yet"),
  req("cash-flow",5,"req-unemployment-timing","Unemployment payment timing known","Unknown",{relatedTaskIds:["check-unemployment"]}),

  req("secure-home",1,"req-income-evidence","Housing-usable income evidence","Not Yet",{sectionId:"sh-qualify",relatedTaskIds:["income-proof"],whyItMatters:"A landlord needs an offer letter or paystubs, not expected income."}),
  req("secure-home",2,"req-credit","Credit at 625+ or a workable credit path","Not Yet",{sectionId:"sh-qualify",relatedTaskIds:["credit-plan"]}),
  req("secure-home",3,"req-documents","Rental application documents gathered","Not Yet",{sectionId:"sh-qualify",relatedTaskIds:["application-packet"]}),
  req("secure-home",4,"req-housing-route","Housing route chosen","Not Yet",{sectionId:"sh-route"}),
  req("secure-home",5,"req-top-choice","Top-choice home identified","Not Yet",{sectionId:"sh-find"}),
  req("secure-home",6,"req-property-rules","Property requirements verified","Unknown",{sectionId:"sh-apply"}),
  req("secure-home",7,"req-approved","Application approved","Not Yet",{sectionId:"sh-apply"}),
  req("secure-home",8,"req-lease-signed","Lease reviewed and signed","Not Yet",{sectionId:"sh-apply",relatedTaskIds:["lease"]}),
  req("secure-home",9,"req-address","Confirmed address","Not Yet",{sectionId:"sh-apply"}),

  req("physical-move",1,"req-car-plan","Car travel plan understood","Met"),
  req("physical-move",2,"req-final-address","Final address confirmed","Not Yet"),
  req("physical-move",3,"req-move-date","Move date confirmed","Not Yet"),
  req("physical-move",4,"req-volume","Belongings volume understood","Not Yet",{relatedTaskIds:["pm-decide-what-comes","packing"]}),
  req("physical-move",5,"req-transport-method","Transportation method chosen","Not Yet"),
  req("physical-move",6,"req-marvel-travel","Marvel travel needs accounted for","Unknown"),
  req("physical-move",7,"req-loading","Loading and unloading requirements known","Unknown"),

  req("continuity",1,"req-pharmacy-history","Pharmacy history available","Not Yet",{relatedTaskIds:["health-continuity"]}),
  req("continuity",2,"req-prescribing-history","Provider / prescribing history available","Not Yet"),
  req("continuity",3,"req-transition-discussed","Current provider transition discussed","Not Yet",{relatedTaskIds:["mc-talk-provider"]}),
  req("continuity",4,"req-next-provider","Next-provider route understood","Unknown"),
  req("continuity",5,"req-refill-timing","Refill timing understood","Unknown"),
  req("continuity",6,"req-contacts","Provider and pharmacy contacts saved","Not Yet",{relatedTaskIds:["mc-save-contacts"]}),
  req("continuity",7,"req-marvel-records","Marvel records saved","Met",{relatedTaskIds:["dog-ready"]}),
];

const route = (planId:string,id:string,title:string,status:PlanRoute["status"],extra:Partial<PlanRoute>={}):PlanRoute=>({id,planId,title,status,createdAt:seeded,updatedAt:seeded,...extra});

export const seedRoutes: PlanRoute[] = [
  route("cash-flow","route-unemployment","Maryland unemployment","Leading",{summary:"Bridge cash for bills while job searching.",concerns:"Claim is still pending; it does not count as rental proof.",relatedTaskIds:["check-unemployment"]}),
  route("cash-flow","route-resale","Reselling","Leading",{summary:"Immediate cash plus fewer belongings to transport.",whyItCouldWork:"Turns things that would otherwise need to be moved into move money.",relatedTaskIds:["cf-list-resale"]}),

  route("secure-home","route-remote","Fully Remote Role","Leading",{sectionId:"sh-qualify",summary:"Housing proof, ongoing income, and destination flexibility.",whyItCouldWork:"Income travels with the move and works for Chicago or Denver.",relatedTaskIds:["remote-search","apply-remote-roles"]}),
  route("secure-home","route-chicago","Chicago Role","Leading",{sectionId:"sh-qualify",summary:"Qualifying income tied to the leading destination.",relatedTaskIds:["chicago-hybrid"]}),
  route("secure-home","route-denver","Denver Role","Backup",{sectionId:"sh-qualify",summary:"Keeps Denver viable as a backup path.",relatedTaskIds:["denver-hybrid"]}),
  route("secure-home","route-standard-lease","Standard Lease","Leading",{sectionId:"sh-route",summary:"Preferred when qualification, timing, and move-in cash work.",concerns:"Needs income evidence and a workable credit picture."}),
  route("secure-home","route-sublet","Sublet","Backup",{sectionId:"sh-route",summary:"A flexible transition if employment evidence, credit, or timing make a standard lease unwise.",whyItCouldWork:"Flexibility is better than forcing a bad lease.",notes:"Use when employment evidence is not ready, approval is difficult, or timing becomes too tight."}),

  route("physical-move","route-trailer","Car + installed hitch + small trailer","Leading",{summary:"The current lower-cost transport assumption.",whyItCouldWork:"Likely lower cost than a large moving truck and lets the car travel with the move.",concerns:"Needs hitch installation, enough capacity, and a final quote.",costStatus:"Still needs a quote",relatedTaskIds:["move-plan"]}),
  route("physical-move","route-uhaul","U-Haul truck","Considering",{summary:"Current thought: likely more expensive.",concerns:"Car would need towing or a second driver.",costStatus:"Not quoted"}),

  route("continuity","route-current-bridge","Current provider transition / bridge","Leading",{summary:"Work with the current provider on refill timing and a bridge through the move."}),
  route("continuity","route-destination-provider","Establish a destination-state provider","Considering",{summary:"Find a new in-state prescriber once the destination is settled."}),
  route("continuity","route-history-support","Use pharmacy/provider history to support continuity","Considering",{summary:"Bring fill history and a provider note so a new provider does not start from scratch."}),
];

const question = (planId:string,order:number,id:string,text:string):PlanQuestion=>({id,planId,order,question:text,status:"Open"});

export const seedQuestions: PlanQuestion[] = [
  question("cash-flow",1,"q-october-bills","What will October bills total?"),
  question("cash-flow",2,"q-unemployment-arrival","When will the unemployment payments actually arrive?"),
  question("cash-flow",3,"q-move-in-cost","What will move-in cost at the chosen property?"),
  question("secure-home",1,"q-income-verification","What does the target property accept as income verification?"),
  question("secure-home",2,"q-sublet-proof","Would a sublet accept savings or unemployment instead of paystubs?"),
  question("physical-move",1,"q-hitch-cost","How much will hitch installation cost?"),
  question("physical-move",2,"q-trailer-quote","What will the trailer cost for the final route and date?"),
  question("physical-move",3,"q-trailer-space","How much trailer space do my belongings need?"),
  question("physical-move",4,"q-loading-rules","What are the new building's loading and parking rules?"),
  question("continuity",1,"q-provider-docs","What documentation can Dr. Dippo provide?"),
  question("continuity",2,"q-new-provider-needs","What information will a new provider need?"),
  question("continuity",3,"q-new-provider-timing","How early should I begin the new-provider process?"),
  question("continuity",4,"q-refill-bridge","Can current refills bridge the move, and for how long?"),
];

const block = (id:string,kind:GuideBlock["kind"],title:string,body:string,order:number):GuideBlock=>({id,kind,title,body,order});

export const seedGuides: PlanGuide[] = [
  {planId:"cash-flow",instructions:[
    block("g-cf-pending","note","Pending money is not cash","Unemployment and pending resale count toward the projection, never toward cash available now.",1),
    block("g-cf-property","note","Move-in cost depends on the property","Application fees ($50–$100), deposit, pet and parking costs vary—use the real listing, including verified specials.",2),
    block("g-cf-mark-received","instruction","When money arrives","Mark the expected entry received and update the account balance so it is not counted twice.",3),
  ]},
  {planId:"secure-home",instructions:[
    block("g-sh-rules","note","Typical approval rules","Income around 2.5–3× rent and a 625+ credit score are common targets, but every property sets its own final rule.",1),
    block("g-sh-unemployment","note","Unemployment is bridge cash","It helps pay bills while searching but should not be assumed to count as rental income proof.",2),
    block("g-sh-packet","instruction","Build the application packet","ID, a signed offer letter with compensation or new-role paystubs, and a factual credit explanation only if a property asks.",3),
  ]},
  {planId:"physical-move",instructions:[
    block("g-pm-hitch","note","Hitch required for the trailer route","The car needs an installed hitch before a trailer is an option.",1),
    block("g-pm-cost","note","Exact cost depends on destination and date","Trailer and truck pricing changes with the route and the move date.",2),
    block("g-pm-volume","note","Belongings volume changes the right option","Selling and releasing more makes the smaller trailer more realistic.",3),
    block("g-pm-truck","note","A larger truck is likely more expensive","And the car still has to get there.",4),
    block("g-pm-building","note","Building rules may matter","Loading docks, elevator reservations, and parking or trailer access can all constrain move day.",5),
  ]},
  {planId:"continuity",instructions:[
    block("g-mc-prepare","instruction","What to prepare","Request pharmacy fill history and useful provider information before moving.",1),
    block("g-mc-ask","instruction","What to ask the current provider","Discuss the move, refill timing, treatment history, and what documentation may be useful during the transition.",2),
    block("g-mc-new-provider","instruction","What a new provider may ask for","Pharmacy history, prior prescriber contact, treatment history, ID, and insurance information.",3),
    block("g-mc-before-transfer","note","Understand what happens before transferring care","Some prescriptions cannot simply transfer across state lines—learn the steps before relying on a new pharmacy.",4),
  ]},
];

export interface TaskPlacement { planId:string; planSectionId?:string; routeId?:string; requirementId?:string; actionStage?:ActionStage; triggerText?:string; }

/** Where each known task belongs. Applied to seed data and to migrated browser data that has no plan yet. */
export const taskPlacement: Record<string, TaskPlacement> = {
  "update-current-cash":{planId:"cash-flow",planSectionId:"cf-numbers",requirementId:"req-cash-accounts",actionStage:"Now"},
  "cf-october-bills":{planId:"cash-flow",planSectionId:"cf-numbers",requirementId:"req-october-bills",actionStage:"Now"},
  "check-unemployment":{planId:"cash-flow",planSectionId:"cf-income",routeId:"route-unemployment",actionStage:"Now"},
  "cf-unemployment-submitted":{planId:"cash-flow",planSectionId:"cf-income",routeId:"route-unemployment"},
  "cf-list-resale":{planId:"cash-flow",planSectionId:"cf-income",routeId:"route-resale",actionStage:"Now"},
  "holiday-plan":{planId:"cash-flow",planSectionId:"cf-costs",actionStage:"Next"},

  "credit-plan":{planId:"secure-home",planSectionId:"sh-qualify",requirementId:"req-credit",actionStage:"Now"},
  "income-evidence":{planId:"secure-home",planSectionId:"sh-qualify",requirementId:"req-income-evidence"},
  "remote-search":{planId:"secure-home",planSectionId:"sh-qualify",routeId:"route-remote",actionStage:"Now"},
  "apply-remote-roles":{planId:"secure-home",planSectionId:"sh-qualify",routeId:"route-remote",actionStage:"Now"},
  "chicago-hybrid":{planId:"secure-home",planSectionId:"sh-qualify",routeId:"route-chicago",actionStage:"Now"},
  "denver-hybrid":{planId:"secure-home",planSectionId:"sh-qualify",routeId:"route-denver",actionStage:"Later"},
  "income-proof":{planId:"secure-home",planSectionId:"sh-qualify",requirementId:"req-income-evidence",actionStage:"Triggered",triggerText:"When a job offer arrives"},
  "application-packet":{planId:"secure-home",planSectionId:"sh-qualify",requirementId:"req-documents",actionStage:"Next"},
  "credit-explanation":{planId:"secure-home",planSectionId:"sh-apply",actionStage:"Triggered",triggerText:"When a property asks for one"},
  "lease":{planId:"secure-home",planSectionId:"sh-apply",requirementId:"req-lease-signed",actionStage:"Triggered",triggerText:"When income evidence is ready"},
  "utilities":{planId:"secure-home",planSectionId:"sh-apply",requirementId:"req-address",actionStage:"Triggered",triggerText:"When the lease is signed"},

  "attic":{planId:"physical-move",planSectionId:"pm-load"},
  "pm-decide-what-comes":{planId:"physical-move",planSectionId:"pm-load",requirementId:"req-volume",actionStage:"Now"},
  "packing":{planId:"physical-move",planSectionId:"pm-load",requirementId:"req-volume",actionStage:"Next"},
  "pm-trailer-researched":{planId:"physical-move",planSectionId:"pm-compare",routeId:"route-trailer"},
  "pm-truck-considered":{planId:"physical-move",planSectionId:"pm-compare",routeId:"route-uhaul"},
  "md-emissions":{planId:"physical-move",planSectionId:"pm-vehicle"},
  "oil-change":{planId:"physical-move",planSectionId:"pm-vehicle",actionStage:"Next"},
  "registration":{planId:"physical-move",planSectionId:"pm-vehicle",actionStage:"Next"},
  "insurance":{planId:"physical-move",planSectionId:"pm-vehicle",actionStage:"Triggered",triggerText:"When the address is confirmed"},
  "cosmetic-car":{planId:"physical-move",planSectionId:"pm-vehicle",actionStage:"Later"},
  "move-plan":{planId:"physical-move",planSectionId:"pm-book",routeId:"route-trailer",requirementId:"req-transport-method",actionStage:"Triggered",triggerText:"When housing is confirmed"},
  "pm-final-quote":{planId:"physical-move",planSectionId:"pm-book",actionStage:"Triggered",triggerText:"When housing is confirmed"},
  "pm-loading-access":{planId:"physical-move",planSectionId:"pm-book",requirementId:"req-loading",actionStage:"Triggered",triggerText:"When housing is confirmed"},
  "move-day-plan":{planId:"physical-move",planSectionId:"pm-day"},
  "condition-proof":{planId:"physical-move",planSectionId:"pm-day"},

  "health-continuity":{planId:"continuity",planSectionId:"mc-history",requirementId:"req-pharmacy-history",actionStage:"Now"},
  "mc-med-known":{planId:"continuity",planSectionId:"mc-history"},
  "mc-save-contacts":{planId:"continuity",planSectionId:"mc-history",requirementId:"req-contacts",actionStage:"Now"},
  "mc-provider-identified":{planId:"continuity",planSectionId:"mc-care"},
  "mc-talk-provider":{planId:"continuity",planSectionId:"mc-care",requirementId:"req-transition-discussed",actionStage:"Now"},
  "dog-ready":{planId:"continuity",planSectionId:"mc-history",requirementId:"req-marvel-records"},
};

export const applyPlacement = (item: MoveItem): MoveItem => {
  const placement = taskPlacement[item.id];
  if (!placement || item.planId) return item;
  const filled = { ...item };
  (Object.keys(placement) as (keyof TaskPlacement)[]).forEach(key => {
    if (filled[key] === undefined) (filled as Record<string, unknown>)[key] = placement[key];
  });
  return filled;
};

export const watchPlans: Record<string, { planId: string; label: "Waiting on" | "Open loop" | "Worth remembering" }> = {
  "watch-unemployment": { planId: "cash-flow", label: "Waiting on" },
  "watch-qualification": { planId: "secure-home", label: "Waiting on" },
  "watch-physical-move": { planId: "physical-move", label: "Waiting on" },
};

export const decisionPlans: Record<string, string> = {
  "decision-destination": "secure-home",
  "decision-housing-fallback": "secure-home",
  "decision-trailer": "physical-move",
  "assumption-transport": "physical-move",
  "assumption-chicago": "secure-home",
};
