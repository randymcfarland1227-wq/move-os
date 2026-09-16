import type { MoveData, MoveItem, MovePhase, Status, SyncState, WorkArea } from "./types";
import { seedData } from "./data";

export interface MoveRepository {
  load(): Promise<MoveData>;
  save(data: MoveData): Promise<void>;
  clear(): Promise<void>;
  getSyncState(): SyncState;
}

const KEY = "move-os-v1";
const ENDPOINT_KEY = "move-os-sheet-endpoint";
const goalIds = new Set(["credit-plan","income-evidence","lease"]);
const projectIds = new Set(["family-plan","remote-search","chicago-hybrid","denver-hybrid","application-packet","move-plan","utilities","holiday-plan"]);
type SheetRow={
  ID:string;Title:string;Phase:string;Type:string;Area:string;Status:string;"Parent ID"?:string;"Due Date"?:string;Notes?:string;
  "Current Value"?:number|string;"Target Value"?:number|string;Unit?:string;Blocker?:string;Importance?:string;"Sort Order"?:number|string;"Completed At"?:string;
};

const normalizeStatus=(value?:string):Status=>{
  if(["Completed","Good enough","Secure","Settled","Released","Done"].includes(value||"")) return "Done";
  if(["In motion","In Progress"].includes(value||"")) return "In Progress";
  if(["Waiting","Blocked"].includes(value||"")) return "Blocked";
  return "Not Started";
};

const phaseFor=(item:Partial<MoveItem>):MovePhase=>{
  if(item.phase==="Pre-Move"||item.phase==="Post-Move") return item.phase;
  if(item.area==="Become"||item.section==="Post Arrival"||item.timing==="After arrival"||item.timing==="First 72 hours") return "Post-Move";
  return "Pre-Move";
};

const workAreaFor=(item:Partial<MoveItem>):WorkArea=>{
  if(item.workArea) return item.workArea;
  const section=item.section||"";
  if(item.area==="Become") return section==="Community and Belonging"||section==="People and Relationships"?"Community":"Settling In";
  if(section==="Post Arrival") return "Admin";
  if(section==="Post-Move Income") return "Income";
  if(["Rental Readiness","Preferences in Search","Getting a Place"].includes(section)) return "Housing";
  if(section==="Physical Move — Pre") return "Packing";
  if(section==="Physical Move"||section==="Car, Documents and Responsibilities") return "Logistics";
  if(section==="Pre-Move") return item.id==="holiday-plan"?"Money":"Health + Marvel";
  if(section==="Money, Credit and Old Obligations"||section==="Allowed to Wait") return "Money";
  if(section==="Family: What I Can Help With"||section==="Closure Before I Leave") return "People + Closure";
  return "Admin";
};

const normalizeItem=(raw:Partial<MoveItem>&Pick<MoveItem,"id"|"title">,index:number):MoveItem=>{
  const type=raw.type&&["Goal","Project","Task"].includes(raw.type)?raw.type:goalIds.has(raw.id)?"Goal":projectIds.has(raw.id)?"Project":"Task";
  const title=raw.id==="credit-plan"?"Rental Credit Readiness":raw.id==="income-evidence"?"Housing-Ready Income":raw.id==="lease"?"Secure a Home":raw.title;
  return {
    id:raw.id,
    title,
    description:raw.description||"",
    phase:phaseFor(raw),
    type,
    workArea:workAreaFor(raw),
    status:normalizeStatus(raw.status),
    importance:raw.importance||(!raw.optional&&["Safety","Income","Housing","Deadline","Money"].includes(raw.priority||"")?"Important":"Normal"),
    dueDate:raw.dueDate,
    notes:raw.notes,
    parentId:raw.parentId,
    dependency:raw.dependency,
    blocker:raw.blocker,
    schedule:raw.schedule||(
      raw.timing==="Now"?"Now":raw.timing==="After the lease"||raw.timing==="Allowed to wait"?"Later":raw.timing==="First 72 hours"?"First 72 Hours":raw.timing==="After arrival"?"First Month":"This Week"
    ),
    optional:raw.optional,
    metric:raw.metric||(raw.id==="credit-plan"?{target:625,unit:"credit score"}:undefined),
    decision:raw.decision||(raw.id==="application-packet"?{prompt:"Which housing route fits the evidence I will have?",options:["Standard lease","Sublet"]}:undefined),
    sortOrder:raw.sortOrder??index,
    completedAt:raw.completedAt||(normalizeStatus(raw.status)==="Done"?raw.updatedAt:undefined),
    createdAt:raw.createdAt||new Date().toISOString().slice(0,10),
    updatedAt:raw.updatedAt||new Date().toISOString().slice(0,10),
    kind:raw.kind||"Action",
    referenceFor:raw.referenceFor,
    area:raw.area,
    section:raw.section,
    priority:raw.priority,
    timing:raw.timing,
    cost:raw.cost,
    unlocks:raw.unlocks,
    stage:raw.stage,
    stream:raw.stream,
    relationship:raw.relationship,
    knowledgeStatus:raw.knowledgeStatus,
  };
};

const sheetRowToItem=(row:SheetRow,index:number):MoveItem=>normalizeItem({
  id:String(row.ID),title:String(row.Title||"Untitled"),phase:row.Phase as MoveItem["phase"],type:row.Type as MoveItem["type"],workArea:row.Area as MoveItem["workArea"],status:row.Status as MoveItem["status"],
  parentId:row["Parent ID"]||undefined,dueDate:row["Due Date"]||undefined,notes:row.Notes||undefined,blocker:row.Blocker||undefined,importance:row.Importance as MoveItem["importance"],sortOrder:Number(row["Sort Order"])||index,completedAt:row["Completed At"]||undefined,
  metric:row["Current Value"]!==undefined||row["Target Value"]!==undefined||row.Unit?{current:row["Current Value"]===""?undefined:Number(row["Current Value"]),target:row["Target Value"]===""?undefined:Number(row["Target Value"]),unit:row.Unit||undefined}:undefined,
  kind:"Action",createdAt:isoDate(),updatedAt:isoDate(),
},index);
const itemToSheetRow=(item:MoveItem,index:number):SheetRow=>({ID:item.id,Title:item.title,Phase:item.phase,Type:item.type,Area:item.workArea,Status:item.status,"Parent ID":item.parentId||"","Due Date":item.dueDate||"",Notes:item.notes||"","Current Value":item.metric?.current??"","Target Value":item.metric?.target??"",Unit:item.metric?.unit||"",Blocker:item.blocker||"",Importance:item.importance,"Sort Order":item.sortOrder??index,"Completed At":item.completedAt||""});
function isoDate(){return new Date().toISOString().slice(0,10)}

export const migrateMoveData=(stored:Partial<MoveData>):MoveData=>{
  const base=structuredClone(seedData);
  const rawItems=Array.isArray(stored.items)?stored.items:base.items;
  return {
    ...base,
    ...stored,
    schemaVersion:9,
    profile:{...base.profile,...stored.profile},
    items:rawItems.map((item,index)=>normalizeItem(item,index)),
    moveFund:{...base.moveFund,...stored.moveFund},
    money:stored.money?.length?stored.money:base.money,
    routes:stored.routes?.length?stored.routes:base.routes,
    vault:stored.vault||base.vault,
    reflections:stored.reflections||base.reflections,
    sectionTargets:{...base.sectionTargets,...stored.sectionTargets},
    calendarTargets:{...base.calendarTargets,...stored.calendarTargets},
    apartments:stored.apartments||base.apartments,
    hideCompleted:stored.hideCompleted??true,
  };
};

export class LocalMoveRepository implements MoveRepository {
  private state:SyncState={mode:"local",label:"Saved in this browser",pending:false};
  async load() {
    if(typeof window==="undefined") return migrateMoveData(seedData);
    const stored=window.localStorage.getItem(KEY);
    return stored?migrateMoveData(JSON.parse(stored) as MoveData):migrateMoveData(seedData);
  }
  async save(data:MoveData) {
    if(typeof window!=="undefined") window.localStorage.setItem(KEY,JSON.stringify(data));
    this.state={mode:"local",label:"Saved in this browser",lastSyncedAt:new Date().toISOString(),pending:false};
  }
  async clear() { if(typeof window!=="undefined") window.localStorage.removeItem(KEY); }
  getSyncState(){ return this.state; }
}

// The endpoint is a tiny Apps Script web app connected to "Move Action Items".
// GET returns { data: MoveData }; POST accepts { data: MoveData }. Stable item IDs prevent duplicate rows.
export class GoogleSheetsMoveRepository implements MoveRepository {
  private local=new LocalMoveRepository();
  private state:SyncState={mode:"sheet",label:"Connecting to Move Action Items",pending:false};
  constructor(private endpoint:string){}
  async load(){
    try{
      const response=await fetch(this.endpoint,{headers:{Accept:"application/json"}});
      if(!response.ok) throw new Error(`Sheet returned ${response.status}`);
      const payload=await response.json() as {data?:MoveData;items?:SheetRow[]}|MoveData;
      let data:MoveData;
      const sheetRows=(payload as {items?:SheetRow[]}).items;
      if(Array.isArray(sheetRows)&&sheetRows.every(row=>"ID" in row)){
        const local=await this.local.load();
        const support=local.items.filter(item=>item.kind==="Reference"||item.kind==="Reflection");
        data={...local,items:[...sheetRows.map(sheetRowToItem),...support.filter(item=>!sheetRows.some(row=>row.ID===item.id))],schemaVersion:9};
      }else data=migrateMoveData("data" in payload&&payload.data?payload.data:payload as MoveData);
      await this.local.save(data);
      this.state={mode:"sheet",label:"Move Action Items connected",lastSyncedAt:new Date().toISOString(),pending:false};
      return data;
    }catch(error){
      this.state={mode:"offline",label:"Using the safe browser copy",pending:true,error:error instanceof Error?error.message:"Sheet unavailable"};
      return this.local.load();
    }
  }
  async save(data:MoveData){
    await this.local.save(data);
    this.state={...this.state,pending:true};
    try{
      const rows=data.items.filter(item=>!item.kind||item.kind==="Action").map(itemToSheetRow);
      const response=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({sheet:"Move Action Items",rows})});
      if(!response.ok) throw new Error(`Sheet returned ${response.status}`);
      this.state={mode:"sheet",label:"Move Action Items connected",lastSyncedAt:new Date().toISOString(),pending:false};
    }catch(error){
      this.state={mode:"offline",label:"Change saved safely; Sheet sync pending",pending:true,error:error instanceof Error?error.message:"Sheet unavailable"};
    }
  }
  async clear(){ await this.local.clear(); }
  getSyncState(){ return this.state; }
}

export const getSheetEndpoint=()=>typeof window==="undefined"?"":window.localStorage.getItem(ENDPOINT_KEY)||"";
export const setSheetEndpoint=(value:string)=>{if(typeof window!=="undefined"){if(value.trim())window.localStorage.setItem(ENDPOINT_KEY,value.trim());else window.localStorage.removeItem(ENDPOINT_KEY);}};

class RepositoryRouter implements MoveRepository {
  private active:MoveRepository=new LocalMoveRepository();
  private choose(){const endpoint=getSheetEndpoint();this.active=endpoint?new GoogleSheetsMoveRepository(endpoint):new LocalMoveRepository();return this.active;}
  load(){return this.choose().load();}
  save(data:MoveData){return this.active.save(data);}
  clear(){return this.active.clear();}
  getSyncState(){return this.active.getSyncState();}
}

export const moveRepository:MoveRepository=new RepositoryRouter();
