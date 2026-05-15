import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "APESTOR Dashboard",

  description: "Realtime Trading Community Dashboard",

  icons: {
    icon: "/icon.png",

    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",
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
      <body className="min-h-full flex flex-col bg-black text-white">
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#111111",
              color: "#ffffff",
              border: "1px solid #facc15",
              borderRadius: "16px",
              padding: "14px 18px",
              fontWeight: "600",
              fontSize: "14px",
            },

            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#000000",
              },
            },

            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#000000",
              },
            },
          }}
        />

        {children}
      </body>
    </html>
  );
}
