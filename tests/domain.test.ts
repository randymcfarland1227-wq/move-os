import assert from "node:assert/strict";
import test from "node:test";
import { calculateCashFlow, markCashEntryReceived, type CashFlowPlan } from "../app/domain/cash-flow";
import { actionPlan, currentFocus, planContext, recentProgress, togglePin } from "../app/domain/plans";
import { recommendations } from "../app/priorities";
import { GoogleSheetsMoveRepository, migrateMoveData, sheetRowToItem } from "../app/repository";
import { PlaceholderResaleHubProvider } from "../app/integrations/resale-hub";
import type { MoveItem } from "../app/types";

const plan:CashFlowPlan={
  accounts:[{id:"checking",label:"Checking",balance:1000,updatedAt:"2026-09-16"}],
  resaleBalances:[{platform:"eBay",available:200,pending:75,source:"manual",updatedAt:"2026-09-16",includePendingInProjection:true}],
  entries:[
    {id:"income",label:"Offer income",amount:500,direction:"in",category:"Income",certainty:"Confirmed",includeInProjection:true},
    {id:"ui",label:"Unemployment",amount:300,direction:"in",category:"Unemployment",certainty:"Pending",includeInProjection:true},
    {id:"bill",label:"Car payment",amount:250,direction:"out",category:"Bills",certainty:"Confirmed",includeInProjection:true},
    {id:"move",label:"Trailer",amount:400,direction:"out",category:"Physical Move",certainty:"Estimate",includeInProjection:true},
    {id:"deposit",label:"Deposit",direction:"out",category:"Move In",certainty:"Unknown",includeInProjection:false},
  ],
};

test("cash flow separates conservative and projected positions",()=>{
  const totals=calculateCashFlow(plan);
  assert.equal(totals.availableNow,1200);
  assert.equal(totals.conservativePosition,1450);
  assert.equal(totals.expectedIncoming,375);
  assert.equal(totals.projectedMovePosition,1425);
});

test("unknown values are reported and excluded from totals",()=>{
  const totals=calculateCashFlow(plan);
  assert.deepEqual(totals.unknownEntries.map(entry=>entry.id),["deposit"]);
  assert.equal(totals.moveAndMoveInCosts,400);
});

test("available and pending resale money are not treated the same",()=>{
  const totals=calculateCashFlow(plan);
  assert.equal(totals.availableNow,1200);
  assert.equal(totals.expectedIncoming,375);
});

test("marking expected money received prevents double counting",()=>{
  const received=markCashEntryReceived(plan,"ui","2026-09-16T12:00:00Z");
  assert.equal(calculateCashFlow(received).expectedIncoming,75);
});

const task=(partial:Partial<MoveItem>&Pick<MoveItem,"id"|"title">):MoveItem=>({description:"",phase:"Pre-Move",type:"Task",workArea:"Housing",status:"Not Started",importance:"Normal",schedule:"Now",kind:"Action",createdAt:"2026-09-16",updatedAt:"2026-09-16",...partial});

test("recommendations suppress waiting work and activate after its dependency is done",()=>{
  const prerequisite=task({id:"proof",title:"Get proof"});
  const dependent=task({id:"apply",title:"Apply for apartment",dependency:"proof",importance:"Important"});
  assert.deepEqual(recommendations([prerequisite,dependent],5).map(item=>item.id),["proof"]);
  const completed={...prerequisite,status:"Done" as const};
  assert.deepEqual(recommendations([completed,dependent],5).map(item=>item.id),["apply"]);
});

test("schema 10 readiness data migrates into planning workspaces without losing browser data",()=>{
  const stored={
    schemaVersion:10,
    readiness:[{id:"move-window",title:"Move Window",question:"?",state:"Active"}],
    moveRoutes:[{id:"route-trailer",readinessGateId:"physical-move",title:"Trailer",purpose:"",state:"No Action Yet"}],
    watches:[{id:"watch-move-window",title:"Timing",reason:"",state:"Watching" as const},{id:"watch-physical-move",title:"Old title",reason:"",state:"Watching" as const}],
    cashFlow:{accounts:[{id:"move-fund-account",label:"Move fund",balance:1500,updatedAt:"2026-07-24"}],entries:[],resaleBalances:[]},
    items:[task({id:"health-continuity",title:"Get my Vyvanse pharmacy history and a note from Dr. Dippo"}),task({id:"mine",title:"My own task"})],
  };
  const migrated=migrateMoveData(stored as never);
  assert.equal(migrated.schemaVersion,11);
  assert.equal("readiness" in migrated,false);
  assert.deepEqual(migrated.plans.map(item=>item.id),["cash-flow","secure-home","physical-move","continuity"]);
  assert.equal(migrated.cashFlow.accounts[0].balance,1500);
  const health=migrated.items.find(item=>item.id==="health-continuity")!;
  assert.equal(health.title,"Get my Vyvanse pharmacy history and a note from Dr. Dippo");
  assert.equal(planContext(health,migrated),"Medication & Essential Continuity · Gather History");
  assert.ok(migrated.items.some(item=>item.id==="mine"));
  assert.ok(migrated.items.some(item=>item.id==="mc-talk-provider"),"new plan tasks are added once");
  assert.equal(migrated.watches.some(watch=>watch.id==="watch-move-window"),false);
  assert.equal(migrated.watches.find(watch=>watch.id==="watch-physical-move")!.planId,"physical-move");
  assert.equal(migrated.planRoutes.find(route=>route.id==="route-trailer")!.planId,"physical-move");
  const again=migrateMoveData({...migrated,items:migrated.items.filter(item=>item.id!=="mc-talk-provider")});
  assert.equal(again.items.some(item=>item.id==="mc-talk-provider"),false,"deleted seed tasks do not come back");
});

test("stale seed text and briefly deployed placeholders become accurate values",()=>{
  const migrated=migrateMoveData({schemaVersion:10,
    profile:{destination:"Chicago first · Denver remains a backup",reason:"My own words"} as never,
    items:[task({id:"check-unemployment",title:"Check the unemployment claim"})],
    cashFlow:{accounts:[{id:"move-fund-account",label:"Move fund",balance:1500,updatedAt:"2026-07-24"}],resaleBalances:[],entries:[{id:"unemployment-expected",label:"Unemployment",direction:"in",category:"Unemployment",certainty:"Unknown",includeInProjection:false,notes:"Enter the expected amount and timing once the claim is confirmed.",source:"manual"}]},
  });
  assert.equal(migrated.profile.destination,"Chicago leading · Denver + Remote remain open");
  assert.equal(migrated.profile.reason,"My own words");
  assert.equal(migrated.items.find(item=>item.id==="check-unemployment")!.title,"Check the Maryland unemployment claim");
  assert.equal(migrated.cashFlow.entries[0].amount,860);
});

test("schema 9 data migrates without losing items or move cash",()=>{
  const migrated=migrateMoveData({schemaVersion:9,moveFund:{current:1777} as never,items:[task({id:"kept",title:"Keep me"})]});
  assert.equal(migrated.schemaVersion,11);
  assert.equal(migrated.items[0].id,"kept");
  assert.equal(migrated.cashFlow.accounts[0].balance,1777);
  assert.equal(migrated.items[0].type,"Task");
});

test("current focus puts pinned tasks first and never shows triggered or later work",()=>{
  const data=migrateMoveData({});
  const focus=currentFocus(data,5);
  assert.ok(focus.length>0&&focus.length<=5);
  assert.ok(focus.every(item=>!["move-plan","lease","denver-hybrid","pm-final-quote","income-proof"].includes(item.id)));
  assert.equal(currentFocus(togglePin(data,"packing"),5)[0].id,"packing");
});

test("pinning stops at five tasks",()=>{
  let data=migrateMoveData({});
  data.items.filter(item=>item.type==="Task"&&item.status!=="Done").slice(0,6).forEach(item=>{data=togglePin(data,item.id)});
  assert.equal(data.items.filter(item=>item.pinnedToFocus).length,5);
});

test("action plan groups triggered work by what it is waiting for",()=>{
  const data=migrateMoveData({});
  const physical=actionPlan("physical-move",data);
  assert.ok(physical.now.some(item=>item.id==="pm-decide-what-comes"));
  const housing=physical.triggered.find(group=>group.trigger==="When housing is confirmed");
  assert.ok(housing&&housing.items.some(item=>item.id==="pm-final-quote"));
  assert.ok(physical.done.some(item=>item.id==="pm-trailer-researched"));
});

test("recent progress mixes completed work and decisions",()=>{
  const entries=recentProgress(migrateMoveData({}),30);
  assert.ok(entries.some(entry=>entry.kind==="Decided"&&entry.title.startsWith("Leading destination")));
  assert.ok(entries.some(entry=>entry.id==="attic"));
});

test("sheet rows normalize Goal Project and Task fields",()=>{
  const item=sheetRowToItem({ID:"row-1",Title:"Rental proof",Phase:"Pre-Move",Type:"Goal",Area:"Housing",Status:"In Progress","Plan ID":"secure-home","Action Stage":"Now",Pinned:"TRUE"},0);
  assert.equal(item.type,"Goal");
  assert.equal(item.status,"In Progress");
  assert.equal(item.workArea,"Housing");
  assert.equal(item.planId,"secure-home");
  assert.equal(item.actionStage,"Now");
  assert.equal(item.pinnedToFocus,true);
});

test("Google Sheets failure falls back safely to local data",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw new Error("offline")};
  const repository=new GoogleSheetsMoveRepository("https://example.invalid");
  const data=await repository.load();
  assert.equal(data.schemaVersion,11);
  assert.equal(repository.getSyncState().mode,"offline");
  globalThis.fetch=original;
});

test("Resale Hub placeholder fails safely without fake balances",async()=>{
  const provider=new PlaceholderResaleHubProvider();
  assert.equal(provider.getConnectionState().status,"Disconnected");
  assert.deepEqual((await provider.getBalances()).platforms,[]);
});
