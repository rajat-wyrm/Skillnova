// src/main.jsx
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { APP_CONSTANTS } from './shared/config/constants';
import './index.css';

if (localStorage.getItem(APP_CONSTANTS.THEME_STORAGE_KEY) === 'dark') {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
    <ErrorBoundary>
      <App />
      <Toaster />
    </ErrorBoundary>
  </BrowserRouter>
</StrictMode>
);