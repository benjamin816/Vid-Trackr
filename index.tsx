
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Cleanup: In case the React mount doesn't naturally clear the initial HTML
  // (though createRoot usually does), we ensure any manual loaders are gone.
  const loader = document.querySelector('.loading-screen');
  if (loader && loader.parentElement === rootElement) {
    // React 18+ will clear the container automatically on render, 
    // but we can manually remove it if it was somehow appended outside.
  }
} catch (error) {
  console.error("Critical Render Error:", error);
  // If we crash before React can even start, show the error display
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.style.display = 'block';
    errorDisplay.innerHTML = `
      <div style="padding: 20px; background: #fee2e2; color: #991b1b; border-radius: 12px; border: 1px solid #f87171;">
        <h1 style="font-size: 18px; font-weight: 800; margin-bottom: 10px;">Startup Failure</h1>
        <p style="font-size: 14px; margin-bottom: 10px;">The application failed to initialize. This is often due to browser security settings or missing dependencies.</p>
        <pre style="font-size: 12px; white-space: pre-wrap;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="location.reload()" style="margin-top: 15px; background: #991b1b; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Retry Boot</button>
      </div>
    `;
  }
}
