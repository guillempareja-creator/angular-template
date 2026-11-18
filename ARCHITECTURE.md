# Guía de arquitectura y forma de programar — Frontend Angular

> Documento **agnóstico de negocio**: describe cómo estructuramos, organizamos y escribimos el código
> en nuestros proyectos frontend, para poder replicarlo en cualquier proyecto nuevo.
> No contiene lógica de dominio. Los ejemplos usan entidades genéricas (`Entity`, `EntityA`, `EntityB`)
> solo como ilustración.
>
> La aplicación se describe como una **aplicación Angular única (monolito)**. Los nombres de librerías
> concretas (design system, utilidades corporativas) son intercambiables: cada proyecto usará las suyas.
>
> Este template está pensado para que **agentes de IA implementen los proyectos** y el humano revise
> la funcionalidad. Por eso las reglas no se quedan en papel: casi todas están **automatizadas** en
> los quality gates (§18) y una tarea **no está terminada hasta que `npm run check` pasa en verde**
> (§19).

---

## 1. Filosofía general

Principios que gobiernan todas las demás decisiones:

1. **Screaming architecture**: la estructura de carpetas grita el dominio, no el framework.
   `pages/person/`, `pages/expedient/`… son *vertical slices*: cada dominio contiene sus pantallas,
   componentes, servicios, enums y utilidades.
2. **Los ficheros viven en el nivel más bajo posible.** Un componente/servicio/util nace dentro de la
   pantalla que lo usa. Solo "sube" (a la carpeta del dominio, o a `shared/`) cuando aparece un
   **segundo consumidor real**. `shared/` no es un cajón de sastre: si solo lo usa un dominio, se queda en ese dominio.
3. **Componentes tontos, lógica en servicios.** Los componentes orquestan y pintan; el estado
   compartido y la lógica de negocio viven en servicios. Los componentes "padre" de sub-pantallas no
   contienen lógica de sus hijos.
4. **Extraer funciones utilitarias a la mínima.** Cualquier transformación reutilizable (formateo,
   mapeo, ordenación, validación) se saca a un `*.utils.ts`, un pipe o un validator — nunca se
   duplica ni se deja inline en el componente. Para transformaciones de presentación en template se
   prefieren **pipes** sobre métodos helper en el componente.
5. **Reutilización de componentes**: un formulario que se usa en alta y en modificación es **un solo
   componente** parametrizado con `input`/`output`; nunca dos copias.
6. **Todo tipado, todo explícito**: TypeScript `strict`, sin `any` (usar `unknown` + type guard),
   tipos "moleculares" compartidos, visibilidad explícita en cada miembro.
7. **Angular moderno y zoneless**: standalone components, signals (`signal`/`computed`/`effect`),
   `inject()`, `input()`/`output()`/`viewChild()`/`model()`, control flow `@if`/`@for`/`@switch`,
   `ChangeDetectionStrategy.OnPush` siempre. No hay `zone.js`: la detección de cambios la disparan
   los signals (y los eventos de template), así que **todo estado que pinte la vista es un signal**.
8. **async/await sobre RxJS**: las llamadas HTTP se convierten a promesas con `firstValueFrom`.
   Nada de `subscribe()` manual ni cadenas de operadores salvo en interceptores.
9. **Sin dependencias gratuitas**: solo se usan las librerías de runtime listadas en §2. Añadir una
   nueva exige justificación (qué resuelve que no resuelva Angular o un util propio) y que el bundle
   siga dentro de presupuesto.
10. **Calidad verificable**: todo fichero con lógica nace con su spec; todo flujo de usuario, con su
    test e2e; y las reglas de esta guía se comprueban de forma automática (§18).

---

## 2. Stack técnico

| Pieza | Elección |
|---|---|
| Framework | Angular 22 (standalone, signals, **zoneless** — sin `zone.js`) |
| Lenguaje | TypeScript 6 en modo estricto (ver §18) |
| Runtime / paquetes | Node 24 (`.nvmrc`) · npm |
| Tooling | Angular CLI (`ng serve`, `ng build`, `ng test`) con el builder `@angular/build` |
| Tests unitarios | **Vitest** vía el builder `@angular/build:unit-test` (entorno jsdom), cobertura v8 por fichero (§16) |
| Tests e2e | **Playwright** (`e2e/`) contra `ng serve` con el fake backend (§17) |
| Mock backend local | MSW 3 (Mock Service Worker) en `src/fake-backend/` (§8) |
| i18n | `@ngx-translate/core` + `@ngx-translate/http-loader` (JSON único por idioma en `assets/i18n/`) |
| Notificaciones | `NotificationService` propio + `NotificationsComponent` (sin librerías de toasts, §7) |
| Calidad | Prettier · ESLint (typescript-eslint, angular-eslint, sonarjs) · Stylelint · dependency-cruiser · knip (§18) |
| Estilos | SCSS propio en `src/styles/` (variables, mixins, funciones y clases globales, ver §13) |

**Dependencias de runtime permitidas** (`dependencies` de `package.json`): los paquetes de Angular,
`rxjs`, `tslib`, `@ngx-translate/core`, `@ngx-translate/http-loader`, `date-fns` y `ngx-pipes`.
MSW es `devDependency` y solo lo usa el fake backend. Nada más sin justificación explícita.

> `ngx-pipes` no exporta pipes standalone: se importa su NgModule en `imports[]` del componente
> (ej. `NgStringPipesModule` en `shared/components/header/` para `ucfirst`).

Scripts de `package.json`: ver la tabla de comandos del [`README.md`](README.md) (§ Desarrollo).
Los importantes: `start`, `test`, `test:ci`, `e2e`, `lint*`, `typecheck`, `format` y **`check`**.

---

## 3. Estructura de carpetas

```
e2e/                               ← Tests e2e de Playwright (un spec por flujo de usuario, §17)
scripts/                           ← Scripts de tooling (rename-project.mjs, solo para arrancar el template)
src/
├── main.ts                        ← Arranca MSW (si procede) y luego la app
├── app/
│   ├── app.component.*            ← Shell: header, router-outlet, footer, notificaciones y loader global
│   ├── app.config.ts              ← Providers: router, HttpClient + interceptores, i18n
│   ├── app.routes.ts              ← Rutas raíz, lazy loading por dominio
│   ├── core/                      ← Infraestructura Angular (sin UI)
│   │   ├── api/                   ← Servicios HTTP + tipos, por familia de endpoint (ver §5)
│   │   ├── guards/                ← Guards funcionales (authGuard, guestGuard)
│   │   ├── i18n/                  ← provideI18n(): ngx-translate + locale
│   │   ├── interceptors/          ← Interceptores HTTP funcionales + HttpContext tokens (ver §7)
│   │   └── services/              ← Servicios de infraestructura (auth, loader, notificaciones, respuesta HTTP)
│   ├── pages/                     ← Dominios de negocio (vertical slices)
│   │   ├── login/                 ← Ejemplo: formulario reactivo con validación
│   │   └── main/                  ← Ejemplo: carga de datos de la API
│   └── shared/                    ← Reutilizables entre 2+ dominios
│       ├── components/            ← Componentes UI compartidos (header, footer, global-loader, notifications)
│       ├── constants/             ← Constantes (opciones de radio, dropdowns estáticos…)
│       ├── directives/
│       ├── enums/                 ← Enums transversales (AppPath, HttpCustomHeader…)
│       ├── models/                ← Tipos "moleculares"/átomos de dominio (ver §6)
│       ├── pipes/                 ← Pipes de presentación (isInvalidControl, errorMessage…)
│       ├── services/              ← Servicios transversales (FormService…)
│       ├── utils/                 ← Funciones puras (*.utils.ts)
│       └── validations/           ← Validators de formulario reutilizables
├── assets/
│   ├── i18n/                      ← JSON de traducciones (uno por idioma)
│   └── images/
├── environments/                  ← environment.ts (dev+MSW) + environment.tst.ts + environment.prod.ts
├── styles/                        ← Sistema de estilos global SCSS (ver §13)
└── fake-backend/                  ← Mocks MSW (espejo de core/api, ver §8) — SOLO desarrollo
    ├── enable-mocking.ts          ← Arranca el worker si `environment.useMSW` (llamado desde main.ts)
    ├── enable-mocking.noop.ts     ← Sustituto vacío para tst/producción (fileReplacements)
    ├── browser.ts                 ← setupWorker con los handlers de todas las familias
    ├── mockServiceWorker.js       ← Worker generado por MSW (no se edita)
    ├── utils/                     ← apiUrl, requireAuth, cabeceras y generador de documentos
    └── handlers/                  ← Una carpeta por familia de endpoint
```

### Estructura interna de un dominio (`pages/{domain}/`)

Cada dominio se organiza por **pantallas**, y cada pantalla por sub-componentes:

```
pages/{domain}/
├── {domain}.routes.ts             ← Rutas lazy del dominio
├── {screen}/                      ← Una carpeta por pantalla (list/, detail/, registration/…)
│   ├── {screen}.component.{ts,html,scss,spec.ts}
│   ├── components/                ← Sub-componentes propios de la pantalla
│   ├── enums/
│   └── services/                  ← Estado propio de la pantalla
├── components/                    ← Componentes compartidos entre pantallas DEL dominio
├── utils/                         ← Utils propios del dominio
└── services/                      ← Servicios propios del dominio
```

### Reglas de carpetas y dependencias

- **Sin prefijos redundantes**: `pages/{domain}/components/form/`, no `{domain}-form/` (la ruta ya lo dice).
- **Profundidad controlada** en `core/api`: máximo primer segmento de URL (ver §5).
- Cada componente = su propia carpeta con `.ts` + `.html` + `.scss` + `.spec.ts`.
- Los sub-componentes de un componente van en `components/` dentro de su carpeta (anidamiento recursivo).
- Cada pantalla/feature puede tener sus propios `enums/`, `services/`, `utils/` locales.
- **Dirección de dependencias** (la comprueba `npm run lint:arch`, §18):
  - `pages/` → `shared/` y `core/`. Nunca al revés: `core/` y `shared/` no importan de `pages/`.
  - Un dominio de `pages/` **no importa otro dominio**: lo común se promociona a `shared/`.
  - `shared/` puede usar servicios y APIs de `core/`, pero no `core/guards/` ni `core/interceptors/`.
  - `src/app/` nunca importa `src/fake-backend/` (solo `main.ts` lo carga vía `enable-mocking`).
  - Sin dependencias circulares ni ficheros huérfanos (sin importar).

### Alias de imports (tsconfig `paths`)

```json
"paths": {
  "@core/*":   ["./src/app/core/*"],
  "@shared/*": ["./src/app/shared/*"],
  "@pages/*":  ["./src/app/pages/*"]
}
```

### Orden de imports en cada fichero

1. Angular core
2. Terceros
3. Alias `@core/`, `@shared/`, `@pages/`
4. Relativos (`./example.types`)

---

## 4. Nomenclatura de ficheros

```
*.component.ts / .html / .scss / .spec.ts
*.service.ts
*.types.ts        ← tipos (NUNCA .model.ts ni .interface.ts)
*.enum.ts
*.pipe.ts
*.directive.ts
*.guard.ts
*.interceptor.ts
*.utils.ts
*.validators.ts
*.routes.ts
*.constants.ts
e2e/{flujo}.spec.ts
```

- Ficheros y carpetas en **kebab-case**.
- **Código, comentarios y nombres de fichero en inglés.** Los **términos de dominio** se mantienen
  en el idioma del negocio (ej. campos que vienen del backend en el idioma propio de cada proyecto).
- Las URL de rutas de la app pueden ir en idioma de negocio (`/listado`, `/registro`) porque son visibles al usuario.

---

## 5. Capa de API (`core/api/`)

La app consume **un único backend** (no hay nivel de microservicio): un folder por **familia de
endpoint** (primer segmento de la URL). Cada folder contiene el servicio, sus tipos y su spec:
`{familia}.service.ts`, `{familia}.types.ts` y `{familia}.service.spec.ts`.

```
core/api/
├── example/
│   ├── example.service.ts         ← Endpoints bajo /example
│   ├── example.service.spec.ts
│   └── example.types.ts
├── login/
│   ├── login.service.ts           ← POST /login
│   └── login.types.ts
└── refresh-token/
    ├── refresh-token.service.ts   ← POST /refreshToken
    └── refresh-token.types.ts
```

**Regla de profundidad**: solo el primer segmento de URL crea carpeta. Segmentos más profundos
(`/example/document`) van como **otro método en el mismo servicio**, nunca como carpeta nueva.

- `GET /example` → `core/api/example/`
- `GET /example/document` → mismo `example/`, método nuevo (`getExampleDocument`)
- `POST /login` → `core/api/login/`

### Servicio API — plantilla (ver `core/api/example/example.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  // Injections
  private http = inject(HttpClient);

  // Methods
  public getExample(): Promise<GetExampleResponse> {
    return firstValueFrom(this.http.get<GetExampleResponse>('/example'));
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
}
```

Reglas:

- **Siempre `firstValueFrom(this.http.METHOD<ResponseType>(...))`** — la capa API devuelve `Promise`, nunca `Observable`.
  Excepción única: `RefreshTokenService.refreshToken()` devuelve `Observable` porque se consume
  dentro del pipeline de reintento del `authInterceptor` (ver §7).
- **URLs relativas** que empiezan por `/` (`'/example'`): el `apiUrlInterceptor` antepone
  `environment.api` (ver §7) — los servicios **nunca** concatenan la base URL ni hardcodean `/api/...`.
  Hay un `environment.{env}.ts` por entorno (`environment.ts` dev+MSW, `tst`, `prod`) con `api` y `useMSW`.
- Si otra pieza necesita la URL (interceptor, mock), se exporta como constante (`LOGIN_URL`, `REFRESH_TOKEN_URL`).
- `@Injectable({ providedIn: 'root' })` siempre.
- **Nombres de método 100% en inglés** aunque la carpeta refleje un segmento de URL en otro idioma
  (la carpeta es un artefacto de URL; el método es código): `searchEntities()`, no un verbo traducido literalmente.
- **Los nombres de tipos calcan el nombre del método**: `updateExample` → `UpdateExampleRequest` / `UpdateExampleResponse`.
- Opciones por llamada (toast de éxito, loader) con **`requestContext(...)`** (ver más abajo), nunca con headers.
- Descargas de fichero: `responseType: 'blob'` y tipo de respuesta `Blob`.
- **Todo servicio API tiene su spec** con `HttpTestingController` (§16) y **su mock MSW espejo** (§8).

### Tipos API — plantilla (`{familia}.types.ts`)

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

// createExample
export type CreateExampleRequest = ExampleData;
export type CreateExampleResponse = {
  message: string;
  id: ExampleId;
};
```

- Dos bloques separados por comentario-banner: tipos de dominio arriba, Request/Response abajo.
- Los Request/Response suelen ser **alias o derivados** (`Omit`, `Pick`, `Partial`) de los tipos de dominio.
- Solo se exporta lo que se consume fuera del fichero (knip detecta exports sin usar, §18).

### Opciones por llamada: `HttpContext` (toasts de éxito y loader)

Las opciones de cada request viajan como **`HttpContext` tokens** (`core/interceptors/http-context.tokens.ts`),
que leen los interceptores y **nunca llegan al backend**. Se construyen con el helper `requestContext`:

```typescript
import {
  DEFAULT_SUCCESS_MESSAGE,
  requestContext,
} from '@core/interceptors/http-context.tokens';

// Toast de éxito con texto propio → httpRequest.success.exampleUpdated
this.http.put<UpdateExampleResponse>(`/example/${id}`, body, {
  context: requestContext({ successMessage: 'exampleUpdated' }),
});

// Toast de éxito genérico → httpRequest.success.default
this.http.post<CreateExampleResponse>('/example', body, {
  context: requestContext({ successMessage: DEFAULT_SUCCESS_MESSAGE }),
});

// Llamada silenciosa: sin loader global
this.http.get('/example/document', {
  responseType: 'blob',
  context: requestContext({ showLoader: false }),
});
```

| Token | Default | Efecto |
|---|---|---|
| `SHOW_LOADER` | `true` | Muestra el loader global mientras la request está en vuelo |
| `SUCCESS_MESSAGE` | `null` | Tag i18n del toast de éxito (`httpRequest.success.{tag}`); `null` = sin toast |

- El valor es un **tag**, no texto traducido: `HttpResponseHandlerService` lo resuelve contra
  `httpRequest.success.{tag}` (si no existe, cae en `httpRequest.success.default`).
- El backend puede devolver avisos con el header de **respuesta** `Back-Custom-Warning-Message`
  (`HttpCustomHeader.CUSTOM_WARNING_MESSAGE`); el tag se resuelve contra `httpRequest.warning.{tag}`
  y sustituye al toast de éxito.
- Los errores no se declaran: el interceptor los convierte en toast automáticamente (§7).
- Detalle y checklist: skill `@success-notifications`.

---

## 6. Modelos moleculares (`shared/models/`)

Los tipos se construyen de forma **molecular**: primero alias atómicos con significado de dominio,
luego se componen en tipos mayores.

```typescript
// shared/models/auth.types.ts — átomo
export type Token = string;

// core/api/login/login.types.ts — molécula
export type LoginResponse = {
  username: string;
  token: Token;
  refreshToken: Token;
};
```

Reglas:

- **Nunca escribir `string`/`number`/`Date` a pelo** en un tipo de API si existe (o puede existir)
  un alias semántico en `shared/models/`. Antes de crear un campo, buscar en `shared/models/` un tipo
  equivalente; si no existe y el concepto es transversal, crearlo ahí; si es puntual, definirlo inline.
- Los ficheros de `shared/models/` se agrupan por **área conceptual** (una entidad o concepto de
  dominio por fichero), no por pantalla.
- `type` **siempre**, `interface` **nunca** (para datos; lo exige ESLint). Las `interface` de
  Angular (`OnInit`, `PipeTransform`…) se implementan, no se declaran.
- `import type { ... }` para imports que son solo tipos (o `import { type X }` inline si se mezclan).
- Un `types.ts` puede **re-exportar** átomos que sus consumidores necesiten
  (`export type { Token };`) para que el consumidor importe de un solo sitio.

---

## 7. Capa HTTP transversal (interceptores) y notificaciones

Los interceptores son **funcionales** (`HttpInterceptorFn`), viven en `core/interceptors/` y se
registran en `app.config.ts`. Cada uno tiene **una sola responsabilidad** y su spec. Todos
ignoran lo que no es una request de API: `isApiRequest()` (`interceptor.utils.ts`) solo acepta URLs
relativas que empiezan por `/` (no `//` ni `/assets/`), así que los JSON de i18n y las URLs
absolutas pasan intactos.

```typescript
provideHttpClient(
  // Order matters: outer → inner. apiUrlInterceptor must stay last.
  withInterceptors([
    loaderInterceptor,
    notificationInterceptor,
    authInterceptor,
    apiUrlInterceptor,
  ]),
),
```

| Interceptor | Responsabilidad |
|---|---|
| `loaderInterceptor` | `LoaderService.show()/hide()` mientras la request está en vuelo, salvo `SHOW_LOADER = false` |
| `notificationInterceptor` | Toasts: warning si la respuesta trae `Back-Custom-Warning-Message`; si no, éxito si hay `SUCCESS_MESSAGE`; y error ante cualquier `HttpErrorResponse` |
| `authInterceptor` | Añade `Authorization: Bearer {token}` si hay sesión. Ante un `401` (que no sea de `/login` ni `/refreshToken`) refresca el token **una sola vez** aunque haya N requests concurrentes (single-flight en `AuthService.refreshToken()`) y reintenta; si el refresh falla, toast `httpRequest.error.sessionExpired` + `logout()` |
| `apiUrlInterceptor` | Antepone `environment.api` a la URL relativa. Siempre el último, para que los demás vean la URL relativa |

**Errores HTTP**: el backend devuelve un body `{ tag: 'algo' }` → toast con
`httpRequest.error.{tag}`; sin tag (o tag desconocido) → `httpRequest.error.default`. Toda la
traducción vive en `HttpResponseHandlerService` (`core/services/`). Los componentes **no**
capturan errores HTTP genéricos ni muestran toasts de respuestas HTTP.

**Notificaciones (toasts)**: `NotificationService` (`core/services/notification.service.ts`) es la
única fuente de toasts. Expone `success(msg)`, `warning(msg)`, `error(msg)`, `dismiss(id)` y el
signal de solo lectura `notifications`; descarta duplicados visibles (mismo tipo y texto) y cierra
cada toast a los 5 s (`NOTIFICATION_DURATION_MS`). Los pinta `NotificationsComponent`
(`shared/components/notifications/`, montado una sola vez en `AppComponent`, con `role="alert"`
para errores y `role="status"` para el resto). Para un toast que no proviene de HTTP (ej. tras una
validación local), se inyecta `NotificationService` y se le pasa **texto ya traducido**:

```typescript
this.notificationService.error(translateText(this.translate, 'form.globalError'));
```

**Loader global**: `LoaderService` cuenta requests activas (`isLoading` computed) y `AppComponent`
pinta `GlobalLoaderComponent` mientras haya alguna.

**Guards** (`core/guards/auth.guard.ts`), funcionales (`CanActivateFn`):
`authGuard` deja pasar solo con sesión (si no, `UrlTree` a `/login`) y `guestGuard` solo sin sesión
(si no, `UrlTree` a `/main`). La sesión vive en `AuthService` (`session` signal +
`isAuthenticated` computed, persistida en `localStorage`).

---

## 8. Fake backend (MSW) — `src/fake-backend/`

Todo endpoint real tiene su **mock espejo** para desarrollo local (activado con `environment.useMSW`).
La estructura replica `core/api/`:

```
fake-backend/
├── browser.ts                     ← setupWorker(...) con los handlers de todas las familias
├── enable-mocking.ts              ← Arranca el worker (onUnhandledFrame: 'bypass', quiet)
├── enable-mocking.noop.ts         ← Sustituto vacío en tst/producción
├── utils/                         ← apiUrl, requireAuth, getWarningHeaders, getDocumentHeaders, generatePDF
└── handlers/
    └── {familia}/                 ← Espejo de core/api/{familia}
        ├── handlers.ts            ← Handlers http.get/post/put/delete de MSW
        ├── mocks.ts               ← Datos mock estáticos, tipados con los Response de core/api
        └── index.ts               ← export * from './handlers'; export * from './mocks';
```

Las URLs de los handlers se construyen con **`apiUrl('/familia')`** (antepone `environment.api`,
`/api` en desarrollo), porque MSW intercepta la request **después** de que el `apiUrlInterceptor`
haya antepuesto la base. Si el servicio exporta su URL (`LOGIN_URL`), el handler la reutiliza.

```typescript
// fake-backend/handlers/example/handlers.ts
export const exampleHandlers = [
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

Reglas:

- **mocks.ts**: objetos planos con datos realistas, **tipados con los tipos Response de
  `core/api/{familia}/{familia}.types.ts`** (si el contrato cambia, el mock deja de compilar). Sin lógica.
  Solo los campos que la UI necesita.
- **handlers.ts**: lo más simples posible — interceptar y devolver el mock. `await sleep()` para
  simular asincronía. En updates, devolver `{ ...mock, ...body }` si la UI debe reflejar lo enviado.
  En deletes, `204` sin body.
- **Endpoints protegidos**: empezar el handler con `requireAuth(request)` (401 si no hay un bearer
  token válido de los mocks de login/refresh), para que el flujo de refresh se pueda ejercitar.
- **Avisos del backend** y descargas: `getWarningHeaders(tag)`, `getDocumentHeaders(filename, mime)`,
  `generatePDF()` (`fake-backend/utils/`).
- **Orden de registro**: rutas más específicas primero, las base con `/:id` al final
  (MSW machea de arriba a abajo).
- `browser.ts` combina los handlers de todas las familias en un `setupWorker`: **cada familia nueva se registra ahí**.
- **MSW es solo de desarrollo y nunca llega a tst/producción**: en esas configuraciones
  `angular.json` sustituye `enable-mocking.ts` por `enable-mocking.noop.ts` (el código de MSW no
  entra en el bundle) y `mockServiceWorker.js` solo se copia como asset en `development`.
  `main.ts` llama a `enableMocking()` antes de `bootstrapApplication` y nada de `src/app/` importa
  `fake-backend/` (lo impide dependency-cruiser).
- El fake backend es también el backend de los **tests e2e** (§17): sus datos deben permitir
  recorrer los flujos felices de la app.
- Login de demo: el handler de `/login` acepta cualquier credencial y devuelve el usuario `demo`
  (el e2e usa `demo` / `demo`).

**Flujo al crear un endpoint nuevo** (siempre completo):
types → service (+ spec) → mocks → handlers → `index.ts` → registro en `browser.ts`.
Detalle: skill `@api-endpoint`.

---

## 9. Anatomía de un componente

### Decorador

```typescript
@Component({
  selector: 'app-example',
  imports: [/* solo lo que usa el template */],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss',          // singular, nunca styleUrls
  changeDetection: ChangeDetectionStrategy.OnPush, // SIEMPRE
})
export default class ExampleComponent implements OnInit { ... }
```

- Sin `standalone: true` (es el default).
- Los componentes de página se exportan `default` (facilita el `loadComponent` lazy).
- **Nunca importar en `imports[]` un pipe/componente que el template no use.**
- Selector con prefijo `app-` en kebab-case (directivas: `app` + camelCase).

### Orden de secciones — ESTRICTO, con comentarios separadores

```typescript
export class ExampleComponent implements OnInit {
  // Injections
  private fb = inject(FormBuilder);              // inject() SIEMPRE, nunca constructor
  public entityService = inject(EntityService);  // public solo si el template lo usa

  // ViewChilds
  private sectionRef = viewChild<SectionComponent>('sectionRef');

  // Models
  public value = model<string>('');

  // Inputs
  public data = input.required<EntityData>();
  public isReadonly = input<boolean>(false);

  // Outputs
  public save = output<EntityData>();
  public cancel = output<void>();

  // Data
  public form = this.fb.nonNullable.group({ name: ['', Validators.required] });
  public items = signal<Item[]>([]);
  public isLoaded = signal<boolean>(false);

  // Computeds
  public hasItems = computed(() => this.items().length > 0);

  // Effects
  private resetFormOnDataChange = effect(() => { ... }); // siempre private; nombre descriptivo, sin sufijo "effect"

  // Methods
  public ngOnInit(): void {                      // lifecycle primero (nunca async)
    void this.loadData();
  }
  private async loadData(): Promise<void> { ... } // privados primero…
  public async handleSave(): Promise<void> { ... } // …luego públicos
}
```

Reglas transversales:

- **Visibilidad explícita** en todos los miembros: `private` por defecto; `public` solo cuando el
  template (u otro componente vía viewChild) lo necesita.
- **Signals para todo estado reactivo.** La app es zoneless: un campo plano que cambia **no**
  repinta la vista. Nunca mutar el contenido de un signal (`items().push(x)` ❌) — siempre
  `set`/`update` con referencia nueva.
- **`computed` para todo valor derivado** — nunca calcular en el template ni cachear a mano.
- Sin `EventEmitter`/`@Input`/`@Output`/`@ViewChild` (APIs antiguas; las prohíbe ESLint).
- Hooks de ciclo de vida **no `async`**: disparar la carga con `void this.loadData()`.
- **Early returns**, cero `if/else` anidados. Llaves siempre en `if`/`for`/`while`.
- Funciones pequeñas: complejidad ciclomática y cognitiva ≤ 10, profundidad ≤ 3, ≤ 4 parámetros,
  ≤ 60 líneas por función y ≤ 300 por fichero. Si se supera, se extrae (lo exige ESLint, §18).
- No poner `await` en la última llamada de una función `void` (dispararla con `void` y salir).
- Sin non-null assertions (`!`) en código de aplicación: tipar bien o comprobar.
- Booleans con prefijo `is/has/should/can`; arrays en plural; funciones verbo+sustantivo
  (`loadData`, `handleSave`, `confirmDelete`, `navToDetail`, `navBack`).
- Los handlers de UI se llaman `handle{Acción}`; la navegación `navTo{Destino}` / `navBack`.
- Constantes verdaderas en `ALL_CAPS`; enums en `PascalCase`; nada de magic strings/numbers → enum o constante.
- **Comentarios**: explican el *porqué*, no el qué. En inglés. Se usan para separar bloques lógicos.

### Datos asíncronos en componentes

- Llamadas múltiples independientes → **`Promise.all`** (fail-fast; el caso normal).
  Solo `Promise.allSettled` cuando cada bloque puede fallar por separado y quiere mostrarse parcial.
- Nunca llamadas secuenciales encadenadas si pueden ir en paralelo.
- Patrón carga: signal de datos + signal `isLoaded` separado. En el template se condiciona con
  `@if (isLoaded())`, **nunca** con `@if (data())` (si el backend devuelve `null` legítimo, la
  pantalla no renderizaría jamás).

---

## 10. Formularios

- Reactive forms tipados (`FormBuilder.nonNullable.group(...)`) declarados en la sección `// Data`
  o en un método privado `buildForm()`; en modo edición, `patchValue(...)` en `ngOnInit`.
- Un formulario que se usa en 2+ pantallas (alta + modificación) es **un solo componente**
  parametrizado con `data = input<FormData | null>(null)` + outputs `save`/`cancel`. No llama a la
  API: emite, y la pantalla padre decide POST o PUT.
- Estado de error en template con los pipes compartidos:
  `[class.is-invalid]="form | isInvalidControl: 'field'"`,
  `[attr.aria-invalid]="form | isInvalidControl: 'field'"` y
  `{{ form.controls.field | errorMessage }}` (resuelve los `translationTag` de los validators vía i18n).
- **Flujo de guardado canónico** (ver `pages/login/login.component.ts`):
  1. `markAllControlsAsTouched(form)` (`shared/utils/form.utils.ts`)
  2. Si inválido → `formService.focusFirstInvalidControl(host.nativeElement)` (foco en el primer
     control inválido + toast `form.globalError`) → return
  3. Emitir `save` / llamar a la API

---

## 11. Routing

- `app.routes.ts` define un path por dominio con `loadChildren` lazy hacia el `{domain}.routes.ts`
  del dominio; cada pantalla se carga con `loadComponent` lazy (`() => import('./pages/x/x.component')`,
  gracias al `export default`). Un dominio de **una sola pantalla** (como `login` o `main`) puede
  cargarse directamente con `loadComponent` desde `app.routes.ts`.
- Paths de primer nivel en el enum `AppPath` (`shared/enums/app-path.enum.ts`); se navega con
  `router.navigate(['/', AppPath.MAIN])`, nunca con strings sueltos.
- Rutas privadas con `canActivate: [authGuard]`; las de invitado (login) con `canActivate: [guestGuard]`.
  La ruta comodín `**` redirige siempre a una ruta existente.
- Rutas hijas para variantes de una entidad: `:id` → detalle, `:id/accion-x` → pantallas de acción.
- Estado efímero entre pantallas → `history.state`, no query params.
- Las rutas tienen spec propio con `RouterTestingHarness` (ver `app.routes.spec.ts`, §16).

---

## 12. i18n

- **Cero texto visible hardcodeado** — todo por `| translate` (template) o `translateText()` (TS).
- `provideI18n()` (`core/i18n/i18n.providers.ts`) registra ngx-translate con el loader HTTP
  (`./assets/i18n/{lang}.json`), el locale `es-ES` (pipes de fecha/número/moneda) y **bloquea el
  primer render hasta que las traducciones están cargadas**, así que traducir en TS es seguro desde
  el primer momento.
- Un único JSON por idioma en `assets/i18n/` (hoy `es.json`).
- **Convención de claves**: `{domain}.{component}.{grupo}.{clave}` en camelCase. Si el dominio tiene
  una sola pantalla, `{domain}.{clave}` (`login.title`); los componentes de `shared/` usan su nombre
  como raíz (`globalLoader.loading`, `notifications.regionLabel`).
  Grupos raíz transversales: `common` (acciones comunes), `app` (nombre de la app), `httpRequest`
  (tags de toasts HTTP: `error`, `warning`, `success`), `form` (errores de validación).
  Grupos semánticos estándar: `tabs`, `columns`, `buttons`, `modal`, `notifications`, `steps`,
  `menu`, `header`, `filters`, `searcher`. Textos únicos sin grupo: `title`, `noResults`.
- **`common.*`** para acciones comunes (`cancel`, `accept`, `close`, `logout`…) — nunca duplicar
  "Cancelar" por dominio.
- En template: binding `[placeholder]="'clave' | translate"`, no interpolación `placeholder="{{...}}"`
  (además ESLint prohíbe la interpolación en atributos).
- **En TS: `translateText(this.translate, key, params?)`** (`@shared/utils/i18n.utils`). Es un
  wrapper tipado de `TranslateService.instant()`, que devuelve `any` (prohibido por el lint estricto);
  `translateText` devuelve siempre `string` (la clave si falta la traducción). Arrays de configuración
  (tabs, columnas) se inicializan en el cuerpo de la clase con `translateText(...)` (funciona porque
  `inject()` resuelve antes que los inicializadores). Si la config de tabla necesita un `TemplateRef`
  de `viewChild`, entonces es `computed()`.
- `TranslatePipe` en `imports[]` solo si el template lo usa; `TranslateService` inyectado solo si se traduce en TS.
- Detalle: skill `@i18n`.

---

## 13. Estilos (SCSS)

No hay librería de estilos externa: el sistema de estilos es propio y vive en `src/styles/`.
**Guía completa (estructura, variables, `ui/`, `utils/`, cómo estila un componente):**
[`src/styles/README.md`](src/styles/README.md).

Reglas que no se incumplen:

- Estilos **encapsulados por componente** por defecto (`Emulated`, scopa con `:host`); solo sube a
  `src/styles/` lo transversal con un 2º consumidor real. No se usa `ViewEncapsulation.None`.
- Todo SCSS de componente empieza con `@use 'imports' as *;` (la fachada que expone variables y utils;
  funciona por `includePaths: ["src/styles"]` en `angular.json`).
- **Variables y mixins siempre**, nunca valores hardcodeados ni estilos inline:
  `$spacing-md`, `$color-primary-500`, `rem(24)`, `@include breakpoint('tablet')`…
  La única fuente de verdad del diseño es `base/_variables.scss`.
- Las **clases globales de UI** (`grid-template` + `col-*`, `field-group`, `buttons-group`,
  `clamped-text`) se **usan pero jamás se redefinen** en los SCSS de componentes.
- **Stylelint** (`npm run lint:styles`, `stylelint-config-standard-scss` + prettier) valida todo
  `.scss`: anidamiento ≤ 3, ≤ 4 selectores compuestos, sin `!important`, sin selectores de id, sin
  colores por nombre. `npm run format` formatea y aplica fixes.
- Presupuesto por componente: 3 kB aviso / 6 kB error de estilos (build de producción, §18).

---

## 14. IDs de elementos HTML — OBLIGATORIO

Todo elemento **interactuable** lleva `id` con el patrón:

```
{domain}-{component}-{type}-{element}
```

- `domain` = carpeta bajo `pages/`; `component` = carpeta del componente; `type` = tipo de control
  (`input`, `dropdown`, `datepicker`, `radio`, `checkbox`, `btn`, `accordion`, `tabs`, `table`,
  `searcher`, `textarea`, `stepper`…); `element` = nombre en inglés del campo/acción.
- kebab-case, todo en inglés. Sin `id` en elementos de solo lectura (`<p>`, `<h1>`, contenedores de info),
  salvo los mensajes de error de un campo (`login-error-username`), que se enlazan con `aria-describedby`.
- Formas cortas: pantalla única de un dominio → `{domain}-{type}-{element}` (`login-input-username`);
  componente de `shared/` → `{component}-{type}-{element}` (`header-btn-logout`).
- Estos `id` son los **selectores estables de los tests** (unitarios y e2e): no se cambian a la ligera.

```html
<input  id="{domain}-{component}-input-fieldName" ... />
<button id="{domain}-form-btn-save" type="button" ...></button>
<table  id="{domain}-list-table-results" ...></table>
```

Las claves i18n espejan este mismo patrón (§12). Los `<label for>` apuntan a estos `id`.

---

## 15. Pipes, utils y validators compartidos

- **Pipes** (en `shared/pipes/`): `isInvalidControl` (estado inválido de un control) y
  `errorMessage` (traduce el primer error de uno o varios controles). Las transformaciones de
  presentación van en pipes — **prohibido crear métodos `xxxText()` en componentes**.
- **Utils puros** (en `shared/utils/` o `{domain}/utils/`): un fichero por tema
  (`dates.utils.ts`, `form.utils.ts`, `objects.utils.ts`, `delay.utils.ts`, `i18n.utils.ts`).
  Funciones exportadas puras y testeables. Cualquier lógica repetida dos veces se extrae aquí.
- **Validators** reutilizables en `shared/validations/` (`common.validators.ts`, `date.validators.ts`):
  `numericValidator`, `exactLengthValidator(n)`, `dateNotAfterTodayValidator`… Devuelven
  `{ translationTag, interpolationParams? }` para que `errorMessage` los traduzca.
- **Servicios compartidos** en `shared/services/`: `FormService` (`focusFirstInvalidControl`).
- **Constantes de opciones estáticas** (radios sí/no, etc.) en `shared/constants/`.

---

## 16. Tests unitarios (Vitest)

- Se ejecutan con el builder oficial de Angular (`ng test`, runner **Vitest**, entorno **jsdom**):
  `npm test` (watch) y `npm run test:ci` (una pasada + cobertura). `describe`, `it`, `expect` y `vi`
  son globales (`vitest/globals` en `tsconfig.spec.json`): no se importan.
- Specs `.spec.ts` **junto al fichero que prueban**. **Todo fichero con lógica nace con su spec**
  (componentes, servicios, guards, interceptores, pipes, utils, validators, rutas).
- **Cobertura exigida por fichero** (`coverageThresholds` en `angular.json`, `perFile: true`):
  **statements 90 · branches 85 · functions 90 · lines 90**. Basta un fichero por debajo para que
  `test:ci` falle. Se mide sobre `src/app/**/*.ts`, excluyendo `*.spec.ts`, `*.types.ts`,
  `*.enum.ts`, `app.config.ts` y `app.routes.ts` (las rutas se prueban igualmente con
  `app.routes.spec.ts`). Informe HTML en `coverage/`.
- Prohibido commitear `.only`, `.skip` o `.todo` (ESLint).

**Patrones canónicos** (con su spec de referencia en el repo):

| Qué | Cómo | Referencia |
|---|---|---|
| Servicio con estado | `TestBed.inject(Service)` + mocks de dependencias por `useValue` | `core/services/auth.service.spec.ts` |
| Timers | `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)`; `vi.useRealTimers()` en `afterEach` (no hay `fakeAsync`: no hay zone.js) | `core/services/notification.service.spec.ts` |
| Servicio API | `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` (`expectOne`, `flush`, `verify()`), comprobando método, URL, body y `request.context` | `core/api/example/example.service.spec.ts` |
| Interceptor | `provideHttpClient(withInterceptors([x]))` + `HttpTestingController` | `core/interceptors/*.spec.ts` |
| Componente | `TestBed.createComponent(C)` + `await fixture.whenStable()` (zoneless: no hace falta `detectChanges()`), interacción por `id` | `pages/login/login.component.spec.ts` |
| Signal inputs | `fixture.componentRef.setInput('data', mock)` + `await fixture.whenStable()` | — |
| Guard funcional | `TestBed.runInInjectionContext(() => guard(route, state))` | `core/guards/auth.guard.spec.ts` |
| Rutas | `provideRouter(routes)` + `RouterTestingHarness.create()` + `navigateByUrl` | `app.routes.spec.ts` |
| Traducciones | `provideTranslateService()` sin loader: el pipe devuelve **la clave**, y se aserta la clave (`'form.requiredError'`) | `pages/main/main.component.spec.ts` |

- **Mocks**: objetos planos con `vi.fn()` (`{ getExample: vi.fn() }`) provistos con
  `{ provide: X, useValue: mock }`, respuestas con `mockResolvedValue` / `mockRejectedValue` /
  `mockReturnValue`, y `vi.resetAllMocks()` en el `beforeEach`. Espiar un servicio real o un global:
  `vi.spyOn(router, 'navigate').mockResolvedValue(true)` (restaurar con `vi.restoreAllMocks()` si
  persiste entre tests). Servicios que exponen signals → `signal()` real en el mock.
- Organización: un `describe` por unidad, `describe` anidados por método o comportamiento cuando
  hay varios; `it.each` para tablas de casos. Nombres en presente describiendo el comportamiento
  (`'redirects anonymous users to the login page'`). Patrón **AAA** (Arrange, Act, Assert).
- Se prueba **comportamiento**, no implementación: DOM renderizado, llamadas a dependencias y
  estado público. Sin tests vacíos tipo `should create` que no aportan nada.
- Utils: tests directos de función pura, incluyendo casos límite (`null`/`undefined`, vacíos).
- Detalle: skill `@testing`.

---

## 17. Tests e2e (Playwright)

- Viven en `e2e/` (`e2e/{flujo}.spec.ts`), configurados en `playwright.config.ts`: Chromium,
  `baseURL` `http://localhost:4200`, y un `webServer` que levanta `ng serve` (configuración de
  desarrollo, **con el fake backend MSW**). En local reutiliza un servidor ya arrancado en el
  puerto 4200; en CI arranca uno limpio, reintenta 2 veces y prohíbe `test.only`.
- Comandos: `npm run e2e:install` (una vez por máquina: instala Chromium) y `npm run e2e`.
- **Todo flujo de usuario nuevo o modificado tiene su spec e2e** con su camino feliz (y las
  validaciones principales). Referencia: `e2e/auth.spec.ts` (redirección sin sesión, errores de
  validación, login → datos de la API → logout).
- Selectores: los `id` de §14 (`page.locator('#login-btn-submit')`) o roles/textos visibles; nunca
  clases CSS ni estructura del DOM. Los datos esperados salen de los mocks de `fake-backend/`.
- Aserciones con auto-espera de Playwright (`await expect(page).toHaveURL(...)`,
  `toBeVisible()`); nunca `waitForTimeout`.
- El e2e está tipado (`e2e/tsconfig.json`, incluido en `npm run typecheck`) y pasa por ESLint.
  En fallo deja trazas y capturas en `test-results/` y `playwright-report/`.

---

## 18. Quality gates y Git

Todo lo de esta guía que se puede comprobar, se comprueba. **`npm run check`** ejecuta lo mismo que
CI, en este orden, y se detiene en el primer fallo:

| Fase | Script | Qué valida |
|---|---|---|
| Formato | `format:check` | Prettier en todo el repo |
| Lint | `lint` | ESLint con `--max-warnings=0` (ver abajo) |
| Estilos | `lint:styles` | Stylelint en `src/**/*.scss` con `--max-warnings=0` |
| Arquitectura | `lint:arch` | dependency-cruiser (`.dependency-cruiser.cjs`): sin ciclos, sin huérfanos, `core`/`shared` no importan `pages`, `shared` no importa guards/interceptores, dominios aislados entre sí, la app no importa `fake-backend`, nada importa specs, el código de app no usa `devDependencies`, sin imports irresolubles |
| Código muerto | `lint:unused` | knip (`knip.json`): ficheros, exports y dependencias sin usar |
| Tipos | `typecheck` | `tsc --noEmit` sobre los proyectos de app, specs y e2e |
| Tests | `test:ci` | Vitest + umbrales de cobertura por fichero (§16) |
| Build | `build` | Build de producción con presupuestos: inicial 350 kB aviso / 500 kB error; cualquier script 250 kB / 350 kB; estilos de componente 3 kB / 6 kB |
| E2E | `e2e` | Playwright (§17) |

`npm run check:static` agrupa las seis primeras fases (rápidas, sin tests ni build).

**ESLint** (`eslint.config.mjs`, todo es error):

- TypeScript: `strictTypeChecked` + `stylisticTypeChecked` de typescript-eslint (sin `any` ni
  operaciones `unsafe`, sin promesas flotantes — `void` explícito si se dispara y se sale —, sin `!`,
  `??` en vez de `||` para nulos, `switch` exhaustivos…), `type` en vez de `interface`, `import type`,
  visibilidad explícita en todos los miembros, tipos de retorno explícitos en exports, naming
  (booleans `is/has/should/can`, tipos en PascalCase, miembros de enum en UPPER_CASE o PascalCase).
- Base: `curly`, `eqeqeq` (permite `== null`), `no-console` (solo `warn`/`error`),
  `no-else-return`, `no-nested-ternary`, `no-param-reassign`, `object-shorthand`, `prefer-template`.
- Métricas: `complexity` ≤ 10, `sonarjs/cognitive-complexity` ≤ 10, `max-depth` ≤ 3,
  `max-params` ≤ 4, `max-nested-callbacks` ≤ 4, `max-lines` ≤ 300 por fichero,
  `max-lines-per-function` ≤ 60 (las dos últimas no aplican a specs). Más las reglas recomendadas
  de `eslint-plugin-sonarjs`.
- Angular moderno: `OnPush`, signals (`prefer-signals`, `output()`), sin lifecycle `async`,
  lifecycle ordenado, `providedIn` en servicios, sin `ViewEncapsulation.None`, selectores `app-*`.
  Para conservar el landmark semántico (`<header>`, `<footer>`) se envuelve: `<header><app-header /></header>`.
- Arquitectura: `subscribe()` prohibido fuera de `core/interceptors/`; `core/` y `shared/` no
  importan `@pages/*`.
- Templates (`.html`): reglas recomendadas + **accesibilidad** de angular-eslint (`alt-text`,
  `label-has-associated-control`, `click-events-have-key-events`, `interactive-supports-focus`,
  `valid-aria`, `role-has-required-aria`…), `button-has-type`, control flow `@if`/`@for`,
  etiquetas autocerradas, `NgOptimizedImage`, sin estilos inline, sin `$any`, sin interpolación en
  atributos, sin `tabindex` positivo, `===`, complejidad condicional ≤ 4 y ciclomática ≤ 10.
  Es un chequeo estático: no valida contraste ni el DOM renderizado.
- Specs y e2e: sin `.only/.skip/.todo`; relajan solo lo que la ergonomía de test exige
  (visibilidad, naming, `!`, longitud de fichero/función, strings duplicados).

**TypeScript estricto** (`tsconfig.json`): `strict`, `noImplicitOverride`,
`noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
`noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `isolatedModules`. Angular:
`strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`, `strictStandalone`,
`typeCheckHostBindings` y diagnósticos extendidos como `error`.

**Git**:

- **Conventional commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`… con scope opcional).
- Hooks de husky (`npm install` los activa vía el script `prepare`):
  - `pre-commit` → `lint-staged`: Prettier + `eslint --fix` sobre `.ts`/`.html`, Prettier sobre
    `.js/.mjs/.cjs/.json/.md/.yml` y Prettier + Stylelint sobre `.scss`, solo en ficheros staged.
  - `commit-msg` → rechaza mensajes que no sigan conventional commits.
  - `pre-push` → `npm run check:static && npm run test:ci`.
- **CI** (`.github/workflows/ci.yml`), en cada push a `main` y en cada PR, con Node de `.nvmrc`:
  jobs `static` (las fases estáticas + `npm run audit:prod`), `test` (sube la cobertura como
  artefacto), `build` y `e2e` (sube `playwright-report` si falla). Un PR solo es mergeable con
  todo en verde. Los hooks se pueden saltar con `--no-verify`; CI no.

**Regla para agentes (y humanos)**: está **prohibido** relajar un gate para que pase: desactivar o
rebajar reglas, añadir `eslint-disable`/`@ts-ignore`/`@ts-expect-error`, bajar umbrales de
cobertura, subir presupuestos, excluir ficheros, marcar tests como `.skip` o borrar tests que fallan.
Se arregla el código. Si una regla bloquea de verdad un patrón legítimo, se **para y se explica al
humano** qué regla, dónde y por qué, antes de tocar ninguna configuración.

---

## 19. Definition of Done

Una tarea (feature, fix, refactor) **no está terminada** hasta que se cumple todo:

1. El código sigue esta guía (estructura, anatomía de componente, capa API, i18n, ids, estilos).
2. Cada fichero nuevo o modificado con lógica tiene su spec y cumple los umbrales de cobertura por fichero.
3. Cada flujo de usuario nuevo o modificado tiene su spec e2e en `e2e/`.
4. Cada endpoint nuevo tiene su mock MSW registrado en `browser.ts`.
5. Textos en `es.json`, TODOs registrados en `TODOS.md` y documentación actualizada si cambia una convención.
6. **`npm run check` termina en verde de principio a fin** (exit code 0), sin haber relajado
   ningún gate (§18). Si el build muestra avisos de presupuesto nuevos, se resuelven.

Si `npm run check` falla, la tarea sigue abierta: se lee el error, se corrige el código y se vuelve
a ejecutar hasta que pase entero.

---

## 20. Checklist rápido (para revisar cualquier PR / generación)

- [ ] Fichero en la carpeta correcta y al nivel más bajo posible; sin prefijos redundantes; sin imports entre dominios
- [ ] Orden de secciones del componente + visibilidad explícita (`private` por defecto)
- [ ] `inject()`, signals, `input()`/`output()`/`viewChild()`; nada de APIs legacy; estado de vista en signals (zoneless)
- [ ] `OnPush` + `styleUrl` singular
- [ ] `type` (no `interface`); átomos de `shared/models/`; `{Method}Request/Response`
- [ ] API: `firstValueFrom` + URL relativa; opciones con `requestContext`; métodos en inglés; spec con `HttpTestingController`; mock MSW espejo registrado
- [ ] Early returns; llaves siempre; sin `subscribe()`; sin mutar signals; funciones pequeñas
- [ ] Utils/pipes extraídos si la lógica se repite o es transformación de presentación
- [ ] SCSS con `@use 'imports' as *` + `:host`; variables/mixins de `src/styles/`; sin redefinir clases globales
- [ ] `id="{domain}-{component}-{type}-{element}"` en todo elemento interactuable
- [ ] Todo texto visible con `| translate` / `translateText()`; claves con la convención
- [ ] Accesibilidad: `type` en `<button>`, `alt` en imágenes, `<label>` asociado, interactivos con teclado
- [ ] Toast de éxito (`requestContext({ successMessage })`) en escrituras que lo requieran
- [ ] Specs unitarios (cobertura por fichero) y e2e del flujo
- [ ] TODOs registrados en `TODOS.md`; commit con conventional commits
- [ ] **`npm run check` en verde**, sin gates relajados
