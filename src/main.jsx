import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CourtCoachProvider } from './context/CourtCoachContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CourtCoachProvider>
        <App />
      </CourtCoachProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
