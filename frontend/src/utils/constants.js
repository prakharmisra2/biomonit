// src/utils/constants.js

export const DATA_TYPES = {
    DILUTION: 'dilution',
    GAS: 'gas',
    LEVEL_CONTROL: 'level_control',
  };
  
  export const DATA_TYPE_LABELS = {
    dilution: 'Dilution Data',
    gas: 'Gas Data',
    level_control: 'Level Control Data',
  };
  
  export const DILUTION_FIELDS = [
    { key: 'time_passed', label: 'Time Passed' },
    { key: 'flowrate', label: 'Flow Rate' },
    { key: 'dilution_rate', label: 'Dilution Rate' },
    { key: 'volume_reactor', label: 'Volume' },
    { key: 'mass_in_tank', label: 'Mass in Tank' },
    { key: 'filtered_mass_in_tank', label: 'Filtered Mass' },
    { key: 'total_tank_balance', label: 'Tank Balance' },
  ];
  
  export const GAS_FIELDS = [
    { key: 'ph', label: 'pH' },
    { key: 'dissolved_oxygen', label: 'Dissolved Oxygen' },
    { key: 'reactor_temp', label: 'Temperature (°C)' },
    { key: 'our', label: 'OUR' },
    { key: 'rq', label: 'RQ' },
    { key: 'kla_1h', label: 'Kla (1/h)' },
    { key: 'stirrer_speed', label: 'Stirrer Speed' },
    { key: 'gas_flow_in', label: 'Gas Flow In' },
    { key: 'cpr', label: 'CPR' },
  ];
  
  export const LEVEL_CONTROL_FIELDS = [
    { key: 'reactor_weight', label: 'Reactor Weight (kg)' },
    { key: 'volume_reactor', label: 'Volume (L)' },
    { key: 'pid_value', label: 'PID Value' },
    { key: 'pump_rpm', label: 'Pump RPM' },
  ];
  
  export const ALERT_SEVERITY_COLORS = {
    info: '#2196f3',
    warning: '#ff9800',
    critical: '#f44336',
  };
  
  export const USER_ROLES = {
    ADMIN: 'admin',
    NORMAL_USER: 'normal_user',
    VIEWER: 'viewer',
  };
  
  export const ACCESS_LEVELS = {
    OWNER: 'owner',
    OPERATOR: 'operator',
    VIEWER: 'viewer',
  };