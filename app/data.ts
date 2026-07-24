import type { MoveData, MoveItem } from "./types";

const today = new Date().toISOString().slice(0, 10);
const item = (partial: Partial<MoveItem> & Pick<MoveItem, "id" | "title" | "area" | "section">): MoveItem => ({
  description: "", status: "Not started", priority: "Someday", timing: "Now",
  createdAt: today, updatedAt: today, ...partial,
});

export const seedData: MoveData = {
  schemaVersion: 2,
  profile: {
    reason: "I’m moving toward a life with more privacy, creativity, nature, meaningful connection, and financial peace.",
    destination: "A city that feels like room to breathe", targetMoveDate: "2026-10-24", backupDate: "2026-10-31",
    phase: "Foundation", currentUnlock: "Confirm whether my current role can become fully remote.", protectedMonth: true,
  },
  items: [
    item({ id:"remote-policy", title:"Research out-of-state remote-work policy", description:"Find the right policy and identify who can confirm it.", area:"Build", section:"Post-Move Income", status:"In motion", priority:"Income", timing:"Now", unlocks:["remote-case","rental-ready"] }),
    item({ id:"remote-case", title:"Prepare a calm remote-work case", description:"Connect my work record, team coverage, and a practical transition plan.", area:"Build", section:"Post-Move Income", priority:"Income", timing:"Now", dependency:"remote-policy", unlocks:["rental-ready"] }),
    item({ id:"rental-ready", title:"Assemble rental-readiness folder", description:"ID, pay stubs, references, dog records, and any explanation letters.", area:"Build", section:"Rental Readiness", priority:"Housing", timing:"Prepare early", dependency:"remote-case", unlocks:["apartments"] }),
    item({ id:"apartments", title:"Begin serious apartment search", area:"Build", section:"Housing and Lease", priority:"Housing", timing:"After the lease", dependency:"rental-ready" }),
    item({ id:"lease", title:"Sign the lease", area:"Build", section:"Housing and Lease", priority:"Housing", timing:"After the lease", dependency:"apartments", unlocks:["utilities","packing","movers"] }),
    item({ id:"utilities", title:"Schedule utilities and internet", area:"Build", section:"Land Softly", priority:"Deadline", timing:"After the lease", dependency:"lease" }),
    item({ id:"packing", title:"Begin packing in stages", area:"Build", section:"Physical Move", priority:"Deadline", timing:"After the lease", dependency:"lease" }),
    item({ id:"movers", title:"Book movers or rental vehicle", area:"Build", section:"Physical Move", priority:"Deadline", timing:"After the lease", dependency:"lease" }),
    item({ id:"car", title:"Schedule safety-related car inspection", description:"Ask for a safety-first estimate; cosmetic work can wait.", area:"Clear", section:"Car, Documents and Responsibilities", status:"Not started", priority:"Safety", timing:"Now" }),
    item({ id:"toll", title:"Resolve old toll notice", description:"Confirm the balance and stop any additional fees.", area:"Clear", section:"Money, Credit and Old Obligations", status:"Waiting", priority:"Money", timing:"Now" }),
    item({ id:"family", title:"Help Mom outline a home-repair plan", description:"My role is to help create a plan—not carry the whole project.", area:"Clear", section:"Family: What I Can Help With", status:"In motion", priority:"Relief", timing:"Now", notes:"My part is complete when she has three estimates and a next step." }),
    item({ id:"goodbye", title:"Plan a quiet goodbye day with family", area:"Clear", section:"Closure Before I Leave", status:"Not started", priority:"Relief", timing:"Prepare early" }),
    item({ id:"cosmetic", title:"Cosmetic car paint repair", area:"Clear", section:"Allowed to Wait", status:"Good enough", priority:"Someday", timing:"Allowed to wait" }),
    item({ id:"records", title:"Request dog vaccination record", area:"Build", section:"Land Softly", status:"Settled", priority:"Housing", timing:"Prepare early" }),
    item({ id:"music", title:"Find one music space to visit", description:"A low-pressure door to knock on after arrival.", area:"Become", section:"Community and Belonging", priority:"Relief", timing:"After arrival" }),
    item({ id:"tuesday", title:"Describe an ordinary Tuesday", description:"Write what work, rest, movement, and connection feel like.", area:"Become", section:"My Fuel Source", status:"In motion", priority:"Relief", timing:"Now" }),
  ],
  moveFund: {
    current:1500, workingTarget:3600, fullTarget:5800, status:"Known",
    source:"Randall.xlsx · confirmed balance", confirmedAt:"2026-07-24",
  },
  money: [
    { id:"lease", label:"Lease & move-in", current:0, target:3450, included:"Down payment, first month, application fee, utility deposit", status:"Estimate", source:"Move Sav COG Estimate · B4:B7 + D4", uncertain:"Actual lease terms" },
    { id:"move", label:"Physical move", current:0, target:150, included:"Truck rental or shipping", status:"Estimate", source:"Move Sav COG Estimate · D3", uncertain:"Moving method and quotes" },
    { id:"loose", label:"Essential loose ends", current:0, target:0, included:"Only liabilities that affect safety, legality, or rental readiness", status:"Need to think", source:"Credit Matrix + Non-Credit", uncertain:"Which obligations must clear before moving" },
    { id:"health", label:"Health preparation", current:0, target:0, included:"Medical, dental, prescriptions, records, and dog preparation", status:"Need information", source:"RestockPurchases · health and dog rows", uncertain:"Appointments and provider guidance" },
    { id:"home", label:"Home essentials", current:0, target:0, included:"First 72 hours and first-month essentials only", status:"Need to think", source:"RestockPurchases + Watchlist", uncertain:"Apartment measurements and what to bring" },
    { id:"cushion", label:"Protected cushion", current:0, target:2200, included:"One rent month, two utility cycles, and two car/insurance cycles", status:"Estimate", source:"Move Sav COG Estimate · E3:F7", uncertain:"First-paycheck timing" },
    { id:"travel", label:"Holiday & travel", current:0, target:0, included:"Visits, holidays, and post-move travel commitments", status:"Need information", source:"RestockPurchases + Paylater", uncertain:"Dates, purpose, and expected costs" },
  ],
  routes: [
    { id:"r1", name:"Stay & go fully remote", subtitle:"Preferred route", active:true, status:"Exploring policy", details:["Research policy","Prepare remote-work case","Choose conversation date","Get written approval","Confirm employment verification"] },
    { id:"r2", name:"New fully remote role", subtitle:"Backup route", active:false, status:"Ready if needed", details:["Set salary floor","Choose job functions","Application start date","Track interviews","Confirm housing-useful offer letter"] },
    { id:"r3", name:"Hybrid in destination", subtitle:"Alternate route", active:false, status:"Held in reserve", details:["Set commute radius","Research work locations","Compare salary","Check parking or transit","Map housing implications"] },
  ],
  vault: [
    { id:"v1", title:"Vehicle inspection estimate", category:"Car estimates", url:"https://example.com", date:today, notes:"Reference only — no sensitive information." },
    { id:"v2", title:"Rental document checklist", category:"Rental documents", url:"https://example.com", date:today, notes:"Working list for applications." },
  ],
  reflections: [
    { id:"away", prompt:"What am I moving away from?", value:"A life with too little room for privacy, rest, and creativity." },
    { id:"toward", prompt:"What am I moving toward?", value:"A grounded home and a city where I can grow roots without shrinking." },
    { id:"tuesday", prompt:"What do I want an ordinary Tuesday to feel like?", value:"Unhurried, useful, creative, connected, and mine." },
  ],
};
