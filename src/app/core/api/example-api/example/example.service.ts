import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EXAMPLE_API_URL } from '../example-api.constants';
import type { GetExampleResponse } from './example.types';

/**
 * Reference API service of the `/example` family of the example API: one
 * method per endpoint, URLs built from the API constant, Promises.
 * Replace it with the real APIs and families of the project.
 */
@Injectable({
  providedIn: 'root',
})
export class ExampleService {
  // Injections
  private http = inject(HttpClient);

  // Methods
  public getExample(): Promise<GetExampleResponse> {
    return firstValueFrom(
      this.http.get<GetExampleResponse>(`${EXAMPLE_API_URL}/example`),
    );
  }
}
