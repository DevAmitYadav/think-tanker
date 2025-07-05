import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startFirebaseListener, stopFirebaseListener, useMindMapStore, loadFromLocalStorage, saveToLocalStorage } from './store/mindMapStore';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas';
import SyncStatus from './components/SyncStatus';
import PrintView from './components/PrintView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Wifi, WifiOff, AlertCircle, Loader2, Brain, Zap, PencilLine, MousePointer2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';

function App() {
  const { rootNodeId, addRootNode, syncStatus } = useMindMapStore();
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        await startFirebaseListener();
        setOfflineMode(false);
        setError(null);
        toast.success('Connected to cloud sync', {
          description: 'Your mind map is now syncing with the cloud',
          icon: <Wifi className="h-4 w-4" />,
          className: 'bg-white !text-gray-900',
        });
      } catch (err) {
        const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : undefined;
        setError(errorMsg ?? 'Could not connect to Firestore. Working in offline mode.');
        setOfflineMode(true);
        loadFromLocalStorage();
        toast.error('Offline mode activated', {
          description: 'Changes will be saved locally and synced when connection is restored',
          icon: <WifiOff className="h-4 w-4" />,
          className: 'bg-white !text-gray-900',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
    return () => {
      stopFirebaseListener();
    };
  }, []);

  // Save to localStorage if in offline mode
  useEffect(() => {
    if (offlineMode) {
      saveToLocalStorage();
    }
  }, [offlineMode, rootNodeId]);

  // Show loading screen during initial load
  if (isInitializing || syncStatus === 'initial_load') {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 print:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-96 p-8 text-center">
            <CardHeader>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4"
              >
                <Brain className="h-12 w-12 text-blue-600" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                ThinkTanker
              </CardTitle>
              <CardDescription className="text-gray-600">
                Loading your mind map...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-500">Initializing...</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show error and offline fallback if Firestore fails
  if (error || offlineMode || syncStatus === 'offline' || syncStatus === 'error') {
    return (
      <TooltipProvider>
        <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 print:hidden">
          {/* Offline Banner */}
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="bg-amber-50 border-b border-amber-200 p-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Working in offline mode
                  </p>
                  <p className="text-xs text-amber-700">
                    {error ?? 'Could not connect to cloud sync. Changes will be saved locally.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                Retry Connection
              </Button>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-grow relative overflow-hidden p-4">
            {rootNodeId === null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10"
              >
                <Card className="w-full max-w-md p-8 text-center">
                  <CardHeader>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="mx-auto mb-4"
                    >
                      <Brain className="h-16 w-16 text-blue-600" />
                    </motion.div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Welcome to ThinkTanker
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Create your first mind map to start organizing your thoughts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={addRootNode}
                      className="w-full h-12 text-lg font-semibold"
                      size="lg"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Create Your First Node
                    </Button>
                    <div className="flex w-full items-center justify-center">
                      <div className="text-xs text-gray-500 space-y-2 flex flex-col items-center">
                        <span className="flex items-center gap-2"><PencilLine className="h-4 w-4 text-blue-500" /> Double-click nodes to edit</span>
                        <span className="flex items-center gap-2"><MousePointer2 className="h-4 w-4 text-green-500" /> Drag to reposition</span>
                        <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4 text-indigo-500" /> Use controls to add/remove nodes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            <MindMapCanvas />
          </div>
          <Toolbar />
          <SyncStatus />
        </div>
        <PrintView />
      </TooltipProvider>
    );
  }

  // Normal online mode
  return (
    <TooltipProvider>
      <div className="relative w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 print:hidden">
        {/* Header with sync status */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-white/80 border-b border-gray-200 p-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ThinkTanker</h1>
                <p className="text-sm text-gray-600">Mind mapping made simple</p>
              </div>
            </div>
            <SyncStatus />
          </div>
        </motion.div>

        {/* Main Mind Map View */}
        <div className="flex-grow relative overflow-hidden p-4">
          <AnimatePresence>
            {rootNodeId === null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10"
              >
                <Card className="w-full max-w-md p-8 text-center">
                  <CardHeader>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="mx-auto mb-4"
                    >
                      <Brain className="h-16 w-16 text-blue-600" />
                    </motion.div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Welcome to ThinkTanker
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Create your first mind map to start organizing your thoughts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={addRootNode}
                      className="w-full h-12 text-lg font-semibold"
                      size="lg"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Create Your First Node
                    </Button>
                    <div className="flex w-full items-center justify-center">
                      <div className="text-xs text-gray-500 space-y-2 flex flex-col items-center">
                        <span className="flex items-center gap-2"><PencilLine className="h-4 w-4 text-blue-500" /> Double-click nodes to edit</span>
                        <span className="flex items-center gap-2"><MousePointer2 className="h-4 w-4 text-green-500" /> Drag to reposition</span>
                        <span className="flex items-center gap-2"><PlusCircle className="h-4 w-4 text-indigo-500" /> Use controls to add/remove nodes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          <MindMapCanvas />
        </div>
        <Toolbar />
      </div>
      <PrintView />
    </TooltipProvider>
  );
}

export default App;