import type { Metadata } from "next";
import "./globals.css";

export const metadata:Metadata={
  title:"Randy's Move Plan",
  description:"A calm, dependency-aware companion for preparing a major move.",
  icons:{icon:"/favicon.svg"},
  metadataBase:new URL("https://move-os-gentle.randymcfarland1227.chatgpt.site"),
  openGraph:{title:"Randy's Move Plan",description:"A Chicago-first plan for income, credit, housing, and a softer landing.",images:[{url:"/og.png",width:1200,height:630,alt:"Randy's plan for moving toward a new home"}]},
  twitter:{card:"summary_large_image",title:"Randy's Move Plan",description:"A Chicago-first plan for income, credit, housing, and a softer landing.",images:["/og.png"]},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
