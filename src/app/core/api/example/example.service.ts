import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  DEFAULT_SUCCESS_MESSAGE,
  requestContext,
} from '@core/interceptors/http-context.tokens';
import type {
  CreateExampleRequest,
  CreateExampleResponse,
  ExampleId,
  GetExampleDocumentResponse,
  GetExampleResponse,
  UpdateExampleRequest,
  UpdateExampleResponse,
} from './example.types';

/**
 * Reference API service: one method per endpoint, relative URLs, Promises.
 * Replace it with the real API families of the project.
 */
@Injectable({
  providedIn: 'root',
})
export class ExampleService {
  // Injections
  private http = inject(HttpClient);

  // Methods
  public getExample(): Promise<GetExampleResponse> {
    return firstValueFrom(this.http.get<GetExampleResponse>('/example'));
  }

  public createExample(
    body: CreateExampleRequest,
  ): Promise<CreateExampleResponse> {
    return firstValueFrom(
      this.http.post<CreateExampleResponse>('/example', body, {
        context: requestContext({ successMessage: DEFAULT_SUCCESS_MESSAGE }),
      }),
    );
  }

  public updateExample(
    id: ExampleId,
    body: UpdateExampleRequest,
  ): Promise<UpdateExampleResponse> {
    return firstValueFrom(
      this.http.put<UpdateExampleResponse>(`/example/${id}`, body, {
        context: requestContext({ successMessage: 'exampleUpdated' }),
      }),
    );
  }

  public getExampleDocument(): Promise<GetExampleDocumentResponse> {
    return firstValueFrom(
      this.http.get('/example/document', {
        responseType: 'blob',
        context: requestContext({ showLoader: false }),
      }),
    );
  }
}
