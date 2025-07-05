import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMindMapStore } from '../store/mindMapStore';
import { 
  WifiOff, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

const SyncStatus: React.FC = memo(() => {
  const { syncStatus } = useMindMapStore();

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Synced',
          description: 'All changes saved to cloud',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          pulse: false
        };
      case 'syncing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Syncing...',
          description: 'Saving changes to cloud',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          pulse: true
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Offline',
          description: 'Changes saved locally',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          pulse: false
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Sync Error',
          description: 'Failed to sync with cloud',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          pulse: true
        };
      case 'initial_load':
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: 'Loading...',
          description: 'Connecting to cloud',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          pulse: false
        };
      default:
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: '',
          description: 'Unknown sync status',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          pulse: false
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleRetry = () => {
    // Trigger a retry of the sync process
    window.location.reload();
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border",
                "transition-all duration-300",
                statusConfig.bgColor,
                statusConfig.borderColor,
                statusConfig.pulse && "animate-pulse"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn("flex items-center gap-2", statusConfig.iconColor)}>
                {statusConfig.icon}
                <span className={cn("text-sm font-medium", statusConfig.color)}>
                  {statusConfig.text}
                </span>
              </div>

              {/* Retry button for error state */}
              <AnimatePresence>
                {syncStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 ml-2 border-red-300 text-red-600 hover:bg-red-100"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{statusConfig.text}</p>
              <p className="text-xs text-gray-500">{statusConfig.description}</p>
              {syncStatus === 'error' && (
                <p className="text-xs text-red-500 mt-1">
                  Click the refresh button to retry
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
});

SyncStatus.displayName = 'SyncStatus';

export default SyncStatus;