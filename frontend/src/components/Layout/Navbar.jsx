// src/components/Layout/Navbar.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Logout,
  Person,
  FiberManualRecord,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

const Navbar = ({ drawerWidth, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, realtimeAlerts } = useSocket();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationOpen = (event) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotifAnchor(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const unreadAlerts = realtimeAlerts.filter(a => !a.is_acknowledged).length;

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        {/* Mobile menu button */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Bio-Monitor System
        </Typography>

        {/* Connection Status */}
        <Box sx={{ mr: 2 }}>
          <Chip
            icon={<FiberManualRecord />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            sx={{
              '& .MuiChip-icon': {
                fontSize: 10,
              },
            }}
          />
        </Box>

        {/* Notifications */}
        <IconButton color="inherit" onClick={handleNotificationOpen}>
          <Badge badgeContent={unreadAlerts} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* User Menu */}
        <IconButton
          edge="end"
          onClick={handleProfileMenuOpen}
          color="inherit"
          sx={{ ml: 2 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            {user?.fullName?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
            <Chip
              label={user?.role?.replace('_', ' ').toUpperCase()}
              size="small"
              color="primary"
              sx={{ mt: 0.5 }}
            />
          </Box>
          <MenuItem onClick={handleProfile}>
            <Person sx={{ mr: 1 }} fontSize="small" />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} fontSize="small" />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            style: {
              maxHeight: 400,
              width: 350,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">Recent Alerts</Typography>
          </Box>
          {realtimeAlerts.length === 0 ? (
            <MenuItem>
              <Typography variant="body2" color="text.secondary">
                No recent alerts
              </Typography>
            </MenuItem>
          ) : (
            realtimeAlerts.slice(0, 5).map((alert, index) => (
              <MenuItem key={index} onClick={handleNotificationClose}>
                <Box>
                  <Typography variant="body2" noWrap>
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.reactor_name || 'Unknown Reactor'}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
          {realtimeAlerts.length > 5 && (
            <MenuItem onClick={() => { handleNotificationClose(); navigate('/alerts'); }}>
              <Typography variant="body2" color="primary">
                View all alerts
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;