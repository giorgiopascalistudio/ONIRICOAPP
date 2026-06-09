import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MobileHomeHint } from './components/MobileHomeHint';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MobileHomeHint />
  </StrictMode>,
);
