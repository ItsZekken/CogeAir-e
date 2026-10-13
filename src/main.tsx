import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA installation & offline functionality
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('ServiceWorker registered with scope: ', reg.scope);
      })
      .catch((err) => {
        console.warn('ServiceWorker registration failed: ', err);
      });
  });
}
