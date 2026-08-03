import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans=DM_Sans({variable:"--font-sans",subsets:["latin"]});
const serif=Fraunces({variable:"--font-serif",subsets:["latin"]});
export const metadata:Metadata={
  title:"Move OS — A gentler way forward",
  description:"A calm, dependency-aware companion for preparing a major move.",
  icons:{icon:"/favicon.svg"},
  metadataBase:new URL("https://move-os-gentle.randymcfarland1227.chatgpt.site"),
  openGraph:{title:"Move OS",description:"One life I am moving toward.",images:[{url:"/og.png",width:1200,height:630,alt:"Move OS celestial journey toward a new home"}]},
  twitter:{card:"summary_large_image",title:"Move OS",description:"One life I am moving toward.",images:["/og.png"]},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
