import { setupWorker } from 'msw/browser';
import { exampleApiHandlers } from './handlers/example-api';

// Service Worker with the handlers of every API. Register new APIs here.
export const worker = setupWorker(...exampleApiHandlers);
