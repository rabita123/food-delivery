'use client';
import AdminSidebar from '@/components/Admin/Sidebar';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {!isLoginPage && <AdminSidebar />}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            ...(isLoginPage ? {} : {
              marginLeft: { sm: '240px' },
              width: { sm: `calc(100% - 240px)` }
            })
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
} 