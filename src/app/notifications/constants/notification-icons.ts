export const NOTIFICATION_ICONS = {
  ERROR: {
    component: 'XCircleIcon',
    className: 'text-red-500',
  },
  WARNING: {
    component: 'ExclamationTriangleIcon',
    className: 'text-yellow-500',
  },
  SUCCESS: {
    component: 'CheckCircleIcon',
    className: 'text-green-500',
  },
  INFO: {
    component: 'InformationCircleIcon',
    className: 'text-blue-500',
  },
} as const;

export const NOTIFICATION_ICON_CLASS = 'h-6 w-6';
