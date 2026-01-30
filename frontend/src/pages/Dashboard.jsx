// src/pages/Dashboard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Alert,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { getReactors } from '../api/reactors';
import { getAllAlerts } from '../api/alerts';
import useAuthStore from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import StatCard from '../components/Dashboard/StatCard';
import { formatRelativeTime } from '../utils/helpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { realtimeAlerts, isConnected } = useSocket();

  // Fetch reactors
  const {
    data: reactorsData,
    isLoading: loadingReactors,
    error: reactorsError,
    refetch: refetchReactors,
  } = useQuery({
    queryKey: ['reactors'],
    queryFn: getReactors,
  });

  // Fetch alerts (admin only)
  const {
    data: alertsData,
    isLoading: loadingAlerts,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAllAlerts({ limit: 10 }),
    enabled: user?.role === 'admin',
  });

  const reactors = reactorsData?.data || [];
  const alerts = alertsData?.data || [];
  const activeReactors = reactors.filter((r) => r.is_active).length;
  const totalAlerts = alerts.filter((a) => !a.is_acknowledged).length;

  if (loadingReactors) return <Loading message="Loading dashboard..." />;
  if (reactorsError) return <ErrorMessage message={reactorsError.message} onRetry={refetchReactors} />;

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user?.fullName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor your bioreactors in real-time
        </Typography>
      </Box>

      {/* Connection Status */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time connection is not active. Data may not update automatically.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Reactors"
            value={reactors.length}
            icon={<ScienceIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Reactors"
            value={activeReactors}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unread Alerts"
            value={totalAlerts + realtimeAlerts.length}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Real-time Status"
            value={isConnected ? 'Connected' : 'Disconnected'}
            icon={<CheckCircleIcon />}
            color={isConnected ? 'success' : 'error'}
            isText
          />
        </Grid>
      </Grid>

      {/* Reactors List */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Your Reactors
        </Typography>
        <Grid container spacing={3}>
          {reactors.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No reactors assigned yet. Contact your administrator to get access.
              </Alert>
            </Grid>
          ) : (
            reactors.map((reactor) => (
              <Grid item xs={12} sm={6} md={4} key={reactor.reactor_id}>
                <Card elevation={2}>
                  <CardActionArea onClick={() => navigate(`/reactors/${reactor.reactor_id}`)}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <ScienceIcon color="primary" sx={{ fontSize: 40 }} />
                        <Chip
                          label={reactor.is_active ? 'Active' : 'Inactive'}
                          color={reactor.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {reactor.reactor_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {reactor.location || 'No location'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created {formatRelativeTime(reactor.created_at)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Recent Alerts (Admin only) */}
      {user?.role === 'admin' && (
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Recent Alerts
          </Typography>
          {loadingAlerts ? (
            <Loading message="Loading alerts..." />
          ) : alerts.length === 0 ? (
            <Alert severity="info">No recent alerts</Alert>
          ) : (
            <Grid container spacing={2}>
              {alerts.slice(0, 5).map((alert) => (
                <Grid item xs={12} key={alert.alert_id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {alert.reactor_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelativeTime(alert.created_at)}
                          </Typography>
                        </Box>
                        <Chip
                          label={alert.severity}
                          color={
                            alert.severity === 'critical'
                              ? 'error'
                              : alert.severity === 'warning'
                              ? 'warning'
                              : 'info'
                          }
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;