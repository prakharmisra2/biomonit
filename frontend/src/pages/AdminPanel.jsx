// src/pages/AdminPanel.jsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import axios from '../api/axios';
import Loading from '../components/Common/Loading';
import { formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
// const [selectedUser, setSelectedUser] = useState(null);

  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'normal_user',
    password: '',
  });

  const [assignFormData, setAssignFormData] = useState({
    userId: '',
    reactorId: '',
    accessLevel: 'operator',
  });

  // Fetch users
  const {
    data: usersData,
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await axios.get('/users');
      return response.data;
    },
  });

  // Fetch reactors
  const {
    data: reactorsData,
  //  refetch: refetchReactors,
  } = useQuery({
    queryKey: ['adminReactors'],
    queryFn: async () => {
      const response = await axios.get('/reactors');
      return response.data;
    },
  });

  const users = usersData?.data || [];
  const reactors = reactorsData?.data || [];

  const handleCreateUser = async () => {
    try {
      await axios.post('/users', userFormData);
      toast.success('User created successfully!');
      setOpenUserDialog(false);
      refetchUsers();
      setUserFormData({
        username: '',
        fullName: '',
        email: '',
        role: 'normal_user',
        password: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleAssignUser = async () => {
    try {
      await axios.post(`/users/${assignFormData.userId}/reactors`, {
        reactorId: assignFormData.reactorId,
        accessLevel: assignFormData.accessLevel,
      });
      toast.success('User assigned to reactor successfully!');
      setOpenAssignDialog(false);
      refetchUsers();
      setAssignFormData({
        userId: '',
        reactorId: '',
        accessLevel: 'operator',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/users/${userId}`);
        toast.success('User deleted successfully!');
        refetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (userId) => {
    if (window.confirm('Reset password for this user?')) {
      try {
        const response = await axios.post(`/users/${userId}/reset-password`);
        const newPassword = response.data.data.temporaryPassword;
        alert(`Password reset successful!\n\nNew Password: ${newPassword}\n\nPlease save this password.`);
      } catch (error) {
        toast.error('Failed to reset password');
      }
    }
  };

  if (loadingUsers) return <Loading message="Loading admin panel..." />;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Admin Panel
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Manage users and system settings
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Users" />
          <Tab label="Reactors" />
          <Tab label="System Stats" />
        </Tabs>
      </Box>

      {/* Users Tab */}
      {tabValue === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenUserDialog(true)}
            >
              Create User
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenAssignDialog(true)}
            >
              Assign to Reactor
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={user.role === 'admin' ? 'error' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleResetPassword(user.user_id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user.user_id)}
                        disabled={user.role === 'admin'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Reactors Tab */}
      {tabValue === 1 && (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reactor Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data Retention</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reactors.map((reactor) => (
                  <TableRow key={reactor.reactor_id}>
                    <TableCell>{reactor.reactor_name}</TableCell>
                    <TableCell>{reactor.location || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={reactor.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={reactor.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{reactor.data_retention_days} days</TableCell>
                    <TableCell>{formatDate(reactor.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* System Stats Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Statistics
            </Typography>
            <Box mt={2}>
              <Typography variant="body1">
                Total Users: <strong>{users.length}</strong>
              </Typography>
              <Typography variant="body1">
                Active Users: <strong>{users.filter((u) => u.is_active).length}</strong>
              </Typography>
              <Typography variant="body1">
                Total Reactors: <strong>{reactors.length}</strong>
              </Typography>
              <Typography variant="body1">
                Active Reactors: <strong>{reactors.filter((r) => r.is_active).length}</strong>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={userFormData.username}
            onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Full Name"
            value={userFormData.fullName}
            onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={userFormData.role}
              label="Role"
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="normal_user">Normal User</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Password (optional)"
            type="password"
            value={userFormData.password}
            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
            margin="normal"
            helperText="Leave blank to auto-generate"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign User to Reactor</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>User</InputLabel>
            <Select
              value={assignFormData.userId}
              label="User"
              onChange={(e) => setAssignFormData({ ...assignFormData, userId: e.target.value })}
            >
              {users.map((user) => (
                <MenuItem key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.username})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Reactor</InputLabel>
            <Select
              value={assignFormData.reactorId}
              label="Reactor"
              onChange={(e) => setAssignFormData({ ...assignFormData, reactorId: e.target.value })}
            >
              {reactors.map((reactor) => (
                <MenuItem key={reactor.reactor_id} value={reactor.reactor_id}>
                  {reactor.reactor_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Access Level</InputLabel>
            <Select
              value={assignFormData.accessLevel}
              label="Access Level"
              onChange={(e) => setAssignFormData({ ...assignFormData, accessLevel: e.target.value })}
            >
              <MenuItem value="owner">Owner</MenuItem>
              <MenuItem value="operator">Operator</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignUser}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;