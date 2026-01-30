// src/components/Alerts/SetPointForm.jsx

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { createSetPoint } from '../../api/alerts';
import { DILUTION_FIELDS, GAS_FIELDS, LEVEL_CONTROL_FIELDS } from '../../utils/constants';
import { toast } from 'react-toastify';

const SetPointForm = ({ reactors, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reactorId: '',
    dataType: 'gas',
    fieldName: '',
    minValue: '',
    maxValue: '',
  });

  const createMutation = useMutation({
    mutationFn: ({ reactorId, ...data }) => createSetPoint(reactorId, data),
    onSuccess: () => {
      toast.success('SetPoint created successfully!');
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create setpoint');
    },
  });

  const getFieldsForDataType = (dataType) => {
    switch (dataType) {
      case 'dilution':
        return DILUTION_FIELDS;
      case 'gas':
        return GAS_FIELDS;
      case 'level_control':
        return LEVEL_CONTROL_FIELDS;
      default:
        return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      // Reset field name when data type changes
      ...(name === 'dataType' && { fieldName: '' }),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.reactorId || !formData.fieldName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.minValue && !formData.maxValue) {
      toast.error('Please set at least one threshold (min or max)');
      return;
    }

    createMutation.mutate({
      reactorId: formData.reactorId,
      dataType: formData.dataType,
      fieldName: formData.fieldName,
      minValue: formData.minValue ? parseFloat(formData.minValue) : null,
      maxValue: formData.maxValue ? parseFloat(formData.maxValue) : null,
    });
  };

  const availableFields = getFieldsForDataType(formData.dataType);

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>Create SetPoint</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Reactor</InputLabel>
              <Select
                name="reactorId"
                value={formData.reactorId}
                label="Reactor"
                onChange={handleChange}
              >
                {reactors.map((reactor) => (
                  <MenuItem key={reactor.reactor_id} value={reactor.reactor_id}>
                    {reactor.reactor_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Data Type</InputLabel>
              <Select
                name="dataType"
                value={formData.dataType}
                label="Data Type"
                onChange={handleChange}
              >
                <MenuItem value="dilution">Dilution Data</MenuItem>
                <MenuItem value="gas">Gas Data</MenuItem>
                <MenuItem value="level_control">Level Control</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Field</InputLabel>
              <Select
                name="fieldName"
                value={formData.fieldName}
                label="Field"
                onChange={handleChange}
              >
                {availableFields.map((field) => (
                  <MenuItem key={field.key} value={field.key}>
                    {field.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Minimum Value"
              name="minValue"
              type="number"
              value={formData.minValue}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              helperText="Alert if value goes below this"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Value"
              name="maxValue"
              type="number"
              value={formData.maxValue}
              onChange={handleChange}
              inputProps={{ step: 'any' }}
              helperText="Alert if value goes above this"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Create SetPoint'}
        </Button>
      </DialogActions>
    </form>
  );
};

export default SetPointForm;