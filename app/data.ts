import type { MoveData, MoveItem } from "./types";

const today = new Date().toISOString().slice(0, 10);
const item = (partial: Partial<MoveItem> & Pick<MoveItem, "id" | "title" | "area" | "section">): MoveItem => ({
  description: "", status: "Not started", priority: "Someday", timing: "Now",
  createdAt: today, updatedAt: today, ...partial,
});

export const seedData: MoveData = {
  profile: {
    reason: "I’m moving toward a life with more privacy, creativity, nature, meaningful connection, and financial peace.",
    destination: "A city that feels like room to breathe", targetMoveDate: "2027-05-15", backupDate: "2027-07-01",
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
  money: [
    { id:"saved", label:"Current move savings", current:7200, target:12000, included:"Cash reserved only for the move", uncertain:"Final destination costs" },
    { id:"deposit", label:"Deposit + first month", current:3200, target:4800, included:"Estimated deposit and first month" },
    { id:"fees", label:"Application fees", current:300, target:500, included:"Applications and admin fees" },
    { id:"pet", label:"Dog costs", current:450, target:800, included:"Deposit, travel, first supplies" },
    { id:"move", label:"Physical move", current:900, target:1800, included:"Vehicle, fuel, helpers, supplies" },
    { id:"cushion", label:"Protected cushion", current:2350, target:4100, included:"Post-move breathing room", uncertain:"First paycheck timing" },
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
