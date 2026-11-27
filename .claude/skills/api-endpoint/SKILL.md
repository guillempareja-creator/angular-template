---
name: api-endpoint
description: >
  Use when connecting the app to a backend operation: a new API service method, its TypeScript
  types, its unit spec and its MSW fake-backend mock; also when adding a whole new API (backend).
  Also use when the user asks in Spanish to crear un endpoint, añadir una llamada al backend, crear
  un servicio de API, añadir una API, crear los tipos de un endpoint, crear el mock or crear el
  handler de MSW. Covers core/api/{api}/{familia}/, the API URL constant from environment.apis,
  {Method}Request/{Method}Response types, Angular services with firstValueFrom, specs with
  HttpTestingController and MSW handlers mirrored under src/fake-backend/handlers/{api}/{familia}/.
user-invocable: true
---

# Skill: Conectar un endpoint (servicio + tipos + test + mock MSW)

## 1. Cuándo usar esta skill

Cada vez que la app necesite una operación del backend. Un endpoint completo son **cuatro piezas** y
ninguna es opcional: tipos, método del servicio, test y mock MSW registrado. Arquitectura y razones:
[`docs/architecture/api.md`](../../../docs/architecture/api.md).

```
src/app/core/api/{api}/
├── {api}.constants.ts             ← {API}_URL (ya existe si la API existe)
└── {familia}/                     ← familia = primer segmento de la URL
    ├── {familia}.service.ts
    ├── {familia}.service.spec.ts
    └── {familia}.types.ts
src/fake-backend/handlers/{api}/
├── index.ts                       ← {api}Handlers = [...familias]
└── {familia}/ handlers.ts · mocks.ts · index.ts
```

Segmentos más profundos de la URL (`/example/:id`) son **métodos** del mismo servicio, nunca
subcarpetas. Carpetas en kebab-case (`/refreshToken` → `refresh-token/`).

## 2. Si la API es nueva

1. Añadir la entrada en `Environment['apis']` (`src/environments/environment.types.ts`) y en los
   tres entornos: `environment.ts` con una ruta para el mock (`'/billing-api'`) y `tst`/`prod` con la
   URL real (o un placeholder + fila en `docs/project/TODOS.md`).
2. Crear `core/api/{api}/{api}.constants.ts`:

   ```typescript
   import { environment } from '../../../../environments/environment';

   /** Base URL of the billing API. Every service of this API builds its URLs from it. */
   export const BILLING_API_URL = environment.apis.billingApi;
   ```

3. Crear `src/fake-backend/handlers/{api}/index.ts` y registrarlo en `src/fake-backend/browser.ts`.

## 3. Ejemplo: añadir `PUT /example/:id` a la familia `example`

### Tipos (`example.types.ts`)

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
export type UpdateExampleResponse = ExampleData & { id: ExampleId };
```

- `type`, nunca `interface`; nombre = método en PascalCase + `Request`/`Response`.
- Átomos compartidos en `shared/models/*.types.ts` (no `string`/`number` a pelo si hay un átomo).
- Solo se exporta lo que se usa fuera (knip falla con exports muertos).

### Servicio (`example.service.ts`)

```typescript
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

  public updateExample(
    id: ExampleId,
    body: UpdateExampleRequest,
  ): Promise<UpdateExampleResponse> {
    return firstValueFrom(
      this.http.put<UpdateExampleResponse>(`${EXAMPLE_API_URL}/example/${id}`, body),
    );
  }
}
```

- Siempre `firstValueFrom(...)`: el servicio devuelve `Promise`.
- URL = constante de la API + ruta. Nunca URLs absolutas sueltas.
- Sin estado ni lógica de negocio. Descargas: `responseType: 'blob'` y respuesta `Blob`.
- Lo transversal (auth, errores, loader) no va aquí: va en el interceptor
  ([`api.md`](../../../docs/architecture/api.md) §6).

### Test (`example.service.spec.ts`)

```typescript
it('updateExample → PUT {exampleApi}/example/:id', async () => {
  const response = service.updateExample(7, { example: 'edited' });

  const call = httpTesting.expectOne({
    method: 'PUT',
    url: `${EXAMPLE_API_URL}/example/7`,
  });
  expect(call.request.body).toEqual({ example: 'edited' });
  call.flush({ id: 7, example: 'edited' });

  await expect(response).resolves.toEqual({ id: 7, example: 'edited' });
});
```

Un `it` por método (método HTTP, URL, body y respuesta resuelta). Montaje completo del spec:
[`example.service.spec.ts`](../../../src/app/core/api/example-api/example/example.service.spec.ts)
y skill `unit-testing`.

### Mock MSW (`src/fake-backend/handlers/example-api/example/`)

`mocks.ts` — datos tipados con los Response reales (si cambia el contrato, deja de compilar):

```typescript
export const examplePutMock: UpdateExampleResponse = {
  id: 1,
  example: 'Example updated by the MSW fake backend',
};
```

`handlers.ts` — misma URL que el servicio; rutas específicas antes que las genéricas:

```typescript
export const exampleHandlers = [
  // GET /example
  http.get(`${EXAMPLE_API_URL}/example`, async () => {
    await delay();
    return HttpResponse.json(exampleGetMock);
  }),

  // PUT /example/:id — echoes the body so the UI reflects what was sent
  http.put<{ id: string }, UpdateExampleRequest>(
    `${EXAMPLE_API_URL}/example/:id`,
    async ({ request }) => {
      const body = await request.json();
      await delay();
      return HttpResponse.json({ ...examplePutMock, ...body });
    },
  ),
];
```

- Los genéricos de `http.*` (`<PathParams, RequestBody>`) tipan `request.json()`: nada de `as`.
- `await delay()` simula latencia. Deletes: `new HttpResponse(null, { status: 204 })`. Errores:
  `HttpResponse.json(body, { status: 400 })` con el contrato de error que use el proyecto.
- Familia nueva: `index.ts` (`export * from './handlers'; export * from './mocks';`), añadirla al
  `index.ts` de su API y comprobar que la API está en `browser.ts`.
- La app nunca importa `src/fake-backend/` (`lint:arch`). Si el endpoint se ve en un flujo, añade o
  actualiza su e2e (skill `e2e-testing`): corre contra estos mocks.

## Checklist

- [ ] Carpeta `core/api/{api}/{familia}/` (primer segmento de URL); métodos para segmentos profundos
- [ ] API nueva: `environment.apis` en los 3 entornos + `{api}.constants.ts` + mocks registrados
- [ ] Tipos `{Method}Request`/`{Method}Response` con `type`; átomos de `shared/models/`
- [ ] `firstValueFrom` + URL desde la constante de la API
- [ ] Test con `HttpTestingController` (método, URL, body, respuesta)
- [ ] `mocks.ts` tipado + `handlers.ts` + `index.ts` + registro en la API y en `browser.ts`
- [ ] **`npm run check` en verde** (skill `verify`)
