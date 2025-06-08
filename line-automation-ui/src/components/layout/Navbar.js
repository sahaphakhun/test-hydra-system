"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const material_1 = require("@mui/material");
const links = [
    { href: '/', label: 'หน้าหลัก' },
    { href: '/send-message', label: 'ส่งข้อความ' },
    { href: '/create-group', label: 'สร้างกลุ่ม' },
    { href: '/add-friends', label: 'เพิ่มเพื่อน' },
    { href: '/number-sets', label: 'ชุดเบอร์' },
    { href: '/register', label: 'ลงทะเบียน' },
];
function Navbar() {
    return (<material_1.AppBar position="static" color="primary">
      <material_1.Toolbar>
        <material_1.Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LINE Automation
        </material_1.Typography>
        <material_1.Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {links.map(({ href, label }) => (<material_1.Button key={href} component={link_1.default} href={href} color="inherit" sx={{ ml: 1 }}>
              {label}
            </material_1.Button>))}
        </material_1.Box>
      </material_1.Toolbar>
    </material_1.AppBar>);
}
exports.default = Navbar;
