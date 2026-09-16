import assert from "node:assert/strict";
import test from "node:test";
import { calculateCashFlow, markCashEntryReceived, type CashFlowPlan } from "../app/domain/cash-flow";
import { deriveReadinessState } from "../app/domain/readiness";
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

const task=(partial:Partial<MoveItem>&Pick<MoveItem,"id"|"title">):MoveItem=>({id:partial.id,title:partial.title,description:"",phase:"Pre-Move",type:"Task",workArea:"Housing",status:"Not Started",importance:"Normal",schedule:"Now",kind:"Action",createdAt:"2026-09-16",updatedAt:"2026-09-16",...partial});

test("recommendations suppress waiting work and activate after its dependency is done",()=>{
  const prerequisite=task({id:"proof",title:"Get proof"});
  const dependent=task({id:"apply",title:"Apply for apartment",dependency:"proof",importance:"Important"});
  assert.deepEqual(recommendations([prerequisite,dependent],5).map(item=>item.id),["proof"]);
  const completed={...prerequisite,status:"Done" as const};
  assert.deepEqual(recommendations([completed,dependent],5).map(item=>item.id),["apply"]);
});

test("readiness mapping keeps physical move in No Action Yet until the lease is done",()=>{
  const data=migrateMoveData({});
  const gate=data.readiness.find(item=>item.id==="physical-move")!;
  assert.equal(deriveReadinessState(gate,data),"No Action Yet");
  data.items=data.items.map(item=>item.id==="lease"?{...item,status:"Done"}:item);
  assert.equal(deriveReadinessState(gate,data),"Active");
});

test("schema 9 data migrates without losing items or move cash",()=>{
  const migrated=migrateMoveData({schemaVersion:9,moveFund:{current:1777} as never,items:[task({id:"kept",title:"Keep me"})]});
  assert.equal(migrated.schemaVersion,10);
  assert.equal(migrated.items[0].id,"kept");
  assert.equal(migrated.cashFlow.accounts[0].balance,1777);
  assert.equal(migrated.items[0].type,"Task");
});

test("sheet rows normalize Goal Project and Task fields",()=>{
  const item=sheetRowToItem({ID:"row-1",Title:"Rental proof",Phase:"Pre-Move",Type:"Goal",Area:"Housing",Status:"In Progress"},0);
  assert.equal(item.type,"Goal");
  assert.equal(item.status,"In Progress");
  assert.equal(item.workArea,"Housing");
});

test("Google Sheets failure falls back safely to local data",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw new Error("offline")};
  const repository=new GoogleSheetsMoveRepository("https://example.invalid");
  const data=await repository.load();
  assert.equal(data.schemaVersion,10);
  assert.equal(repository.getSyncState().mode,"offline");
  globalThis.fetch=original;
});

test("Resale Hub placeholder fails safely without fake balances",async()=>{
  const provider=new PlaceholderResaleHubProvider();
  assert.equal(provider.getConnectionState().status,"Disconnected");
  assert.deepEqual((await provider.getBalances()).platforms,[]);
});
