/** Shape shared by every environment file (development, tst and production). */
export type Environment = {
  /** Serve the API calls from the MSW fake backend (local development only). */
  useMSW: boolean;
  /** Base URL of each backend API the app consumes: one entry per API. */
  apis: {
    exampleApi: string;
  };
};
