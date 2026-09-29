import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.tsx'
import { PermissionsProvider } from './app/PermissionsContext'
import { ThemeProvider } from './app/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PermissionsProvider>
          <App />
        </PermissionsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
