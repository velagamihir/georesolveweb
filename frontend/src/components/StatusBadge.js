import React from 'react';

const StatusBadge = ({ status, size = 'default' }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      label: 'Pending'
    },
    in_progress: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      label: 'In Progress'
    },
    resolved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      label: 'Resolved'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`${config.bg} ${config.text} ${sizeClass} rounded-full font-semibold inline-block`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;