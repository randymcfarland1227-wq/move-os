import type { MoveData, MoveItem } from "./types";

const today = new Date().toISOString().slice(0, 10);
const item = (partial: Partial<MoveItem> & Pick<MoveItem, "id" | "title" | "area" | "section">): MoveItem => ({
  description: "", status: "Not started", priority: "Someday", timing: "Now",
  stage:"Foundation", stream:"Clear", relationship:"Parallel", knowledgeStatus:"Known",
  createdAt: today, updatedAt: today, ...partial,
});

export const seedData: MoveData = {
  schemaVersion: 3,
  profile: {
    reason: "I’m moving toward a life with more privacy, creativity, nature, meaningful connection, and financial peace.",
    destination: "A city that feels like room to breathe", targetMoveDate: "2026-10-24", backupDate: "2026-10-31",
    phase: "Foundation", currentUnlock: "Build rental readiness while keeping the income routes open.", protectedMonth: true,
  },
  items: [
    item({ id:"remote-policy", title:"Keep income routes open", description:"Research remote policy now; choose the final route only when housing timing requires it.", area:"Build", section:"Post-Move Income", status:"In motion", priority:"Income", timing:"Now", stage:"Prepare", stream:"Income", relationship:"Parallel", knowledgeStatus:"Need information" }),
    item({ id:"remote-research", parentId:"remote-policy", title:"Research out-of-state remote-work policy", area:"Build", section:"Post-Move Income", status:"In motion", priority:"Income", timing:"Now", stage:"Prepare", stream:"Income", relationship:"Parallel", knowledgeStatus:"Need information" }),
    item({ id:"remote-case", parentId:"remote-policy", title:"Prepare the remote-work case", description:"Connect work record, team coverage, and a practical transition plan.", area:"Build", section:"Post-Move Income", priority:"Income", timing:"Prepare early", stage:"Prepare", stream:"Income", relationship:"Helpful sequence", knowledgeStatus:"Need to think" }),
    item({ id:"income-decision", parentId:"remote-policy", title:"Choose the final income route", description:"Make this decision closer to the latest date needed for rental approval.", area:"Build", section:"Post-Move Income", priority:"Income", timing:"Prepare early", stage:"Decide", stream:"Income", relationship:"Deferred decision", knowledgeStatus:"Need information" }),
    item({ id:"rental-ready", title:"Build the rental-readiness folder", description:"Learn requirements and gather reusable documents without waiting for the final job choice.", area:"Build", section:"Rental Readiness", priority:"Housing", timing:"Prepare early", stage:"Prepare", stream:"Housing", relationship:"Parallel", knowledgeStatus:"Known", unlocks:["lease"] }),
    item({ id:"rental-id", parentId:"rental-ready", title:"Gather identification", area:"Build", section:"Rental Readiness", priority:"Housing", timing:"Now", stage:"Prepare", stream:"Housing", relationship:"Parallel", knowledgeStatus:"Known" }),
    item({ id:"rental-pay", parentId:"rental-ready", title:"Gather current pay stubs", area:"Build", section:"Rental Readiness", priority:"Housing", timing:"Prepare early", stage:"Prepare", stream:"Housing", relationship:"Parallel", knowledgeStatus:"Known" }),
    item({ id:"rental-dog", parentId:"rental-ready", title:"Gather dog and vaccination records", area:"Build", section:"Rental Readiness", priority:"Housing", timing:"Prepare early", stage:"Prepare", stream:"Housing", relationship:"Parallel", knowledgeStatus:"Known" }),
    item({ id:"rental-income-doc", parentId:"rental-ready", title:"Confirm acceptable income documentation", area:"Build", section:"Rental Readiness", priority:"Housing", timing:"Prepare early", stage:"Decide", stream:"Housing", relationship:"Decision gate", knowledgeStatus:"Need information" }),
    item({ id:"apartments", title:"Explore neighborhoods and apartments", description:"Research and save possibilities now; serious applications come later.", area:"Build", section:"Housing and Lease", priority:"Housing", timing:"Prepare early", stage:"Prepare", stream:"Housing", relationship:"Parallel", knowledgeStatus:"Estimate" }),
    item({ id:"lease", title:"Apply and sign the lease", area:"Build", section:"Housing and Lease", priority:"Housing", timing:"Prepare early", dependency:"rental-ready", stage:"Commit", stream:"Housing", relationship:"Hard dependency", knowledgeStatus:"Waiting on event", unlocks:["utilities","packing","movers"] }),
    item({ id:"utilities", title:"Schedule utilities and internet", area:"Build", section:"Land Softly", priority:"Deadline", timing:"After the lease", dependency:"lease", stage:"Move", stream:"Housing", relationship:"Hard dependency", knowledgeStatus:"Waiting on event" }),
    item({ id:"packing", title:"Pack in stages", area:"Build", section:"Physical Move", priority:"Deadline", timing:"Prepare early", stage:"Prepare", stream:"Clear", relationship:"Helpful sequence", knowledgeStatus:"Known" }),
    item({ id:"movers", title:"Choose and book the moving method", area:"Build", section:"Physical Move", priority:"Deadline", timing:"Prepare early", stage:"Commit", stream:"Clear", relationship:"Decision gate", knowledgeStatus:"Need information" }),
    item({ id:"car", title:"Make the car safe and reliable", description:"Safety first; cosmetic work can wait.", area:"Clear", section:"Car, Documents and Responsibilities", status:"Not started", priority:"Safety", timing:"Now", stage:"Foundation", stream:"Clear", relationship:"Parallel", knowledgeStatus:"Need information" }),
    item({ id:"car-inspection", parentId:"car", title:"Schedule a safety inspection", area:"Clear", section:"Car, Documents and Responsibilities", priority:"Safety", timing:"Now", stage:"Foundation", stream:"Clear", relationship:"Parallel", knowledgeStatus:"Need information" }),
    item({ id:"toll", title:"Resolve move-relevant tickets and tolls", description:"Confirm what affects legality or creates new damage; carry the rest forward.", area:"Clear", section:"Money, Credit and Old Obligations", status:"Waiting", priority:"Money", timing:"Now", stage:"Foundation", stream:"Clear", relationship:"Parallel", knowledgeStatus:"Need information" }),
    item({ id:"family", title:"Help Mom outline a home-repair plan", description:"My role is to help create a plan—not carry the whole project.", area:"Clear", section:"Family: What I Can Help With", status:"In motion", priority:"Relief", timing:"Now", notes:"My part is complete when she has three estimates and a next step." }),
    item({ id:"goodbye", title:"Plan a quiet goodbye day with family", area:"Clear", section:"Closure Before I Leave", status:"Not started", priority:"Relief", timing:"Prepare early" }),
    item({ id:"cosmetic", title:"Cosmetic car paint repair", area:"Clear", section:"Allowed to Wait", status:"Good enough", priority:"Someday", timing:"Allowed to wait" }),
    item({ id:"records", title:"Prepare health and dog continuity", area:"Build", section:"Land Softly", status:"In motion", priority:"Housing", timing:"Prepare early", stage:"Prepare", stream:"Health & dog", relationship:"Parallel", knowledgeStatus:"Need information" }),
    item({ id:"dog-records", parentId:"records", title:"Request dog vaccination record", area:"Build", section:"Land Softly", status:"Settled", priority:"Housing", timing:"Prepare early", stage:"Prepare", stream:"Health & dog", relationship:"Parallel", knowledgeStatus:"Known" }),
    item({ id:"refills", parentId:"records", title:"Plan prescription and medication continuity", area:"Build", section:"Land Softly", priority:"Safety", timing:"Prepare early", stage:"Prepare", stream:"Health & dog", relationship:"Helpful sequence", knowledgeStatus:"Need information" }),
    item({ id:"music", title:"Create one repeated connection to the city", description:"A low-pressure door to knock on after arrival.", area:"Become", section:"Community and Belonging", priority:"Relief", timing:"After arrival", stage:"Land", stream:"Become", relationship:"Parallel", knowledgeStatus:"Need to think" }),
    item({ id:"tuesday", title:"Describe the life I am moving toward", description:"Start with an ordinary Tuesday: work, rest, movement, creativity, and connection.", area:"Become", section:"My Fuel Source", status:"In motion", priority:"Relief", timing:"Now", stage:"Foundation", stream:"Become", relationship:"Informational", knowledgeStatus:"Need to think" }),
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
