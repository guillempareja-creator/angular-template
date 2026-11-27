# Capa de API

> Cómo habla el frontend con sus backends. El patrón es agnóstico de framework;
> la implementación de referencia (Angular) está en
> `src/app/core/api/example-api/` y sus detalles en
> [`../stack/angular.md`](../stack/angular.md). Paso a paso: skill
> `api-endpoint`.

## 1. Modelo: APIs y familias

Una aplicación puede consumir **una o varias APIs** (backends distintos, cada
uno con su URL base). Dentro de cada API, los endpoints se agrupan en
**familias** por el primer segmento de su URL.

```
src/app/core/api/
└── {api}/                         ← Una carpeta por API (backend), en kebab-case
    ├── {api}.constants.ts         ← URL base de la API: `{API}_URL`
    └── {familia}/                 ← Una carpeta por familia = primer segmento de URL
        ├── {familia}.service.ts   ← Un método por endpoint de la familia
        ├── {familia}.service.spec.ts
        └── {familia}.types.ts     ← Tipos de dominio + Request/Response
```

Ejemplo del template: la API `example-api` con la familia `example`
(`GET /example`).

**Regla de profundidad**: solo el primer segmento de la URL crea carpeta. Los
segmentos más profundos son **métodos** del mismo servicio, nunca subcarpetas:

- `GET  {exampleApi}/example` → `core/api/example-api/example/` · `getExample()`
- `GET  {exampleApi}/example/:id` → mismo servicio · `getExampleById(id)`
- `POST {exampleApi}/example/document` → mismo servicio ·
  `createExampleDocument(body)`
- `GET  {otherApi}/users` → `core/api/other-api/users/` · `getUsers()`

Una carpeta de familia que refleja un segmento en otro idioma (`/expedientes`)
se llama igual que el segmento en kebab-case, pero los **métodos y tipos van en
inglés** (`searchExpedients()`).

## 2. URL base de cada API: entornos

Cada API tiene su URL base por entorno en `environment.apis` (tipado con
`src/environments/environment.types.ts`):

```typescript
// src/environments/environment.ts (desarrollo: todo lo sirve el mock MSW)
export const environment: Environment = {
  useMSW: true,
  apis: {
    exampleApi: '/example-api',
  },
};
```

| Fichero               | Entorno                | Cómo se usa                           |
| --------------------- | ---------------------- | ------------------------------------- |
| `environment.ts`      | Desarrollo local + e2e | `npm start` / `npm run e2e` (con MSW) |
| `environment.tst.ts`  | Test (backend real)    | `npm run start:tst` / build `tst`     |
| `environment.prod.ts` | Producción             | `npm run build`                       |

Cada carpeta de API expone su URL en **una constante** que usan sus servicios y
sus mocks:

```typescript
// core/api/example-api/example-api.constants.ts
export const EXAMPLE_API_URL = environment.apis.exampleApi;

// core/api/example-api/example/example.service.ts (Angular)
this.http.get<GetExampleResponse>(`${EXAMPLE_API_URL}/example`);
```

Así cada llamada dice explícitamente a qué API va, sin magia. **Añadir una API**
= nueva entrada en `Environment['apis']` y en los tres entornos + carpeta
`core/api/{api}/` con su constante + carpeta espejo en el fake backend (§7).

## 3. Servicio de una familia

Contrato (independiente del framework):

- **Un método por endpoint**, con nombre en inglés verbo+entidad (`getExample`,
  `updateExample`).
- Devuelve **`Promise`** de la respuesta tipada; quien llama usa `async/await`.
- URL = constante de la API + ruta del endpoint. Nunca URLs absolutas sueltas ni
  `/api/...` hardcodeado.
- **Sin estado ni lógica de negocio**: eso va en el componente o en un servicio
  de dominio.
- Descargas de fichero: respuesta `Blob`.
- Todo servicio tiene su **test** (se aserta método, URL, body y respuesta) y su
  **mock MSW** (§7).

Implementación de referencia:
[`example.service.ts`](../../src/app/core/api/example-api/example/example.service.ts)
y su [spec](../../src/app/core/api/example-api/example/example.service.spec.ts).

## 4. Tipos: `{familia}.types.ts` y modelos moleculares

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
export type UpdateExampleResponse = { id: ExampleId };
```

- Dos bloques con banner: tipos de dominio arriba, Request/Response abajo.
- **Los tipos calcan el método**: `updateExample` → `UpdateExampleRequest` /
  `UpdateExampleResponse`.
- Request/Response suelen ser alias o derivados (`Omit`, `Pick`, `Partial`) de
  los tipos de dominio.
- `type`, nunca `interface`. Solo se exporta lo que se usa fuera (knip detecta
  exports muertos).

**Modelos moleculares**: primero alias **átomo** con significado de dominio,
luego se componen. Nunca `string`/`number` a pelo en un tipo de API si existe (o
debería existir) un átomo:

```typescript
// shared/models/expedient.types.ts — átomos transversales (uno por área conceptual)
export type ExpedientId = number;
export type Nif = string;

// core/api/main-api/expedients/expedients.types.ts — molécula
export type GetExpedientResponse = { id: ExpedientId; holderNif: Nif };
```

Antes de crear un campo, buscar un átomo equivalente en `shared/models/`; si el
concepto es transversal y no existe, crearlo ahí; si es puntual, definirlo en el
propio `*.types.ts`. Un `*.types.ts` puede re-exportar los átomos que necesiten
sus consumidores (`export type { Nif };`) para que importen de un solo sitio.

## 5. Contratos con el backend

El template **no impone** ningún contrato de errores, avisos, paginación ni
autenticación: cada proyecto los define con su backend. Cuando se definan, se
documentan aquí (formato de error, códigos, cabeceras…) y se implementan en el
interceptor (§6).

## 6. Interceptor: punto único de paso de las llamadas

Todas las peticiones HTTP pasan por un único interceptor,
[`http.interceptor.ts`](../../src/app/core/interceptors/http.interceptor.ts),
registrado en la configuración de la app. **Hoy no hace nada** (deja pasar la
petición): es el punto de enganche previsto para la lógica transversal que cada
proyecto decida, por ejemplo:

- **Autenticación**: añadir la cabecera `Authorization`, refrescar el token ante
  un `401`…
- **Errores**: traducir los errores del backend a un mensaje para el usuario.
- **Loader global** o métricas de las llamadas en vuelo.

Reglas para cuando se implemente:

- La lógica vive en el interceptor (o en interceptores de **una sola
  responsabilidad** si crece), nunca repetida en cada servicio o componente.
- Hay que **ignorar lo que no sea una llamada a una API** propia: los JSON de
  traducciones (`./assets/i18n/*.json`) también pasan por el cliente HTTP.
- Si una llamada necesita una opción propia (p. ej. no mostrar el loader), se
  pasa con el mecanismo de contexto por petición del framework (en Angular,
  `HttpContext`), nunca con cabeceras inventadas que lleguen al backend.
- Cada interceptor tiene su test.

## 7. Fake backend (MSW): `src/fake-backend/`

Todo endpoint tiene su **mock espejo**, servido por [MSW](https://mswjs.io)
(Mock Service Worker): intercepta las peticiones en el navegador, así que la app
arranca y los e2e corren **sin backend real**. Se activa con
`environment.useMSW` y **solo existe en desarrollo**: los builds de test y
producción no incluyen ni el worker ni su código.

```
src/fake-backend/
├── browser.ts                ← setupWorker(...) con los handlers de todas las APIs
├── enable-mocking.ts         ← Arranca el worker si environment.useMSW
├── enable-mocking.noop.ts    ← Sustituto vacío en tst/producción
├── mockServiceWorker.js      ← Generado por MSW (no se edita)
└── handlers/
    └── {api}/                ← Espejo de core/api/{api}/
        ├── index.ts          ← export const {api}Handlers = [...familiaHandlers, …]
        └── {familia}/        ← Espejo de core/api/{api}/{familia}/
            ├── handlers.ts   ← Handlers http.get/post/put/delete
            ├── mocks.ts      ← Datos estáticos tipados con los Response
            └── index.ts      ← export * from './handlers'; export * from './mocks';
```

```typescript
// handlers/example-api/example/handlers.ts
export const exampleHandlers = [
  // GET /example
  http.get(`${EXAMPLE_API_URL}/example`, async () => {
    await delay();
    return HttpResponse.json(exampleGetMock);
  }),
];
```

- **`mocks.ts`**: objetos planos con datos realistas, **tipados con los
  Response** de `core/api/` (si el contrato cambia, el mock deja de compilar).
  Sin lógica.
- **`handlers.ts`**: lo más simples posible; misma URL que el servicio
  (constante de la API + ruta); `await delay()` simula latencia. En updates,
  `{ ...mock, ...body }` si la UI debe reflejar lo enviado; en deletes, `204`
  sin body; errores con `HttpResponse.json(body, { status })`.
- **Orden**: rutas más específicas primero (`/example/document` antes que
  `/example/:id`).
- **Registro**: cada familia se añade al `index.ts` de su API y cada API, a
  `browser.ts`.
- La app **nunca** importa el fake backend (lo impide `lint:arch`); el fake
  backend sí puede importar tipos y constantes de la app.
- Es el backend de los **e2e**: sus datos deben permitir recorrer los flujos
  felices.

## 8. Crear un endpoint (siempre completo)

tipos → servicio (+ test) → mock (`mocks.ts` + `handlers.ts`) → registro de la
familia y la API → uso en la pantalla → e2e si cambia un flujo. Detalle: skill
`api-endpoint`.
