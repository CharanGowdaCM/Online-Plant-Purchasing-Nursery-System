export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Plant Nursery';

export const CARE_LEVELS = {
  easy: 'Easy',
  moderate: 'Moderate',
  difficult: 'Difficult',
};

export const LIGHT_REQUIREMENTS = {
  low: 'Low Light',
  medium: 'Medium Light',
  bright: 'Bright Light',
  direct: 'Direct Sunlight',
};

export const WATER_REQUIREMENTS = {
  low: 'Low Water',
  medium: 'Medium Water',
  high: 'High Water',
};

export const USER_ROLES = {
  customer: 'Customer',
  inventory_admin: 'Inventory Admin',
  order_admin: 'Order Admin',
  support_admin: 'Support Admin',
  content_admin: 'Content Admin',
  super_admin: 'Super Admin',
};