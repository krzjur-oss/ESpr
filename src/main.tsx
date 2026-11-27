import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-ext-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-ext-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-ext-700.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-ext-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/source-serif-4/latin-ext-400-italic.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/source-serif-4/latin-ext-600.css';
import '@fontsource/source-serif-4/latin-700.css';
import '@fontsource/source-serif-4/latin-ext-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-ext-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-ext-600.css';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { flushPendingAppStateSave, waitForPendingAppStateSave } from './utils/storage';
import './index.css';

const updateSW = registerSW({
  immediate: false,
  onNeedRefresh() {
    flushPendingAppStateSave();
    void waitForPendingAppStateSave().finally(() => {
      void updateSW(true);
    });
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
