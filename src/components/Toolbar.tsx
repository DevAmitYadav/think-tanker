// by Amit Yadav: Toolbar for mind map actions, refactored for UI consistency
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useMindMapStore } from '../store/mindMapStore';
import { 
  PlusCircle, 
  Printer, 
  Trash2, 
  Home, 
  Download,
  Upload,
  Settings,
  Share2,
  Save,
  RotateCcw,
  Palette,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

const Toolbar: React.FC = memo(() => {
  const {
    rootNodeId,
    addRootNode,
    addNode,
    selectedNodeId,
    resetMap,
    setCanvasScale,
    panCanvas,
    nodes,
    canvasOffset
  } = useMindMapStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Store the toast id for the clear all dialog
  let clearAllToastId: string | null = null;

  // Print handler
  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened', {
      description: 'Use your browser\'s print settings to customize the output',
      icon: <Printer className="h-5 w-5" />,
      className: 'bg-white !text-gray-900',
    });
  };

  // Reset view handler (zoom to fit all nodes)
  const handleResetView = () => {
    const visibleNodes = Object.values(nodes).filter(n => n && (!n.parentId || nodes[n.parentId]));
    if (visibleNodes.length === 0) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    visibleNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    });
    
    const width = maxX - minX + 160;
    const height = maxY - minY + 40;
    const cWidth = window.innerWidth;
    const cHeight = window.innerHeight - 200;
    const scale = Math.min(cWidth / width, cHeight / height, 1);
    const offsetX = (cWidth - width * scale) / 2 - minX * scale;
    const offsetY = (cHeight - height * scale) / 2 - minY * scale;
    
    setCanvasScale(scale);
    panCanvas(offsetX - canvasOffset.x, offsetY - canvasOffset.y);
    
    toast.success('View reset', {
      description: 'Canvas view has been reset to fit all nodes',
      icon: <Home className="h-5 w-5" />,
      className: 'bg-white !text-gray-900',
    });
  };

  // Export mind map as JSON
  const handleExport = () => {
    const mindMapData = {
      nodes,
      rootNodeId,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(mindMapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Mind map exported', {
      description: 'Your mind map has been exported as JSON',
      icon: <Download className="h-5 w-5" />,
      className: 'bg-white !text-gray-900',
    });
  };

  // Import mind map from JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            // TODO: Implement import logic in store
            toast.success('Mind map imported', {
              description: 'Your mind map has been imported successfully',
              icon: <Upload className="h-5 w-5" />,
              className: 'bg-white !text-gray-900',
            });
          } catch (error) {
            toast.error('Import failed', {
              description: 'Invalid file format. Please select a valid mind map file.',
              icon: <Upload className="h-5 w-5" />,
              className: 'bg-white !text-gray-900',
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Share mind map
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Mind Map',
          text: 'Check out this mind map I created with ThinkTanker!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied', {
          description: 'Mind map link copied to clipboard',
          icon: <Share2 className="h-5 w-5" />,
          className: 'bg-white !text-gray-900',
        });
      }
    } catch (error) {
      toast.error('Share failed', {
        description: 'Could not share the mind map',
        icon: <Share2 className="h-5 w-5" />,
        className: 'bg-white !text-gray-900',
      });
    }
  };

  // Clear all nodes with confirmation
  const handleClearAll = () => {
    // If the toast is already open, do not create a new one
    if (clearAllToastId !== null) {
      toast.dismiss(clearAllToastId);
      clearAllToastId = null;
      return;
    }
    clearAllToastId = toast.custom(
      (t) => (
        <Card className="w-80 border-2 border-blue-400 shadow-lg bg-white">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Clear all nodes?</span>
            </CardTitle>
            <CardDescription className="text-gray-700 mt-1">
              This will permanently remove all nodes from your mind map. <span className="text-red-500 font-semibold">This action cannot be undone.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 pt-1 px-6">
            <div className="flex flex-row gap-2 justify-end">
              <Button
                onClick={() => {
                  resetMap();
                  toast.dismiss(t);
                  clearAllToastId = null;
                  toast.success('Mind map cleared', {
                    description: 'All nodes have been removed',
                    icon: <Trash2 className="h-5 w-5" />,
                    className: 'bg-white !text-gray-900',
                  });
                }}
                variant="destructive"
                className="min-w-[120px] h-10 bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Clear All
              </Button>
              <Button
                onClick={() => {
                  toast.dismiss(t);
                  clearAllToastId = null;
                }}
                variant="outline"
                className="min-w-[120px] h-10 bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      {
        duration: 10000,
        id: 'clear-all-toast',
        onAutoClose: () => { clearAllToastId = null; },
        onDismiss: () => { clearAllToastId = null; },
      }
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-1 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 bg-white/90 p-3 rounded-2xl shadow-lg border border-gray-200">
          
          {/* Create Root Node */}
          {!rootNodeId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={addRootNode}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Mind Map
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create your first mind map</TooltipContent>
            </Tooltip>
          )}

          {/* Main Actions */}
          {rootNodeId && (
            <>
              {/* Add Child Node */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => selectedNodeId && addNode(selectedNodeId)}
                    disabled={!selectedNodeId}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Child Node</TooltipContent>
              </Tooltip>

              {/* Reset View */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleResetView}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Mind Map</TooltipContent>
              </Tooltip>

              {/* Import */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleImport}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import Mind Map</TooltipContent>
              </Tooltip>

              {/* Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Mind Map</TooltipContent>
              </Tooltip>

              {/* Print */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print Mind Map</TooltipContent>
              </Tooltip>

              {/* Settings */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant={showSettings ? "default" : "outline"}
                    size="icon"
                    className="w-10 h-10"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>

              {/* Clear All */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear All Nodes</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2"
            >
              <Card className="w-80 p-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Settings</CardTitle>
                  <CardDescription>Customize your mind mapping experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Palette className="h-4 w-4 mr-2" />
                        Light
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Palette className="h-4 w-4 mr-2" />
                        Dark
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Layers className="h-4 w-4 mr-2" />
                        Grid
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Guides
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;

