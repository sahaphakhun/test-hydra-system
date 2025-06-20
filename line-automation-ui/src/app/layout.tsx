import type { Metadata } from "next";
import "./globals.css";
import MuiThemeProvider from "@/MuiThemeProvider";
import Navbar from "@/components/layout/Navbar";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export const metadata: Metadata = {
  title: "LINE Automation System",
  description: "ระบบจัดการบัญชี LINE สำหรับงาน Automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased bg-gray-50 min-h-screen">
        <MuiThemeProvider>
          <WebSocketProvider>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 64px)' }}>
              {children}
            </main>
          </WebSocketProvider>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
