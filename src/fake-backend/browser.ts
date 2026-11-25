import { setupWorker } from 'msw/browser';
import { loginHandlers } from './handlers/login';
import { refreshTokenHandlers } from './handlers/refresh-token';
import { exampleHandlers } from './handlers/example';

// Service Worker with every handler. Register new endpoint families here.
export const worker = setupWorker(
  ...loginHandlers,
  ...refreshTokenHandlers,
  ...exampleHandlers,
);
