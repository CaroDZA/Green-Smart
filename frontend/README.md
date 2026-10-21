# Green Smart - Frontend

React + Vite. Consume la API del backend (`/backend`).

## Ejecutar

```bash
cd frontend
npm install
cp .env.example .env   # opcional: cambia VITE_API_URL si el backend no está en http://localhost:3000/api
npm run dev            # http://localhost:5173
```

El backend debe estar corriendo (`npm run dev` en `/backend`) y su `FRONTEND_URL` debe apuntar a `http://localhost:5173` (CORS).

## Estructura

- `src/pages` — vistas: Dashboard, Reportes, Lotes, Etapas, Actividades, Monitoreos, Usuarios, Login
- `src/components` — layout (sidebar/topbar), modales, formularios, tablas, gráficas
- `src/services` — llamadas a la API (`api.js` maneja el token JWT)
- `src/context` — sesión, tema claro/oscuro y notificaciones
- `src/styles` — estilos del mockup v2 (`global.css`) + extensiones (`app.css`)
