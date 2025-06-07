"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
require("./globals.css");
const MuiThemeProvider_1 = __importDefault(require("@/MuiThemeProvider"));
const Navbar_1 = __importDefault(require("@/components/layout/Navbar"));
const WebSocketContext_1 = require("@/contexts/WebSocketContext");
exports.metadata = {
    title: "LINE Automation System",
    description: "ระบบจัดการบัญชี LINE สำหรับงาน Automation",
};
function RootLayout({ children, }) {
    return (<html lang="th">
      <body className="antialiased bg-gray-50 min-h-screen">
        <MuiThemeProvider_1.default>
          <WebSocketContext_1.WebSocketProvider>
            <Navbar_1.default />
            <main style={{ minHeight: 'calc(100vh - 64px)' }}>
              {children}
            </main>
          </WebSocketContext_1.WebSocketProvider>
        </MuiThemeProvider_1.default>
      </body>
    </html>);
}
exports.default = RootLayout;
