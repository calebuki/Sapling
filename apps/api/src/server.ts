import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerAsrRoutes } from './routes/asr';
import { registerCourseRoutes } from './routes/course';
import { registerDevToolsRoutes } from './routes/devtools';
import { registerProfileRoutes } from './routes/profiles';
import { registerProgressRoutes } from './routes/progress';
import { registerSessionRoutes } from './routes/sessions';

export function createServer() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true,
    credentials: false
  });

  app.get('/health', async () => ({ ok: true }));

  app.register(registerProfileRoutes);
  app.register(registerCourseRoutes);
  app.register(registerSessionRoutes);
  app.register(registerProgressRoutes);
  app.register(registerAsrRoutes);
  app.register(registerDevToolsRoutes);

  return app;
}
