import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@smartapp/ui/components/toast';

import './index.css';
import { DashboardQueryProvider } from '@/app/query';
import { ThemeProvider } from '@/app/theme';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <DashboardQueryProvider>
      <ThemeProvider>
        <Toaster>
          <App />
        </Toaster>
      </ThemeProvider>
    </DashboardQueryProvider>
  </StrictMode>,
);
