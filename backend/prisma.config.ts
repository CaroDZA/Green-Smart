import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Usamos DIRECT_URL (puerto 5432) para las migraciones
    url: env('DIRECT_URL'),
  },
});