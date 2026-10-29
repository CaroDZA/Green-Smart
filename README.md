Green Smart - sistema web para la gestion y seguimiento del cultivo de aguacate (Agroindustria Las Violetas).
PPI 4to semestre, Tecnologico de Antioquia.
• Tecnologias: React 19 + Vite (frontend), Node.js + Express 5 + Prisma 7 (backend), PostgreSQL en Supabase.
• Requisitos: Node.js 20 o superior, una base de datos en Supabase.
• Backend: cd backend, npm install, copiar .env.example a .env y llenar los valores, npx prisma
migrate deploy, npm run seed -- --confirmar (borra los datos), npm run dev (puerto 3000).
• Frontend: cd frontend, npm install, copiar .env.example a .env
(VITE_API_URL=http://localhost:3000/api), npm run dev (puerto 5173).
• Usuarios de prueba (seed): admin@greensmart.com, coordinador@greensmart.com y
operario@greensmart.com. La clave es la definida en SEED_PASSWORD.
• Roles: Administrador de finca, Coordinador de campo y Operario.
• Estructura: backend/src (routes, controllers, middlewares, utils) y frontend/src (pages, components, services,
context, hooks).
• Equipo: los cinco integrantes de la portada del documento.
