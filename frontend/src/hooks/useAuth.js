// src/hooks/useAuth.js

import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as authApi from '../api/auth';
import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout: logoutStore, updateUser } = useAuthStore();
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const { user, token, refreshToken } = data.data;
      login(user, { token, refreshToken });
      toast.success('Login successful!');
      navigate('/dashboard');
    },
    onError: (error) => {
        console.log("failed")
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: () => {
      // Even if API call fails, logout locally
      logoutStore();
      navigate('/login');
    },
  });

  // Get profile query
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    onSuccess: (data) => {
      updateUser(data.data);
    },
    retry: false,
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully. Please login again.');
      logoutStore();
      navigate('/login');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data.data);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoadingProfile,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};