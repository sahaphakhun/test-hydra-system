import { createTheme } from '@mui/material/styles';

// โทนสีหลักแบบเรียบง่าย
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // blue
    },
    secondary: {
      main: '#9c27b0', // purple
    },
    background: {
      default: '#fafafa',
    },
  },
});

export default theme; 