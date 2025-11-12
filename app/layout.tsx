import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/nav-footer/navbar";
import Footer from "@/nav-footer/footer";


export const metadata: Metadata = {
  title: "DAT Healtcare",
  description: "A telemedicine app where patient meet with doctor virtually",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
