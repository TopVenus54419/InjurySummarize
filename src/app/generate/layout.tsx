import "~/styles/globals.css";

import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Incident Analysis",
  description:
    "Professional incident analysis and legal reporting platform for workplace incidents and compliance.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="flex flex-col">{children}</main>;
}
