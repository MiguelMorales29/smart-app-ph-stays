import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

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
        <App />
      </ThemeProvider>
    </DashboardQueryProvider>
  </StrictMode>,
);
