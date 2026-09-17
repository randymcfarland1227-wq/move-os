import type { Metadata } from "next";
import "./globals.css";
import "./system.css";
import "./plans.css";

export const metadata:Metadata={
  title:"Randy's Move OS",
  description:"Randy's calm command center for the move to Chicago.",
  icons:{icon:"/favicon.svg"},
  metadataBase:new URL("https://randymcfarland1227-wq.github.io/move-os/"),
  openGraph:{title:"Randy's Move OS",description:"A Chicago-first plan for income, credit, housing, and a softer landing.",images:[{url:"/move-os/og.png",width:1200,height:630,alt:"Randy's plan for moving toward a new home"}]},
  twitter:{card:"summary_large_image",title:"Randy's Move OS",description:"A Chicago-first plan for income, credit, housing, and a softer landing.",images:["/move-os/og.png"]},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
