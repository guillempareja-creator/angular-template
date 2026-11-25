---
name: success-notifications
description: >
  Use when an API call must show a success toast, hide the global loader, react to a backend warning,
  or map a backend error to a user message — and when showing toasts programmatically. Also use when
  the user asks in Spanish to añadir mensaje de éxito, notificación de éxito, toast de éxito, mensaje
  al crear, mensaje al guardar, ocultar el loader, sin spinner, mensaje de aviso del backend, mensaje
  de error del backend, mostrar una notificación, or any task involving toasts. Covers the HttpContext
  tokens SUCCESS_MESSAGE and SHOW_LOADER via requestContext({ successMessage, showLoader }),
  DEFAULT_SUCCESS_MESSAGE, the Back-Custom-Warning-Message response header (HttpCustomHeader),
  backend error tags, httpRequest.{success,warning,error}.* i18n keys and NotificationService.
user-invocable: true
---

# Skill: Notificaciones de llamadas HTTP (éxito, aviso, error) y loader

## 1. Cuándo usar esta skill

Al crear o modificar un método de `core/api/` que deba mostrar un toast de éxito o no mostrar el
loader global, al montar el mock de un endpoint que devuelve avisos o errores con tag, o al mostrar
un toast desde código (no HTTP).

Las opciones de cada petición viajan como **`HttpContext`** (no como headers). No existen headers
de petición personalizados.

## 2. Cómo funciona

Interceptores funcionales (`app.config.ts`, en este orden): `loader` → `notification` → `auth` →
`apiUrl`. Solo actúan sobre **peticiones a la API** (URL relativa que empieza por `/`, ni `//` ni
`/assets/`).

| Qué | Origen | Clave i18n | Por defecto |
|---|---|---|---|
| Loader global | token `SHOW_LOADER` | `globalLoader.loading` | **sí** (`true`) |
| Toast de éxito | token `SUCCESS_MESSAGE` (tag) | `httpRequest.success.{tag}` | **no** (`null`) |
| Toast de aviso | header de **respuesta** `Back-Custom-Warning-Message` (tag) | `httpRequest.warning.{tag}` | — |
| Toast de error | body de error del backend `{ tag }` | `httpRequest.error.{tag}` | `httpRequest.error.default` |
| Sesión caducada | 401 cuyo refresh falla (auth interceptor) | `httpRequest.error.sessionExpired` | — |

- Un tag desconocido cae en `httpRequest.{tipo}.default` (`HttpResponseHandlerService`).
- Si la respuesta trae aviso, el aviso **sustituye** al toast de éxito.
- Un 401 se reintenta tras refrescar el token (single-flight) sin mostrar error; si el refresh
  falla se muestra `sessionExpired` y se cierra la sesión. Login y refresh no se reintentan.
- Los toasts los pinta `NotificationsComponent` (montado una vez en `AppComponent`): se descartan
  solos a los 5 s y no se duplican mensajes idénticos visibles.

## 3. Patrón: opciones por llamada (`core/interceptors/http-context.tokens.ts`)

```typescript
import {
  DEFAULT_SUCCESS_MESSAGE,
  requestContext,
} from '@core/interceptors/http-context.tokens';

// Generic success toast → httpRequest.success.default
public createExample(body: CreateExampleRequest): Promise<CreateExampleResponse> {
  return firstValueFrom(
    this.http.post<CreateExampleResponse>('/example', body, {
      context: requestContext({ successMessage: DEFAULT_SUCCESS_MESSAGE }),
    }),
  );
}

// Custom success toast → httpRequest.success.exampleUpdated
public updateExample(id: ExampleId, body: UpdateExampleRequest): Promise<UpdateExampleResponse> {
  return firstValueFrom(
    this.http.put<UpdateExampleResponse>(`/example/${id}`, body, {
      context: requestContext({ successMessage: 'exampleUpdated' }),
    }),
  );
}

// No global loader (downloads, polling, background calls)
public getExampleDocument(): Promise<GetExampleDocumentResponse> {
  return firstValueFrom(
    this.http.get('/example/document', {
      responseType: 'blob',
      context: requestContext({ showLoader: false }),
    }),
  );
}
```

- `requestContext({ showLoader?, successMessage? })` devuelve un `HttpContext` con
  `SHOW_LOADER` (por defecto `true`) y `SUCCESS_MESSAGE` (por defecto `null`). Sin opciones: no
  pasar `context`.
- Los GET normalmente no llevan toast de éxito; las mutaciones (POST/PUT/PATCH/DELETE) sí, cuando
  el usuario necesita confirmación.
- Cada tag nuevo se añade a `src/assets/i18n/es.json` bajo `httpRequest.success` (skill `@i18n`).

En el spec del servicio se aserta el contexto:

```typescript
expect(call.request.context.get(SUCCESS_MESSAGE)).toBe('exampleUpdated');
expect(call.request.context.get(SHOW_LOADER)).toBe(false);
```

## 4. Avisos y errores del backend (mocks MSW)

El backend comunica avisos con el header de respuesta `HttpCustomHeader.CUSTOM_WARNING_MESSAGE`
(`'Back-Custom-Warning-Message'`, en `shared/enums/http-custom-headers.enum.ts`) y errores con un
body `{ tag }`. En el fake backend:

```typescript
import { http, HttpResponse } from 'msw';
import { sleep } from '@shared/utils/delay.utils';
import { apiUrl, getWarningHeaders, requireAuth } from '../../utils';

// Warning → httpRequest.warning.customWarning
http.put(apiUrl('/example/:id'), async ({ request }) => {
  const unauthorized = requireAuth(request);
  if (unauthorized) {
    return unauthorized;
  }

  await sleep();
  return HttpResponse.json(examplePutMock, {
    headers: getWarningHeaders('customWarning'),
  });
}),

// Error → httpRequest.error.customError
HttpResponse.json({ tag: 'customError' }, { status: 400 });
```

Cada tag de aviso o error que el backend real pueda devolver necesita su clave en
`httpRequest.warning.*` / `httpRequest.error.*`.

## 5. Toasts programáticos (`NotificationService`)

Para feedback que no viene de una llamada HTTP (validaciones, acciones locales):

```typescript
// Injections
private notificationService = inject(NotificationService);
private translate = inject(TranslateService);

// Methods
public handleCopy(): void {
  this.notificationService.success(translateText(this.translate, 'example.detail.copied'));
}
```

API: `success(message)`, `warning(message)`, `error(message)`, `dismiss(id)` y el signal de solo
lectura `notifications`. Reciben el texto **ya traducido**. No duplicar lo que hacen los
interceptores (no mostrar a mano un error HTTP: ya se muestra solo).

## Checklist

- [ ] Opciones con `context: requestContext({ ... })`, nunca con headers de petición
- [ ] `DEFAULT_SUCCESS_MESSAGE` para el genérico; tag propio con su clave en `httpRequest.success.*`
- [ ] `showLoader: false` solo donde el loader estorba (descargas, segundo plano)
- [ ] Tags de aviso/error del backend con clave en `httpRequest.warning.*` / `httpRequest.error.*`
- [ ] Spec del servicio aserta `SUCCESS_MESSAGE` / `SHOW_LOADER`
- [ ] Toasts programáticos con `NotificationService` + `translateText()`
- [ ] **`npm run check` en verde**
