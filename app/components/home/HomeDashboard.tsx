"use client";

import type { MoveData, MoveItem } from "../../types";
import { calculateCashFlow } from "../../domain/cash-flow";
import { CurrentFocus } from "./CurrentFocus";
import { BigPlanOverview } from "./BigPlanOverview";
import { RecentProgress } from "./RecentProgress";

interface Props {
  data: MoveData;
  update: (data: MoveData) => void;
  editItem: (item: MoveItem) => void;
  openPlan: (id: string) => void;
  openPreMove: () => void;
  openCashFlow: () => void;
  openApartments: () => void;
  openReferences: () => void;
}

const money = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const longDate = (value:string) => new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric"}).format(new Date(`${value}T12:00:00`));
const daysUntil = (value:string) => Math.max(0,Math.ceil((new Date(`${value}T12:00:00`).getTime()-Date.now())/86400000));

export function HomeDashboard({data,update,editItem,openPlan,openPreMove,openCashFlow,openApartments,openReferences}:Props){
  const totals=calculateCashFlow(data.cashFlow);
  const {profile}=data;
  const confirmed=profile.moveWindowStatus==="Confirmed Date"&&profile.confirmedMoveDate;
  const [lead,...others]=profile.destination.split("·").map(part=>part.trim());
  return <div className="page memory-home">
    <header className="move-context-header">
      <div><p className="eyebrow">Randy’s Move</p><h1>{lead||"Chicago leading"}</h1>{others.length>0&&<p className="route-line">{others.join(" · ")}</p>}</div>
      {confirmed
        ?<div className="window-note confirmed"><span>Move Day</span><b>{longDate(profile.confirmedMoveDate!)}</b><small>{daysUntil(profile.confirmedMoveDate!)} days away</small></div>
        :<div className="window-note"><span>Working move window</span><b>{profile.workingMoveWindow||"End of October"}</b><small>Working target — not confirmed</small></div>}
    </header>
    <aside className="north-star"><span>Why I’m moving</span><p>{profile.reason}</p></aside>

    <CurrentFocus data={data} update={update} edit={editItem} openPreMove={openPreMove}/>
    <BigPlanOverview data={data} openPlan={openPlan}/>
    <RecentProgress data={data} edit={editItem}/>

    <section className="quiet-tools"><h2>Tools</h2><div><button onClick={openApartments}><b>Apartment Search</b><small>{data.apartments.length} homes saved</small></button><button onClick={openCashFlow}><b>Cash Flow</b><small>{money(totals.availableNow)} available now</small></button><button onClick={openReferences}><b>References</b><small>Context without more tasks</small></button><button disabled><b>Resale Hub Sync</b><small>Coming after the balance endpoint</small></button></div></section>
  </div>;
}
