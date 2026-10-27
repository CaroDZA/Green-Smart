# Green Smart - Frontend

Interfaz web de Green Smart hecha con React + Vite. Usa la API del backend (carpeta `/backend`).

## Cómo ejecutarlo

1. Encender el backend (en otra terminal):

   ```bash
   cd backend
   npm install
   npm run dev        # queda en http://localhost:3000
   ```

2. Encender el frontend:

   ```bash
   cd frontend
   npm install
   npm run dev        # abrir http://localhost:5173
   ```

Por defecto el frontend busca el backend en `http://localhost:3000/api`.
Si el backend corre en otro puerto, crear el archivo `frontend/.env` con:

```
VITE_API_URL=http://localhost:PUERTO/api
```

## Páginas

| Página | Qué hace | Requisito |
|---|---|---|
| Login | Iniciar sesión (las cuentas y contraseñas nuevas las da el administrador en SmartControl) | RF-01 |
| Dashboard | Resumen y estado de cada lote según su último monitoreo | RF-05 |
| Reportes | Mejores resultados, gráficas, reporte por fechas y PDF | RF-16, RF-18 |
| Lotes de la finca | Registrar lotes y verlos como tarjetas; al hacer clic se ve todo el lote. El administrador también puede ver los lotes inactivos y bajar su PDF | RF-01, RF-16 |
| Planificación por etapas | Asignar etapas a los lotes con fechas | RF-02 |
| Cronograma de actividades | Programar, asignar, editar y completar actividades con novedades. Se ve como tabla o como calendario; las atrasadas salen como "Vencida". El operario solo ve sus tareas | RF-03, RF-04, RF-07 |
| Monitoreo del cultivo | Registrar el estado de las plantas, plagas y enfermedades | RF-06, RF-08, RF-09 |
| SmartControl | Registrar usuarios y editar su nombre, correo, rol o contraseña (solo administrador) | — |

También tiene alertas (campana, RF-10) y modo claro / oscuro.

## Carpetas

- `src/pages` — una página por archivo (Login, Dashboard, Reportes, Lotes, Etapas, Actividades, Monitoreos, SmartControl)
- `src/components` — piezas de las páginas: menú (`PlantillaPrincipal`), ventanas (`VentanaModal`, `DetalleLote`, `VentanaApariencia`), `Tablas`, `Graficas`, `MenuAlertas`, `TarjetaLote`, `TarjetaLoteInactivo`, `Calendario`
- `src/components/formularios` — formularios de lote, etapa, actividad, monitoreo y usuario
- `src/services` — conexión con el backend (`api.js`) y una función por cada ruta (`greensmart.js`)
- `src/context` — sesión (`SesionContexto`), modo oscuro (`TemaContexto`) y mensajes (`AvisosContexto`)
- `src/hooks` — `useCarga`, para traer datos del backend
- `src/utils` — `formatos.js`: fechas, dinero, nombres y permisos por rol
- `src/styles` — estilos del mockup (`global.css`) y estilos extra (`estilos-extra.css`)

## Pendiente en el backend

- Asignar una actividad a una persona: solo lo puede hacer el administrador, porque la lista de usuarios (`GET /auth/usuarios`) es solo para él.

## Motivo al desactivar un lote

El backend no tiene un campo para el motivo, así que el front lo guarda al final de la descripción del lote
(`Motivo de desactivación: ...`) justo antes de desactivarlo. Así queda en la base de datos y se muestra en los lotes inactivos.
