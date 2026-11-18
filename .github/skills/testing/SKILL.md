---
name: testing
description: >
  Use when writing or updating tests in this Angular project — unit specs for components, services,
  guards, interceptors, pipes, validators or utils with Vitest (ng test, @angular/build:unit-test,
  jsdom), and end-to-end specs with Playwright under e2e/. Also use when the user asks in Spanish to
  crear tests, añadir tests, testear un componente, testear un servicio, cobertura, specs, test e2e,
  test end to end, Playwright, or any task involving testing. Covers TestBed setup for standalone
  zoneless components (await fixture.whenStable), vi.fn / vi.spyOn / mockResolvedValue / fake timers,
  provideTranslateService, provideHttpClientTesting + HttpTestingController, RouterTestingHarness,
  TestBed.runInInjectionContext for functional guards, setInput for signal inputs, per-file coverage
  thresholds (90/85/90/90) and the npm run check Definition of Done.
user-invocable: true
---

# Skill: Testing (Vitest + Playwright)

## 1. Cuándo usar esta skill

Siempre que se cree o modifique un fichero con lógica (nace con su `*.spec.ts` al lado) o un flujo
de usuario (necesita su spec en `e2e/`). La tarea no termina hasta que `npm run check` pasa en verde.

| Comando | Qué hace |
|---|---|
| `npm test` | Vitest en modo watch |
| `npm run test:ci` | Una pasada + cobertura; falla si **algún fichero** baja del umbral |
| `npm run e2e:install` | Una vez por máquina: Chromium para Playwright |
| `npm run e2e` | Playwright contra `ng serve` + MSW (reutiliza un `npm start` ya levantado) |

## 2. Entorno y umbrales

- Builder `@angular/build:unit-test` con runner **Vitest** y entorno **jsdom** (`angular.json`).
- `describe`, `it`, `expect`, `vi`, `beforeEach`… son **globales** (`tsconfig.spec.json` → `vitest/globals`): no se importan.
- App **zoneless**: no hay `fakeAsync`, `tick`, `waitForAsync` ni `detectChanges()` manual.
  Tras cualquier cambio de estado: `await fixture.whenStable()`.
- Cobertura **por fichero** (`perFile: true`): statements **90**, branches **85**, functions **90**,
  lines **90**. Excluidos: `*.spec.ts`, `*.types.ts`, `*.enum.ts`, `app.config.ts`, `app.routes.ts`.
- ESLint también revisa los specs (sin `.only` / `.skip` / `.todo`; `!` y longitud de funciones sí
  están permitidos en tests). Nunca bajar umbrales ni excluir ficheros para que pase.

## 3. Organización

- Un `describe` por unidad (`describe('LoginComponent', …)`), `describe` anidados por método o
  escenario, nombres de `it` en inglés describiendo el comportamiento (`'redirects anonymous users…'`).
- Patrón **AAA** (Arrange / Act / Assert) separado por líneas en blanco.
- Testear comportamiento observable (DOM, llamadas a dependencias, valores de signals), no detalles
  internos. Seleccionar el DOM por `id` (`#login-btn-submit`).
- Tablas de casos con `it.each([...])('… $campo …', …)`.
- Mocks como **objetos planos** con `vi.fn()` inyectados con `useValue`; `vi.resetAllMocks()` en
  `beforeEach` cuando el mock se define a nivel de `describe`.

## 4. Patrones canónicos

### Componente standalone (ver `pages/login/login.component.spec.ts`)

```typescript
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/services/auth.service';
import { FormService } from '@shared/services/form.service';
import LoginComponent from './login.component';

describe('LoginComponent', () => {
  const authService = { login: vi.fn() };
  let fixture: ComponentFixture<LoginComponent>;
  let host: HTMLElement;
  let formService: FormService;

  beforeEach(async () => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(), // no loader → `translate` returns the keys as-is
        { provide: AuthService, useValue: authService },
      ],
    });
    formService = TestBed.inject(FormService);
    vi.spyOn(formService, 'focusFirstInvalidControl');
    fixture = TestBed.createComponent(LoginComponent);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('shows the validation errors and focuses the form when empty', async () => {
    host.querySelector<HTMLButtonElement>('#login-btn-submit')?.click();
    await fixture.whenStable();

    expect(authService.login).not.toHaveBeenCalled();
    expect(formService.focusFirstInvalidControl).toHaveBeenCalledWith(host);
    expect(host.querySelector('#login-error-username')?.textContent).toContain('form.requiredError');
  });
});
```

- Los componentes standalone no se declaran: `TestBed.createComponent` basta.
- `provideTranslateService()` sin loader → el pipe `translate` y `translateText()` devuelven la
  **clave**: se aserta `'form.requiredError'`, no el texto en español.
- Dependencias con signals: mockear con un `signal()` real y cambiarlo con `.set()`
  (ver `shared/components/header/header.component.spec.ts`).
- Inputs de signal: `fixture.componentRef.setInput('nombre', valor); await fixture.whenStable();`.
- Outputs: `const spy = vi.fn(); fixture.componentInstance.saved.subscribe(spy);` (en specs, sí).

### Servicio con dependencias (ver `core/services/auth.service.spec.ts`)

```typescript
const loginService = { login: vi.fn() };
let router: Router;

function setup(): AuthService {
  TestBed.configureTestingModule({
    providers: [{ provide: LoginService, useValue: loginService }],
  });
  router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  return TestBed.inject(AuthService);
}

it('logs in and navigates to the main page', async () => {
  loginService.login.mockResolvedValue(SESSION);
  const service = setup();

  await service.login({ username: 'demo', password: 'demo' });

  expect(service.isAuthenticated()).toBe(true);
  expect(router.navigate).toHaveBeenCalledWith(['/', AppPath.MAIN]);
});
```

`mockResolvedValue` / `mockRejectedValue` para Promises, `mockReturnValue(of(...))` /
`throwError(() => …)` para Observables.

### Servicio de API (ver `core/api/example/example.service.spec.ts`)

```typescript
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

it('updateExample → PUT /example/:id with a custom success toast', async () => {
  const response = service.updateExample(7, { example: 'edited' });

  const call = httpTesting.expectOne({ method: 'PUT', url: '/example/7' });
  expect(call.request.body).toEqual({ example: 'edited' });
  expect(call.request.context.get(SUCCESS_MESSAGE)).toBe('exampleUpdated');
  call.flush({ message: 'updated', id: 7 });

  await expect(response).resolves.toEqual({ message: 'updated', id: 7 });
});
```

Se aserta método, URL **relativa**, body y los tokens de `HttpContext` (`SUCCESS_MESSAGE`,
`SHOW_LOADER`) de cada método.

### Guard funcional (ver `core/guards/auth.guard.spec.ts`)

```typescript
function run(guard: CanActivateFn): ReturnType<CanActivateFn> {
  return TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}
```

### Rutas (ver `app.routes.spec.ts`)

```typescript
const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/main');
expect(TestBed.inject(Router).url).toBe('/login');
```

Con `provideRouter(routes)` y mocks de los servicios que usen las páginas cargadas.

### Interceptores (ver `core/interceptors/*.spec.ts`)

`provideHttpClient(withInterceptors([miInterceptor]))` + `provideHttpClientTesting()`, lanzar la
petición con `HttpClient` y resolverla con `HttpTestingController` (`flush`, o
`flush(body, { status: 401, statusText: 'Unauthorized' })` para errores).

### Temporizadores (ver `core/services/notification.service.spec.ts`)

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('auto-dismisses after the configured duration', () => {
  service.success('ok');

  vi.advanceTimersByTime(NOTIFICATION_DURATION_MS);

  expect(service.notifications()).toHaveLength(0);
});
```

### Pipes, validators y utils

Funciones puras: instanciar / llamar directamente, sin TestBed salvo que necesiten `inject()`
(entonces `TestBed.runInInjectionContext(() => new MiPipe())`).

## 5. E2E con Playwright

- Carpeta `e2e/`, ficheros `{flujo}.spec.ts`; config en `playwright.config.ts` (Chromium,
  `baseURL` `http://localhost:4200`, `webServer` = `npx ng serve`; en CI: 2 reintentos y `forbidOnly`).
- Corren contra la app real con el **fake backend MSW**: los datos que se asertan son los de
  `src/fake-backend/handlers/**/mocks.ts`. Credenciales de demo: `demo` / `demo`.
- **Todo flujo de usuario nuevo o modificado tiene su spec e2e** (happy path + validaciones o
  errores relevantes). Seleccionar por `id` (`page.locator('#login-btn-submit')`) o por rol/texto visible.
- Esperas con aserciones web-first (`await expect(locator).toBeVisible()`, `toHaveURL`), nunca
  `waitForTimeout`.

```typescript
import { expect, test } from '@playwright/test';

test.describe('authentication flow', () => {
  test('logs in, loads data from the API and logs out', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login-input-username').fill('demo');
    await page.locator('#login-input-password').fill('demo');
    await page.locator('#login-btn-submit').click();

    await expect(page).toHaveURL(/\/main$/);
    await expect(page.getByText('Example data served by the MSW fake backend')).toBeVisible();
  });
});
```

## Checklist

- [ ] Todo fichero con lógica tiene `*.spec.ts` al lado
- [ ] Mocks con `vi.fn()` / `vi.spyOn()`; `vi.resetAllMocks()` si se comparten entre tests
- [ ] `await fixture.whenStable()` tras cada cambio de estado (zoneless)
- [ ] `provideTranslateService()` y aserciones sobre **claves** i18n
- [ ] Servicios de API con `HttpTestingController` + `httpTesting.verify()`
- [ ] Cobertura por fichero ≥ 90/85/90/90 sin excluir nada nuevo
- [ ] Spec e2e del flujo de usuario en `e2e/`
- [ ] Sin `.only` / `.skip` / `.todo`
- [ ] **`npm run check` en verde**
