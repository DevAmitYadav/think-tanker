

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Toaster } from 'sonner';

// by Amit Yadav: Wrap App in ErrorBoundary for global error handling
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </ErrorBoundary>
  </StrictMode>,
);
