import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle unexpected network/stream cancellation AbortErrors gracefully
if (typeof window !== 'undefined') {
  const isIgnoredError = (err: any, source?: any): boolean => {
    if (!err && !source) return false;
    const name = (err && (err.name || err.code || err.constructor?.name)) || '';
    const msg = typeof err === 'string' ? err : (err?.message || '');
    const stack = (err && err.stack) || '';
    const src = typeof source === 'string' ? source : '';
    let str = '';
    try { str = String(err); } catch {}
    const reasonStr = (err?.reason && (err.reason.message || String(err.reason))) || '';

    // Extension errors (e.g. Similarweb, Grammarly, etc. injected into iframe)
    if (
      src.includes('chrome-extension://') ||
      src.includes('moz-extension://') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      stack.includes('frame_ant.js') ||
      msg.includes('Cannot set property fetch') ||
      msg.includes('which has only a getter') ||
      str.includes('Cannot set property fetch')
    ) {
      return true;
    }

    // Abort & Stream Cancellation errors
    return (
      name === 'AbortError' ||
      name === 'cancelled' ||
      name === 'DOMException' ||
      msg.includes('aborted') ||
      msg.includes('AbortError') ||
      msg.includes('The user aborted a request') ||
      msg.includes('signal is aborted') ||
      str.includes('aborted') ||
      str.includes('AbortError') ||
      str.includes('signal is aborted') ||
      reasonStr.includes('aborted') ||
      reasonStr.includes('signal is aborted')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isIgnoredError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  }, true);

  window.addEventListener('error', (event) => {
    if (isIgnoredError(event.error, event.filename) || (typeof event.message === 'string' && isIgnoredError(event.message, event.filename))) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  }, true);

  const origOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (isIgnoredError(error, source) || (typeof message === 'string' && isIgnoredError(message, source))) {
      return true;
    }
    if (origOnError) {
      return origOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <App />
);

// Register Progressive Web App Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Core OS Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('Core OS Service Worker registration failed:', err);
      });
  });
}

