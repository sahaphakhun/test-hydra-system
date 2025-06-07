"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const material_1 = require("@mui/material");
const theme_1 = __importDefault(require("@/theme"));
function MuiThemeProvider({ children }) {
    return (<material_1.ThemeProvider theme={theme_1.default}>
      <material_1.CssBaseline />
      {children}
    </material_1.ThemeProvider>);
}
exports.default = MuiThemeProvider;
