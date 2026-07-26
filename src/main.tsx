import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SupabaseProvider } from './contexts/SupabaseContext';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1F2937',
              color: '#F9FAFB',
              fontSize: '14px',
            },
          }}
        />
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>
);
