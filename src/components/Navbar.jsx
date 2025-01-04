import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  console.log('Navbar rendered from D drive version - ' + new Date().toISOString());

  return (
    <AppBar position="static" sx={{ backgroundColor: '#2C3E50' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          Homely
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">
            Homesssssssssssss
          </Button>
          <Button color="inherit" component={Link} to="/menu">
            Menu
          </Button>
          <Button color="inherit" component={Link} to="/about">
            About
          </Button>
          <Button color="inherit" component={Link} to="/contact">
            Contact
          </Button>
          <Button color="inherit" component={Link} to="/login">
            Sign In
          </Button>
          <Button 
            variant="contained" 
            sx={{ 
              ml: 1,
              backgroundColor: '#E74C3C',
              '&:hover': {
                backgroundColor: '#C0392B'
              }
            }}
            component={Link} 
            to="/signup"
          >
            Sign Up
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 