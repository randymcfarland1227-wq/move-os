import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { migrateMoveData, SCHEMA_VERSION } from "../app/repository";
import { currentFocus, isDoableNow, lockedGroups, nowList, toggleDone } from "../app/domain/plans";
import { gateChoice, gatesFor, lockReason, milestoneReached } from "../app/domain/gates";
import { buildMoveSnapshot } from "../app/life-hub-bridge";
import type { MoveData, MoveItem } from "../app/types";

const fixture=()=>JSON.parse(readFileSync(resolve(import.meta.dirname,"fixtures/schema11-saved.json"),"utf8")) as MoveData;
const byId=(data:MoveData,id:string)=>data.items.find(item=>item.id===id)!;
const finish=(data:MoveData,...ids:string[])=>ids.reduce((current,id)=>toggleDone(current,id),data);

/** A realistic schema-11 browser save: the old defaults plus things Randy changed by hand. */
function legacyWithEdits(){
  const saved=fixture();
  const edit=(id:string,patch:Partial<MoveItem>)=>{saved.items=saved.items.map(item=>item.id===id?{...item,...patch}:item)};
  edit("cf-list-resale",{status:"Done",completedAt:"2026-09-30T15:00:00.000Z"});
  edit("mc-save-contacts",{title:"Save Dr. Dippo + CVS numbers in my phone",notes:"CVS on York Rd"});
  edit("apply-remote-roles",{pinnedToFocus:true,notes:"3 applications a day"});
  edit("pm-final-quote",{triggerText:"When I know the trailer size"});
  edit("oil-change",{dueDate:"2026-10-20",title:"Oil change at Jiffy Lube"});
  edit("packing",{parentId:undefined,actionStage:"Now"});
  saved.items=saved.items.filter(item=>item.id!=="cosmetic-car");
  saved.items.push({id:"custom-1",title:"Ask Meg about Chicago neighborhoods",description:"My own idea",phase:"Pre-Move",type:"Task",workArea:"Housing",status:"Not Started",importance:"Normal",kind:"Action",actionStage:"Now",createdAt:"2026-10-01",updatedAt:"2026-10-01"});
  saved.profile={...saved.profile,reason:"My own reason for moving"};
  saved.cashFlow.accounts[0].balance=1650;
  saved.moveFund={...saved.moveFund,current:1650};
  return saved;
}

test("schema 11 browser data upgrades to gates without losing anything",()=>{
  const before=legacyWithEdits();
  const after=migrateMoveData(structuredClone(before));
  assert.equal(after.schemaVersion,SCHEMA_VERSION);
  assert.equal(SCHEMA_VERSION,12);
  // Nothing removed: every saved item survives, deleted defaults stay deleted, one goal is added.
  before.items.forEach(item=>assert.ok(after.items.some(next=>next.id===item.id),`kept ${item.id}`));
  assert.equal(after.items.length,before.items.length+1);
  assert.ok(after.items.some(item=>item.id==="save-for-move"&&item.type==="Goal"));
  assert.equal(after.items.some(item=>item.id==="cosmetic-car"),false);
  // Randy's own edits win.
  assert.equal(byId(after,"cf-list-resale").status,"Done");
  assert.equal(byId(after,"cf-list-resale").completedAt,"2026-09-30T15:00:00.000Z");
  assert.equal(byId(after,"mc-save-contacts").title,"Save Dr. Dipo + CVS numbers in my phone");
  assert.equal(byId(after,"mc-save-contacts").notes,"CVS on York Rd");
  assert.equal(byId(after,"apply-remote-roles").pinnedToFocus,true);
  assert.equal(byId(after,"apply-remote-roles").notes,"3 applications a day");
  assert.equal(byId(after,"pm-final-quote").triggerText,"When I know the trailer size");
  assert.equal(byId(after,"pm-final-quote").actionStage,"Triggered");
  assert.equal(byId(after,"oil-change").title,"Oil change at Jiffy Lube");
  assert.equal(byId(after,"oil-change").dueDate,"2026-10-20");
  assert.equal(byId(after,"packing").actionStage,"Now");
  const custom=before.items.find(item=>item.id==="custom-1")!;
  (Object.keys(custom) as (keyof MoveItem)[]).forEach(key=>assert.deepEqual(byId(after,"custom-1")[key],custom[key],`custom item keeps ${key}`));
  assert.equal(byId(after,"custom-1").title,"Ask Meg about Chicago neighborhoods");
  assert.equal(byId(after,"custom-1").gates,undefined);
  assert.equal(after.profile.reason,"My own reason for moving");
  assert.equal(after.cashFlow.accounts[0].balance,1650);
  assert.equal(after.moveFund.current,1650);
  // Untouched defaults move to the new plan.
  const registration=byId(after,"registration");
  assert.equal(registration.title,"Renew car registration");
  assert.equal(registration.dueDate,"2026-11-01");
  assert.equal(registration.relationship,undefined);
  assert.equal(byId(after,"health-continuity").title,"Get my Vyvanse prescription history and a note from Dr. Dipo");
  assert.equal(byId(after,"income-evidence").title,"Source income");
  assert.equal(byId(after,"credit-plan").title,"Fix credit");
  assert.equal(byId(after,"pm-loading-access").actionStage,"Next");
  assert.equal(byId(after,"pm-loading-access").triggerText,undefined);
  assert.equal(after.profile.workingMoveWindow,"After the goals");
  assert.equal(after.profile.targetMoveDate,"");
  assert.equal(after.assumptions.find(item=>item.id==="assumption-window")!.value,"After the goals");
  assert.ok(!JSON.stringify(after).includes("Dippo"));
  // Running the migration again changes nothing.
  const plain=(value:unknown)=>JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(migrateMoveData(structuredClone(after))),plain(after));
});

test("a user-changed profile window and description are not overwritten",()=>{
  const saved=fixture();
  saved.profile={...saved.profile,workingMoveWindow:"Early December",targetMoveDate:"2026-12-05"};
  saved.items=saved.items.map(item=>item.id==="registration"?{...item,description:"Maryland MVA, renew online"}:item);
  const after=migrateMoveData(saved);
  assert.equal(after.profile.workingMoveWindow,"Early December");
  assert.equal(after.profile.targetMoveDate,"2026-12-05");
  assert.equal(byId(after,"registration").description,"Maryland MVA, renew online");
  assert.equal(byId(after,"registration").title,"Renew car registration");
});

test("only the three goals and ungated steps are doable now; the rest is locked with a reason",()=>{
  const data=migrateMoveData(legacyWithEdits());
  const now=nowList(data).map(item=>item.id);
  for(const id of ["apply-remote-roles","check-unemployment","update-current-cash","cf-october-bills","mc-save-contacts","oil-change","registration","custom-1"]) assert.ok(now.includes(id),`${id} doable now`);
  for(const id of ["health-continuity","mc-talk-provider","family-routine","pm-decide-what-comes","packing","pm-final-quote","pm-loading-access","credit-explanation","insurance","family-transport"]) assert.ok(!now.includes(id),`${id} locked`);
  assert.equal(lockReason(byId(data,"health-continuity"),data.items),"After Ready to search");
  assert.equal(lockReason(byId(data,"mc-talk-provider"),data.items),"After Ready to search");
  assert.equal(lockReason(byId(data,"pm-decide-what-comes"),data.items),"After Lease signed");
  assert.equal(lockReason(byId(data,"packing"),data.items),"After Lease signed");
  assert.equal(lockReason(byId(data,"registration"),data.items),undefined);
  assert.ok(currentFocus(data,5).every(item=>!lockReason(item,data.items)));
  const reasons=lockedGroups(data).map(group=>group.reason);
  assert.deepEqual([...reasons].sort(),["After Lease signed","After Ready to search"]);
});

test("reaching the three goals unlocks search work; signing the lease unlocks the move",()=>{
  let data=migrateMoveData({});
  assert.equal(milestoneReached("ready-to-search",data.items),false);
  data=finish(data,"income-evidence","save-for-move");
  assert.equal(isDoableNow(byId(data,"health-continuity"),data.items),false,"two of three goals is not enough");
  data=finish(data,"credit-plan");
  assert.equal(milestoneReached("ready-to-search",data.items),true);
  assert.equal(isDoableNow(byId(data,"health-continuity"),data.items),true);
  assert.equal(isDoableNow(byId(data,"mc-talk-provider"),data.items),true);
  assert.equal(isDoableNow(byId(data,"family-routine"),data.items),true);
  assert.equal(isDoableNow(byId(data,"pm-decide-what-comes"),data.items),false);
  data=finish(data,"lease");
  assert.equal(isDoableNow(byId(data,"pm-decide-what-comes"),data.items),true);
  assert.equal(isDoableNow(byId(data,"pm-final-quote"),data.items),true);
  assert.equal(isDoableNow(byId(data,"packing"),data.items),true);
});

test("an item can be gated on a specific item and the editor choices round-trip",()=>{
  assert.deepEqual(gatesFor("now"),undefined);
  assert.deepEqual(gatesFor("ready-to-search"),["ready-to-search"]);
  assert.deepEqual(gatesFor("item","oil-change"),["oil-change"]);
  assert.deepEqual(gateChoice({gates:["lease-signed"]}),{choice:"lease-signed"});
  assert.deepEqual(gateChoice({gates:["oil-change"]}),{choice:"item",itemId:"oil-change"});
  let data=migrateMoveData({});
  data={...data,items:[...data.items,{...byId(data,"oil-change"),id:"after-oil",title:"Road trip check",gates:["oil-change"],dueDate:undefined}]};
  assert.equal(lockReason(byId(data,"after-oil"),data.items),"After Get a pre-move oil change");
  data=finish(data,"oil-change");
  assert.equal(lockReason(byId(data,"after-oil"),data.items),undefined);
});

test("the Life Hub snapshot lists only doable-now tasks and shows goals as featured, non-checkable items",()=>{
  const data=migrateMoveData(legacyWithEdits());
  const snapshot=buildMoveSnapshot(data);
  const ids=snapshot.tasks.map(task=>task.id);
  assert.equal(snapshot.source,"move");
  assert.ok(ids.includes("apply-remote-roles"));
  assert.ok(!ids.includes("pm-decide-what-comes"));
  assert.ok(!ids.includes("health-continuity"));
  assert.ok(!ids.includes("income-evidence"),"goals are not tasks");
  assert.ok(snapshot.tasks.every(task=>task.status==="open"));
  assert.equal(snapshot.metrics.openTasks,snapshot.tasks.length);
  assert.ok(snapshot.metrics.lockedTasks>0);
  assert.equal(typeof snapshot.metrics.completedTasks,"number");
  const goals=snapshot.featured.filter(item=>item.completable===false).map(item=>item.id);
  assert.deepEqual(goals,["income-evidence","save-for-move","credit-plan"]);
  assert.ok(snapshot.featured.some(item=>item.id==="apply-remote-roles"&&item.completable),"pinned doable tasks stay featured");
  assert.match(snapshot.featured.find(item=>item.id==="save-for-move")!.detail,/\$1,650 of \$2,500/);
  assert.ok(typeof snapshot.refreshedAt==="string");
});
