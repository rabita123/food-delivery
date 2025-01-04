'use client';
import AdminSidebar from '@/components/admin/Sidebar';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AdminSidebar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            marginLeft: { sm: '240px' }, // Add margin for the drawer width
            width: { sm: `calc(100% - 240px)` }
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
} 