import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './docs/font.css';
import './docs/app.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
