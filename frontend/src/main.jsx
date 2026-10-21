// Primer archivo que se ejecuta al abrir la página

// Modo de React que avisa errores mientras programamos
import { StrictMode } from 'react'
// Sirve para mostrar React dentro del HTML
import { createRoot } from 'react-dom/client'
// Estilos copiados del mockup
import './styles/global.css'
// Estilos extra de este proyecto
import './styles/estilos-extra.css'
// Componente principal de la app
import App from './App.jsx'

// Muestra la app dentro del <div id="root"> del index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
