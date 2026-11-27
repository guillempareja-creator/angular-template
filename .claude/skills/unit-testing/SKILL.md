---
name: unit-testing
description: >
  Use when writing or updating unit tests in this Angular project: specs for components, services,
  API services, interceptors, guards, routes, pipes, validators or utils, run with Vitest through
  the Angular builder (ng test, jsdom). Also use when the user asks in Spanish to crear tests,
  añadir tests, testear un componente, testear un servicio, cobertura, specs or tests unitarios.
  Covers TestBed for standalone zoneless components (await fixture.whenStable), vi.fn / vi.spyOn /
  mockResolvedValue / fake timers, provideTranslateService (keys), HttpTestingController,
  RouterTestingHarness, runInInjectionContext, setInput and the per-file coverage thresholds.
user-invocable: true
---

# Skill: Tests unitarios (Vitest)

## 1. Cuándo usar esta skill

Todo fichero con lógica nace con su `*.spec.ts` al lado. Estrategia y reglas:
[`docs/architecture/testing.md`](../../../docs/architecture/testing.md); APIs de Angular:
[`docs/stack/angular.md`](../../../docs/stack/angular.md) §11.

```bash
npm run test:file -- src/app/pages/main   # mientras trabajas: un fichero o carpeta, sin cobertura
npm test                                  # modo watch
npm run test:ci                           # todo + cobertura por fichero (DoD)
```

- `describe`, `it`, `expect`, `vi`… son **globales** (no se importan).
- **Zoneless**: no existen `fakeAsync`, `tick` ni `waitForAsync`, ni hace falta `detectChanges()`:
  tras cualquier cambio de estado, `await fixture.whenStable()`.
- Cobertura **por fichero**: statements 90 · branches 85 · functions 90 · lines 90. Nunca se bajan
  umbrales ni se excluyen ficheros: se añaden tests de las ramas que faltan (informe en
  `coverage/index.html`).

## 2. Organización

- Un `describe` por unidad, anidados por método o escenario; `it` en inglés describiendo el
  comportamiento; patrón **AAA** separado por líneas en blanco; `it.each` para tablas de casos.
- Comportamiento observable (DOM, llamadas a dependencias, signals públicos), no detalles internos.
- DOM por `id` (`#expedients-list-btn-refresh`); textos por **clave** i18n.
- Mocks como objetos planos con `vi.fn()` y `useValue`; `vi.resetAllMocks()` en `beforeEach` si se
  comparten; dependencias con signals → `signal()` real en el mock.
- Prohibido `.only`, `.skip` y `.todo`.

## 3. Patrones

### Componente ([`main.component.spec.ts`](../../../src/app/pages/main/main.component.spec.ts))

```typescript
describe('MainComponent', () => {
  const exampleService = { getExample: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(), // no loader → `translate` returns the keys
        { provide: ExampleService, useValue: exampleService },
      ],
    });
  });

  it('renders the data returned by the API', async () => {
    exampleService.getExample.mockResolvedValue({ example: 'API data' });
    const fixture = TestBed.createComponent(MainComponent);

    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('API data');
  });
});
```

### Inputs, outputs e interacción

```typescript
const fixture = TestBed.createComponent(FormComponent);
fixture.componentRef.setInput('data', { name: 'Ana' });
const save = vi.fn();
fixture.componentInstance.save.subscribe(save); // subscribe() is allowed in specs
await fixture.whenStable();

const host = fixture.nativeElement as HTMLElement;
host.querySelector<HTMLButtonElement>('#expedients-form-btn-save')?.click();
await fixture.whenStable();

expect(save).toHaveBeenCalledWith({ name: 'Ana' });
```

### Servicio de API ([`example.service.spec.ts`](../../../src/app/core/api/example-api/example/example.service.spec.ts))

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

it('getExample → GET {exampleApi}/example', async () => {
  const response = service.getExample();

  const call = httpTesting.expectOne({ method: 'GET', url: `${EXAMPLE_API_URL}/example` });
  call.flush({ example: 'data' });

  await expect(response).resolves.toEqual({ example: 'data' });
});
```

Errores HTTP: `call.flush(body, { status: 500, statusText: 'Server Error' })` y
`await expect(response).rejects.toBeInstanceOf(HttpErrorResponse)`.

### Interceptor ([`http.interceptor.spec.ts`](../../../src/app/core/interceptors/http.interceptor.spec.ts))

`provideHttpClient(withInterceptors([miInterceptor]))` + `provideHttpClientTesting()`; lanzar la
petición con `HttpClient` (`firstValueFrom(http.get(...))`) y resolverla con
`HttpTestingController`, asertando lo que el interceptor cambia (cabeceras, URL, errores…).

### Rutas ([`app.routes.spec.ts`](../../../src/app/app.routes.spec.ts))

```typescript
const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/does-not-exist');
expect(TestBed.inject(Router).url).toBe('/main');
```

Con `provideRouter(routes)` y mocks de los servicios que usen las páginas cargadas.

### Guard funcional

```typescript
function run(guard: CanActivateFn): ReturnType<CanActivateFn> {
  return TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}
```

### Servicio con dependencias

```typescript
const repository = { load: vi.fn() };
TestBed.configureTestingModule({
  providers: [{ provide: RepositoryService, useValue: repository }],
});
const router = TestBed.inject(Router);
vi.spyOn(router, 'navigate').mockResolvedValue(true);
const service = TestBed.inject(MyService);
```

`mockResolvedValue` / `mockRejectedValue` para Promises; `mockReturnValue(of(...))` /
`throwError(() => error)` para Observables.

### Tiempo

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('hides the message after 5 seconds', () => {
  service.show('ok');

  vi.advanceTimersByTime(5000);

  expect(service.messages()).toHaveLength(0);
});
```

### Pipes, validators y utils

Funciones puras: se llaman directamente, con casos límite (`null`, `undefined`, vacío, bordes). Si
necesitan `inject()`: `TestBed.runInInjectionContext(() => new MyPipe())`.

## Checklist

- [ ] Cada fichero con lógica tiene su `*.spec.ts` al lado
- [ ] `await fixture.whenStable()` tras cada cambio de estado
- [ ] Mocks con `vi.fn()`/`vi.spyOn()` y reseteados; aserciones sobre claves i18n
- [ ] APIs con `HttpTestingController` + `verify()`
- [ ] Cobertura por fichero ≥ 90/85/90/90 sin excluir nada
- [ ] Sin `.only`/`.skip`/`.todo`
- [ ] **`npm run check` en verde** (skill `verify`)
