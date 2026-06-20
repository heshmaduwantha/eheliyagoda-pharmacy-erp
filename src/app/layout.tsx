import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Medisquare Pharmacy + Clinic", template: "%s · Medisquare" },
  description: "Secure pharmacy and clinic operations platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
