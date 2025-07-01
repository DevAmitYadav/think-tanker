import React, { memo } from 'react';
import { useMindMapStore } from '../store/mindMapStore';
import { CheckCircleIcon, WifiIcon, ExclamationTriangleIcon, CloudArrowUpIcon, CloudIcon } from '@heroicons/react/20/solid';

const SyncStatus: React.FC = memo(() => {
  const syncStatus = useMindMapStore((state) => state.syncStatus);

  let statusText = '';
  let statusColor = '';
  let statusIcon = null;

  switch (syncStatus) {
    case 'online':
      statusText = 'Online & Synced';
      statusColor = 'text-green-600';
      statusIcon = <CheckCircleIcon className="h-5 w-5" />;
      break;
    case 'offline':
      statusText = 'Offline Mode';
      statusColor = 'text-red-600';
      statusIcon = <WifiIcon className="h-5 w-5" />;
      break;
    case 'syncing':
      statusText = 'Syncing...';
      statusColor = 'text-blue-600 animate-pulse';
      statusIcon = <CloudArrowUpIcon className="h-5 w-5" />;
      break;
    case 'error':
      statusText = 'Sync Error!';
      statusColor = 'text-red-700';
      statusIcon = <ExclamationTriangleIcon className="h-5 w-5" />;
      break;
    case 'initial_load':
      statusText = 'Loading...';
      statusColor = 'text-gray-500';
      statusIcon = <CloudIcon className="h-5 w-5" />;
      break;
    default:
      statusText = 'Unknown Status';
      statusColor = 'text-gray-500';
      statusIcon = null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-50 flex items-center space-x-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200 text-sm font-medium">
      {statusIcon}
      <span className={statusColor}>{statusText}</span>
    </div>
  );
});

export default SyncStatus;