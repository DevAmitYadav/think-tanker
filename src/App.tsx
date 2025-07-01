import { useEffect, useState } from 'react';
import { startFirebaseListener, stopFirebaseListener, useMindMapStore, loadFromLocalStorage, saveToLocalStorage } from './store/mindMapStore';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas';
import SyncStatus from './components/SyncStatus';
import PrintView from './components/PrintView';
import Spinner from './components/ui/Spinner';

function App() {
  const { rootNodeId, addRootNode, syncStatus } = useMindMapStore();
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      startFirebaseListener();
      setOfflineMode(false);
      setError(null);
    } catch (err) {
      const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : undefined;
      setError(errorMsg ?? 'Could not connect to Firestore. Working in offline mode.');
      setOfflineMode(true);
      loadFromLocalStorage();
    }
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

  // Show spinner during initial load
  if (syncStatus === 'initial_load') {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100 print:hidden">
        <Spinner />
      </div>
    );
  }

  // Show error and offline fallback if Firestore fails
  if (error || offlineMode || syncStatus === 'offline' || syncStatus === 'error') {
    return (
      <>
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100 print:hidden">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Offline Mode</h2>
            <p className="text-gray-700 mb-2">
              {error ?? 'Could not connect to Firestore.'}
            </p>
            <p className="text-gray-500 mb-4 text-center">
              You can continue editing your mind map. Changes will be saved locally and synced when Firestore is available again.
            </p>
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </button>
          </div>
          <div className="flex-grow w-full flex flex-col">
            {/* Main Mind Map View (offline) */}
            <div className="flex-grow relative overflow-hidden p-4">
              {rootNodeId === null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-gray-600 bg-gray-100/80 backdrop-blur-sm">
                  <p className="text-xl font-semibold mb-4">Welcome to your Mind Map Editor!</p>
                  <button
                    onClick={addRootNode}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg"
                  >
                    Create First Node
                  </button>
                  <p className="mt-4 text-sm text-gray-500">
                    Double-click nodes to edit, drag to reposition, use controls to add/remove.
                  </p>
                </div>
              )}
              <MindMapCanvas />
            </div>
            <Toolbar />
            <SyncStatus />
          </div>
        </div>
        <PrintView />
      </>
    );
  }

  // Normal online mode
  return (
    <>
      <div className="relative w-screen h-screen flex flex-col bg-gray-100 font-sans antialiased overflow-hidden print:hidden">
        {/* Main Mind Map View */}
        <div className="flex-grow relative overflow-hidden p-4">
          {rootNodeId === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-gray-600 bg-gray-100/80 backdrop-blur-sm">
              <p className="text-xl font-semibold mb-4">Welcome to your Mind Map Editor!</p>
              <button
                onClick={addRootNode}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg"
              >
                Create First Node
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Double-click nodes to edit, drag to reposition, use controls to add/remove.
              </p>
            </div>
          )}
          <MindMapCanvas />
        </div>
        <Toolbar />
        <SyncStatus />
      </div>
      <PrintView />
    </>
  );
}

export default App;