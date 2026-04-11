// Created by Google Gemini
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('App failed to render:', error);
  document.body.innerHTML = `
    <div style="background: #1e1f22; color: #ed4245; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; text-align: center;">
      <h1 style="margin-bottom: 10px;">Oops! CRN Connect failed to start.</h1>
      <p style="color: #dbdee1; margin-bottom: 20px;">Check your browser console for detailed error logs.</p>
      <pre style="background: #2b2d31; padding: 15px; border-radius: 5px; color: #fff; max-width: 600px; overflow: auto; text-align: left;">${error instanceof Error ? error.stack : 'Unknown error'}</pre>
    </div>
  `;
}
