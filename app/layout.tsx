import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "GigTrack — Track every rupee you earn",
  description:
    "GigTrack helps Indian gig workers track earnings from Uber, Swiggy, Zomato, Ola, and more. Monitor your monthly income target, expenses, and net earnings all in one place.",
  keywords: ["gig worker", "earnings tracker", "India", "Swiggy", "Uber", "income tracking"],
  openGraph: {
    title: "GigTrack",
    description: "Track every rupee you earn across platforms",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col antialiased bg-[#F5F4EF] text-[#182B2A]">
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
