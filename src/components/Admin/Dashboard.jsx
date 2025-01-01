import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { 
  RestaurantMenu, 
  ShoppingCart, 
  People, 
  AttachMoney 
} from '@mui/icons-material';

const StatCard = ({ title, value, icon }) => (
  <Paper 
    elevation={3} 
    sx={{ 
      p: 3, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
    }}
  >
    <Box>
      <Typography variant="h6" color="textSecondary">
        {title}
      </Typography>
      <Typography variant="h4">
        {value}
      </Typography>
    </Box>
    <Box sx={{ color: 'primary.main' }}>
      {icon}
    </Box>
  </Paper>
);

const Dashboard = () => {
  // These would typically come from your backend/state management
  const stats = {
    totalOrders: 156,
    totalDishes: 48,
    activeUsers: 234,
    revenue: 12580
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart sx={{ fontSize: 40 }} />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Dishes"
            value={stats.totalDishes}
            icon={<RestaurantMenu sx={{ fontSize: 40 }} />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<People sx={{ fontSize: 40 }} />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue ($)"
            value={`$${stats.revenue.toLocaleString()}`}
            icon={<AttachMoney sx={{ fontSize: 40 }} />}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 