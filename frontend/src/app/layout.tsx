import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/context/ToastContext";
import { Footer } from "@/components/layout/Footer";
import { COMPANY_NAME, APP_NAME } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Invisible Logistics Layer`,
  description: `Real-time logistics orchestration for SMEs by ${COMPANY_NAME}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="bg-amber-600 text-white text-[10px] sm:text-xs py-1.5 px-4 text-center font-bold tracking-wide uppercase">
          🚨 LogistiQS Live Phase: Beta is concluded. All SME orders must now use the mandatory "Proceed-to-Pay" EFT Settlement Gate for driver activation.
        </div>
        <AuthProvider>
          <ToastProvider>
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
