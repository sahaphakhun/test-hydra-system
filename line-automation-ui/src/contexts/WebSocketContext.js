"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = exports.WebSocketProvider = void 0;
const react_1 = __importStar(require("react"));
const WebSocketContext = (0, react_1.createContext)({
    send: () => { },
    isConnected: false,
});
const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_URL;
function WebSocketProvider({ children }) {
    const socketRef = (0, react_1.useRef)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    // connect once
    (0, react_1.useEffect)(() => {
        if (!WS_ENDPOINT) {
            console.warn('NEXT_PUBLIC_WS_URL is not defined, WebSocket disabled');
            return;
        }
        const socket = new WebSocket(WS_ENDPOINT);
        socketRef.current = socket;
        socket.onopen = () => setIsConnected(true);
        socket.onclose = () => setIsConnected(false);
        socket.onerror = console.error;
        return () => {
            socket.close();
        };
    }, []);
    const send = (0, react_1.useCallback)((data) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(data);
        }
    }, []);
    return (<WebSocketContext.Provider value={{ send, isConnected }}>
      {children}
    </WebSocketContext.Provider>);
}
exports.WebSocketProvider = WebSocketProvider;
const useWebSocket = () => (0, react_1.useContext)(WebSocketContext);
exports.useWebSocket = useWebSocket;
