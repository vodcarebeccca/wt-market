import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "WT Market Admin",
  description: "Panel admin WT Market",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
