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
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F3F4F6' }}>
        {!isLoginPage && <AdminSidebar />}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            ...(isLoginPage ? {} : {
              marginLeft: { sm: '240px' },
              width: { sm: `calc(100% - 240px)` }
            }),
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            p: { xs: 2, sm: 3, md: 4 },
            flexGrow: 1,
            ...(isLoginPage ? {} : { m: { xs: 0, sm: 2, md: 3 } })
          }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
} 