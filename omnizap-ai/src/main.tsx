import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Limpa locks corrompidos do Supabase Auth no localStorage
// Isso resolve o bug de "lock not released in 5000ms"
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Identifica e limpa os locks do gotrue-js (antigos e o personalizado)
    if (key && (key.startsWith('lock:') || key.includes('-auth-token-code-verifier'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
} catch {
  // ignore storage errors
}

createRoot(document.getElementById('root')!).render(
  <App />
);
