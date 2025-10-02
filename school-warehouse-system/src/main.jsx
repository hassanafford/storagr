import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './components/NotificationProvider'
import App from './App.jsx'
import './index.css'

// Remove StrictMode to prevent double mounting issues
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </BrowserRouter>
)