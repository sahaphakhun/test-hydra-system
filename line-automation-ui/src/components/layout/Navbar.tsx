'use client';

import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

const links = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/send-message', label: 'ส่งข้อความ' },
  { href: '/create-group', label: 'สร้างกลุ่ม' },
  { href: '/add-friends', label: 'เพิ่มเพื่อน' },
  { href: '/number-sets', label: 'ชุดเบอร์' },
  { href: '/adminn', label: 'แอดมิน' },
];

export default function Navbar() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LINE Automation
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {links.map(({ href, label }) => (
            <Button
              key={href}
              component={Link}
              href={href}
              color="inherit"
              sx={{ ml: 1 }}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
} 