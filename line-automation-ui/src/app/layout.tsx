import type { Metadata } from "next";
import "./globals.css";
import { WebSocketProvider } from './contexts/WebSocketContext';
import Navbar from './components/layout/Navbar';

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
        <WebSocketProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </WebSocketProvider>
      </body>
    </html>
  );
}
