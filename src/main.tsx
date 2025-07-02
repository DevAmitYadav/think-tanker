
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/sonner-toast.css';
import App from './App.tsx';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Toaster } from 'sonner';

// by Amit Yadav: Wrap App in ErrorBoundary for global error handling
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <>
        <Toaster position="top-right" richColors closeButton />
        <App />
      </>
    </ErrorBoundary>
  </StrictMode>,
);
