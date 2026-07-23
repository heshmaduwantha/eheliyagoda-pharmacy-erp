import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Medisquare Pharmacy + Clinic", template: "%s · Medisquare" },
  description: "Secure pharmacy and clinic operations platform",
  robots: { index: false, follow: false, nocache: true },
};

import { Toaster } from "sonner";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
