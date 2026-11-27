import type { Environment } from './environment.types';

export const environment: Environment = {
  // Local development: the MSW fake backend serves every API
  useMSW: true,
  apis: {
    exampleApi: '/example-api',
  },
};
