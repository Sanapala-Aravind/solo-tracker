import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import GlobalAiButton from './AiSuggestions.jsx'
import api from './api'
import './theme.css'


// Ensure default categories exist before first render
api.ensureDefaultCategories?.().catch(() => {})

const root = createRoot(document.getElementById('root'))
root.render(
  <BrowserRouter>
    <App />
    <GlobalAiButton />
  </BrowserRouter>
)
