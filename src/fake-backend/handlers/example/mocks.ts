import type {
  CreateExampleResponse,
  GetExampleResponse,
  UpdateExampleResponse,
} from '@core/api/example/example.types';

export const exampleGetMock: GetExampleResponse = {
  example: 'Example data served by the MSW fake backend',
};

export const examplePostMock: CreateExampleResponse = {
  message: 'Example created successfully',
  id: 1,
};

export const examplePutMock: UpdateExampleResponse = {
  message: 'Example updated successfully',
  id: 1,
};
