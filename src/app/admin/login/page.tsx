'use client';
import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  ThemeProvider,
  CssBaseline,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import theme from '@/theme/theme';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!user) throw new Error('No user found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Unauthorized access. Admin privileges required.');
      }

      router.push('/admin/dashboard');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8f9fa',
          p: 3,
        }}
      >
        <Card
          sx={{
            display: 'flex',
            maxWidth: 1000,
            width: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          {/* Left Side - Login Form */}
          <Box sx={{ flex: 1, p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: '#2C3E50',
                  mb: 1,
                }}
              >
                Log in.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Login with your admin credentials.
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                label="Your e-mail"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      sx={{
                        color: '#00A651',
                        '&.Mui-checked': {
                          color: '#00A651',
                        },
                      }}
                    />
                  }
                  label="Keep me logged in"
                />
                <Button
                  variant="text"
                  sx={{
                    color: '#00A651',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  bgcolor: '#00A651',
                  color: 'white',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: '#008C44',
                  },
                }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </Box>

          {/* Right Side - Illustration */}
          <Box
            sx={{
              flex: 1,
              bgcolor: '#F5F9F6',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '300px',
                position: 'relative',
                mb: 4,
              }}
            >
              <Image
                src="/admin-illustration.svg"
                alt="Admin illustration"
                fill
                style={{ objectFit: 'contain' }}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: '#2C3E50',
                fontWeight: 600,
                mb: 2,
                textAlign: 'center',
              }}
            >
              Don't have account yet?
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                textAlign: 'center',
                mb: 2,
              }}
            >
              Contact us at{' '}
              <Box
                component="span"
                sx={{ color: '#00A651', fontWeight: 500 }}
              >
                admin@homemade.com
              </Box>
              {' '}and
              <br />
              We will take care of everything!
            </Typography>
          </Box>
        </Card>
      </Box>
    </ThemeProvider>
  );
} 