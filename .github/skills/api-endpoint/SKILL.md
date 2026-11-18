---
name: api-endpoint
description: >
  Use when creating a new API endpoint in this Angular project — a service method that calls the
  backend, its TypeScript types, its unit spec and the corresponding fake-backend mock handler (MSW).
  Also use when the user asks in Spanish to crear un endpoint, añadir una llamada al backend, crear un
  servicio de API, crear los tipos de un endpoint, crear el mock, crear el handler de MSW, or any task
  related to connecting a new backend operation. Covers the folder structure under core/api/, atomic
  types from shared/models/, {Method}Request/{Method}Response naming, services with firstValueFrom,
  relative URLs and requestContext (HttpContext), specs with HttpTestingController, and the MSW
  fake backend (handlers.ts + mocks.ts + index.ts per family, apiUrl, requireAuth, registration in
  browser.ts).
user-invocable: true
---

# Skill: Crear un endpoint de API (servicio + tipos + spec + mock MSW)

## 1. Cuándo usar esta skill

Cada vez que la app necesite una operación nueva del backend. Un endpoint completo son **cuatro
piezas** y ninguna es opcional:

1. Método en `core/api/{familia}/{familia}.service.ts`
2. Tipos en `core/api/{familia}/{familia}.types.ts`
3. Spec en `core/api/{familia}/{familia}.service.spec.ts`
4. Mock MSW en `src/fake-backend/handlers/{familia}/` (registrado en `browser.ts`)

## 2. Estructura

```
src/app/core/api/
└── example/                     # family = first URL segment (/example, /example/:id, /example/document)
    ├── example.service.ts
    ├── example.service.spec.ts
    └── example.types.ts

src/fake-backend/
├── browser.ts                   # setupWorker(...loginHandlers, ...exampleHandlers, ...)
├── handlers/
│   └── example/
│       ├── handlers.ts          # msw http.* handlers
│       ├── mocks.ts             # mock data typed with the Response types
│       └── index.ts             # barrel: export * from './handlers'; export * from './mocks';
└── utils/                       # apiUrl, requireAuth, getWarningHeaders, getDocumentHeaders, generatePDF
```

- **Una carpeta por familia** = primer segmento de la URL. Segmentos más profundos
  (`/example/:id`, `/example/document`) son **métodos** del mismo servicio, nunca subcarpetas.
- Nombre de carpeta en kebab-case (`/refreshToken` → `refresh-token/`).

## 3. Tipos (`example.types.ts`)

```typescript
//----------------------------------------------------------------
// DOMAIN DATA TYPES
//----------------------------------------------------------------

export type ExampleId = number;

type ExampleData = {
  example: string;
};

//----------------------------------------------------------------
// API REQUEST / RESPONSE TYPES
//----------------------------------------------------------------

// getExample
export type GetExampleResponse = ExampleData;

// updateExample
export type UpdateExampleRequest = ExampleData;
export type UpdateExampleResponse = {
  message: string;
  id: ExampleId;
};

// getExampleDocument
export type GetExampleDocumentResponse = Blob;
```

- `type`, nunca `interface`. Nombre del tipo = nombre del método en PascalCase + `Request` / `Response`.
- Átomos semánticos compartidos (`Token`, ids…) en `shared/models/*.types.ts`; si solo los usa una
  familia, en su propio `*.types.ts`.
- Solo se exporta lo que se usa fuera (knip falla con exports sin usar).

## 4. Servicio (`example.service.ts`)

```typescript
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
  GetExampleResponse,
  UpdateExampleRequest,
  UpdateExampleResponse,
} from './example.types';

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

  public createExample(body: CreateExampleRequest): Promise<CreateExampleResponse> {
    return firstValueFrom(
      this.http.post<CreateExampleResponse>('/example', body, {
        context: requestContext({ successMessage: DEFAULT_SUCCESS_MESSAGE }),
      }),
    );
  }

  public updateExample(id: ExampleId, body: UpdateExampleRequest): Promise<UpdateExampleResponse> {
    return firstValueFrom(
      this.http.put<UpdateExampleResponse>(`/example/${id}`, body, {
        context: requestContext({ successMessage: 'exampleUpdated' }),
      }),
    );
  }
}
```

- Siempre `firstValueFrom(...)` → el servicio devuelve `Promise`. (Única excepción:
  `RefreshTokenService`, que devuelve `Observable` porque lo consume el auth interceptor.)
- **URL relativa** (`'/example'`): `apiUrlInterceptor` antepone `environment.api` y
  `authInterceptor` añade el bearer token. Nunca construir URLs absolutas ni headers de auth.
- Toast de éxito / loader con `requestContext({ successMessage, showLoader })` — skill
  `@success-notifications`. Los errores se notifican solos.
- Sin lógica de negocio ni estado: eso va en el componente o en un servicio de dominio.
- Si otra pieza necesita la URL (como el auth interceptor con `/login`), exportarla como constante:
  `export const LOGIN_URL = '/login';`.

## 5. Spec (`example.service.spec.ts`)

```typescript
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SUCCESS_MESSAGE } from '@core/interceptors/http-context.tokens';
import { ExampleService } from './example.service';

describe('ExampleService', () => {
  let service: ExampleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExampleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('createExample → POST /example with the default success toast', async () => {
    const response = service.createExample({ example: 'new' });

    const call = httpTesting.expectOne({ method: 'POST', url: '/example' });
    expect(call.request.body).toEqual({ example: 'new' });
    expect(call.request.context.get(SUCCESS_MESSAGE)).toBe('default');
    call.flush({ message: 'created', id: 1 });

    await expect(response).resolves.toEqual({ message: 'created', id: 1 });
  });
});
```

Un `it` por método: método HTTP, URL relativa, body, tokens de contexto y respuesta resuelta.
Más patrones en la skill `@testing`.

## 6. Mock MSW (`src/fake-backend/handlers/example/`)

`mocks.ts` — datos tipados con los tipos de respuesta reales (si cambia el contrato, el mock deja
de compilar):

```typescript
import type { GetExampleResponse } from '@core/api/example/example.types';

export const exampleGetMock: GetExampleResponse = {
  example: 'Example data served by the MSW fake backend',
};
```

`handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import { sleep } from '@shared/utils/delay.utils';
import { apiUrl, requireAuth } from '../../utils';
import { exampleGetMock } from './mocks';

export const exampleHandlers = [
  // GET /example
  http.get(apiUrl('/example'), async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) {
      return unauthorized;
    }

    await sleep();
    return HttpResponse.json(exampleGetMock);
  }),
];
```

`index.ts`:

```typescript
export * from './handlers';
export * from './mocks';
```

Registro en `src/fake-backend/browser.ts`:

```typescript
export const worker = setupWorker(
  ...loginHandlers,
  ...refreshTokenHandlers,
  ...exampleHandlers,
);
```

- `apiUrl('/path')` antepone `environment.api` — misma URL que resuelve el interceptor. Parámetros
  de ruta con sintaxis MSW: `apiUrl('/example/:id')`.
- `requireAuth(request)` en **todo endpoint protegido** (devuelve un 401 si no hay token válido).
  Solo los endpoints públicos (login, refresh) no lo llevan.
- `await sleep()` simula latencia (para ver el loader).
- Avisos con `getWarningHeaders('tag')`, ficheros con `getDocumentHeaders(...)` + `generatePDF()`,
  errores con `HttpResponse.json({ tag: 'miError' }, { status: 400 })`.
- MSW solo corre en desarrollo (`environment.useMSW`); en `tst`/producción `enable-mocking.ts` se
  sustituye por `enable-mocking.noop.ts` y el fake backend no entra en el bundle. La app
  (`src/app`) **nunca** importa de `src/fake-backend` (lo comprueba `lint:arch`).
- Los e2e de Playwright corren contra estos mocks: si el flujo se ve en pantalla, añadir o
  actualizar el spec en `e2e/`.

## Checklist

- [ ] Carpeta `core/api/{familia}/` por primer segmento de URL; métodos para segmentos profundos
- [ ] Tipos `{Method}Request` / `{Method}Response` con `type`; átomos de `shared/models/`
- [ ] `firstValueFrom` + URL relativa + `requestContext` si hay toast/loader
- [ ] Spec con `HttpTestingController` (método, URL, body, contexto, respuesta)
- [ ] `mocks.ts` tipado + `handlers.ts` con `apiUrl` y `requireAuth` + `index.ts`
- [ ] Familia registrada en `src/fake-backend/browser.ts`
- [ ] Claves i18n de los tags nuevos (`httpRequest.*`)
- [ ] **`npm run check` en verde**
