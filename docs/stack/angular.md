# Stack: Angular

> Particularidades de Angular en este template. La arquitectura agnóstica está
> en [`../architecture/`](../architecture/overview.md); este documento explica
> **cómo se implementa en Angular**. Si un proyecto usa otro framework, este
> documento se sustituye por el suyo (skill `new-project`, §13).

## 1. Qué es específico de Angular

| Pieza                     | Implementación                                                            | Dónde                                      |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| Componentes               | Standalone, **signals**, **zoneless** (sin `zone.js`), `OnPush`           | `src/app/**/*.component.ts`                |
| Inyección de dependencias | `inject()` + servicios `providedIn: 'root'`                               | Servicios y componentes                    |
| HTTP                      | `HttpClient` + `firstValueFrom` (Promise)                                 | `core/api/`                                |
| Interceptor               | `HttpInterceptorFn` funcional registrado con `withInterceptors`           | `core/interceptors/`, `app.config.ts`      |
| Routing                   | `provideRouter`, `loadComponent` lazy, enum `AppPath`                     | `app.routes.ts`                            |
| i18n                      | `@ngx-translate/core` + `http-loader`, `provideI18n()`, `translateText()` | `core/i18n/`, `shared/utils/i18n.utils.ts` |
| Estilos de componente     | `styleUrl` + encapsulación `Emulated` + `:host`                           | `*.component.scss`                         |
| Entornos y mock           | `fileReplacements` de `angular.json`                                      | `angular.json`, `src/environments/`        |
| Tests unitarios           | Vitest vía `@angular/build:unit-test` (jsdom) + TestBed                   | `angular.json` (`test`)                    |
| Lint del framework        | angular-eslint (TS y plantillas)                                          | `eslint.config.mjs`                        |
| Build y presupuestos      | `@angular/build:application`                                              | `angular.json` (`build`)                   |

## 2. Versiones y herramientas

| Pieza        | Versión / elección                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Framework    | Angular 22 (standalone, signals, zoneless)                                                                |
| Lenguaje     | TypeScript 6, estricto                                                                                    |
| Runtime      | Node 24 (`.nvmrc`; `engines` exige `^22.22.3 \|\| ^24.15.0 \|\| >=26`) · npm                              |
| CLI          | Angular CLI como dependencia del proyecto (`npx ng …`)                                                    |
| Tests        | Vitest 5 (builder de Angular) · Playwright 1.65                                                           |
| Mock backend | MSW 3                                                                                                     |
| i18n         | `@ngx-translate/core` + `@ngx-translate/http-loader` 18                                                   |
| Calidad      | ESLint 10 (typescript-eslint, angular-eslint, sonarjs) · Stylelint · dependency-cruiser · knip · Prettier |

**Dependencias de runtime permitidas** (`dependencies`): los paquetes de
Angular, `rxjs`, `tslib`, `@ngx-translate/core` y `@ngx-translate/http-loader`.
Cualquier otra exige justificación y caber en el presupuesto. Los paquetes de
Angular que no se usan no se instalan (knip lo detecta): por ejemplo
`@angular/forms` se añade cuando aparezca el primer formulario (§7).

## 3. Anatomía de un componente

```typescript
@Component({
  selector: 'app-entity-form',
  imports: [TranslatePipe], // solo lo que usa la plantilla
  templateUrl: './entity-form.component.html',
  styleUrl: './entity-form.component.scss', // singular
  changeDetection: ChangeDetectionStrategy.OnPush, // SIEMPRE
})
export class EntityFormComponent implements OnInit {
  // Injections
  private entityService = inject(EntityService); // inject() SIEMPRE, nunca constructor

  // ViewChilds
  private readonly section = viewChild<ElementRef<HTMLElement>>('section');

  // Models
  public readonly value = model<string>('');

  // Inputs
  public readonly data = input.required<EntityData>();
  public readonly isReadonly = input<boolean>(false);

  // Outputs
  public readonly save = output<EntityData>();

  // Data
  public readonly items = signal<Item[]>([]);
  public readonly isLoaded = signal<boolean>(false);

  // Computeds
  public readonly hasItems = computed(() => this.items().length > 0);

  // Effects
  private readonly syncValueWithData = effect(() => {
    this.value.set(this.data().name);
  });

  // Methods
  public ngOnInit(): void {
    // lifecycle primero; nunca async
    void this.loadItems();
  }

  private async loadItems(): Promise<void> {
    // …privados…
  }

  public handleSave(): void {
    // …y luego públicos
  }
}
```

- Orden de secciones **estricto** y con comentarios separadores: `Injections` →
  `ViewChilds` → `Models` → `Inputs` → `Outputs` → `Data` → `Computeds` →
  `Effects` → `Methods` (lifecycle, privados, públicos).
- **Visibilidad explícita**: `private` por defecto; `public` solo si lo usa la
  plantilla. Las propiedades creadas con signals (`signal`, `computed`, `input`,
  `model`, `viewChild`…) y los `output()` son **`readonly`** (lo exige
  angular-eslint). Los `effect` son siempre `private`.
- Sin `standalone: true` (es el default). Selector `app-*` en kebab-case.
- Las **páginas** se exportan con `export default` (para el `loadComponent`
  lazy).
- APIs modernas únicamente: `input()`, `output()`, `model()`, `viewChild()`;
  nada de `@Input`, `@Output`, `@ViewChild` ni `EventEmitter` (lo prohíbe
  ESLint). Control flow `@if`/`@for`/`@switch`.
- Nunca importar en `imports[]` algo que la plantilla no use.
- Para conservar los landmarks semánticos se envuelve el componente:
  `<header><app-header /></header>`.

## 4. Estado y datos asíncronos (zoneless)

- No hay `zone.js`: la vista solo se repinta cuando cambia un **signal** (o por
  un evento de plantilla). **Todo estado que pinte la vista es un signal**; un
  campo plano que cambia no repinta.
- Nunca mutar el contenido de un signal (`items().push(x)` ❌): siempre
  `set`/`update` con referencia nueva. Valores derivados con `computed`, nunca
  calculados en la plantilla.
- Carga de datos: signal de datos + signal `isLoaded` separado; la plantilla
  condiciona con `@if (isLoaded())`, nunca con `@if (data())` (un `null`
  legítimo del backend dejaría la pantalla sin pintar). Referencia:
  [`main.component.ts`](../../src/app/pages/main/main.component.ts).
- Llamadas independientes en paralelo con `Promise.all`; `Promise.allSettled`
  solo si cada bloque puede fallar por separado.
- Hooks de ciclo de vida no `async`: `void this.loadData()`. Sin `await` en la
  última llamada de una función `void`. Nada de `subscribe()` fuera de los
  interceptores (lo prohíbe ESLint): se usa `firstValueFrom` y `async/await`.

## 5. Servicios HTTP e interceptor

```typescript
@Injectable({ providedIn: 'root' })
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
```

- Siempre `firstValueFrom(this.http.METHOD<Response>(...))`: la capa de API
  devuelve `Promise`.
- `@Injectable({ providedIn: 'root' })` siempre (lo exige ESLint). Descargas:
  `responseType: 'blob'`.
- Interceptor funcional (`HttpInterceptorFn`) registrado en `app.config.ts` con
  `provideHttpClient(withInterceptors([httpInterceptor]))`. Opciones por
  petición que no deben llegar al backend: `HttpContextToken` + `context` en la
  llamada. Reglas: [`api.md`](../architecture/api.md) §6.

## 6. Routing

- `app.routes.ts`: un path por dominio. Un dominio de una pantalla se carga con
  `loadComponent: () => import('./pages/x/x.component')`; uno con varias, con
  `loadChildren` hacia su `{domain}.routes.ts`.
- Paths de primer nivel en el enum `AppPath` (`shared/enums/app-path.enum.ts`);
  se navega con `router.navigate(['/', AppPath.MAIN])`, nunca con strings
  sueltos. La ruta `**` redirige siempre a una ruta existente.
- Rutas protegidas con **guards funcionales** (`CanActivateFn`) en
  `core/guards/` cuando el proyecto tenga sesión. Rutas hijas para variantes
  (`:id` → detalle). Estado efímero entre pantallas con `history.state`, no con
  query params.
- Las rutas tienen test
  ([`app.routes.spec.ts`](../../src/app/app.routes.spec.ts)).

## 7. Formularios

El template no trae formularios: `@angular/forms` se instala con el primero
(`npm install @angular/forms@<misma versión que @angular/core>`). Convenciones:

- Reactive forms **tipados** (`FormBuilder.nonNullable.group(...)`), declarados
  en `// Data` o en un `buildForm()`; en edición, `patchValue(...)` en
  `ngOnInit`.
- Un formulario usado en alta y edición es **un solo componente** con
  `data = input<X | null>(null)` y outputs `save`/`cancel`; no llama a la API:
  emite, y la pantalla decide POST o PUT.
- Flujo de guardado: marcar todos los controles como tocados → si es inválido,
  foco en el primer control inválido y aviso al usuario → si es válido,
  emitir/guardar.
- Validators reutilizables en `shared/validations/` que devuelven
  `{ translationTag, interpolationParams? }`, y un pipe en `shared/pipes/` que
  traduce el primer error del control; estado inválido en plantilla con
  `[class.is-invalid]` y `[attr.aria-invalid]`, y el mensaje enlazado con
  `aria-describedby`.

## 8. i18n

- `provideI18n()`
  ([`core/i18n/i18n.providers.ts`](../../src/app/core/i18n/i18n.providers.ts)):
  registra ngx-translate con el cargador HTTP (`./assets/i18n/{lang}.json`), el
  locale `es-ES` (pipes de fecha, número y moneda) y **bloquea el primer render
  hasta tener las traducciones**.
- Plantillas: `TranslatePipe` en `imports[]` y `{{ 'clave' | translate }}`; en
  atributos, binding `[placeholder]="'clave' | translate"` (ESLint prohíbe la
  interpolación en atributos).
- Código: `translateText(this.translate, 'clave', params?)` de
  `@shared/utils/i18n.utils`, nunca `TranslateService.instant()` (devuelve
  `any`, prohibido por el lint estricto).
- Tests: `provideTranslateService()` sin cargador → el pipe devuelve la clave.

## 9. Estilos

- `styleUrl` singular; encapsulación por defecto (`Emulated`): los estilos no se
  filtran a otros componentes. `ViewEncapsulation.None` está prohibido (ESLint).
- `@use 'imports' as *;` funciona porque `angular.json` declara
  `stylePreprocessorOptions.includePaths: ["src/styles"]`; la hoja global
  `src/styles/app.scss` se registra en `styles`. Todo lo demás:
  [`styles.md`](../architecture/styles.md).

## 10. Entornos y fake backend

- `angular.json` → `fileReplacements`: en `tst` y `production`, `environment.ts`
  se sustituye por `environment.{tst,prod}.ts` y `enable-mocking.ts` por
  `enable-mocking.noop.ts` (el código de MSW no entra en el bundle).
  `mockServiceWorker.js` solo se copia como asset en `development`.
- `main.ts` espera a `enableMocking()` antes de `bootstrapApplication` para que
  MSW intercepte desde la primera petición.

## 11. Tests

Vitest con el builder oficial (`ng test`, entorno jsdom). `describe`, `it`,
`expect` y `vi` son globales (`vitest/globals` en `tsconfig.spec.json`).
Zoneless: no existen `fakeAsync`, `tick` ni `waitForAsync`, ni hace falta
`detectChanges()`.

| Qué             | Cómo                                                                                                            | Referencia                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Componente      | `TestBed.createComponent(C)` + `await fixture.whenStable()` tras cada cambio de estado                          | `pages/main/main.component.spec.ts`                    |
| Dependencias    | `{ provide: X, useValue: { método: vi.fn() } }`; signals del servicio → `signal()` real                         | `pages/main/main.component.spec.ts`                    |
| Signal inputs   | `fixture.componentRef.setInput('data', valor)` + `await fixture.whenStable()`                                   | —                                                      |
| Outputs         | `fixture.componentInstance.save.subscribe(spy)` (en specs sí se permite)                                        | —                                                      |
| Servicio de API | `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController` (`expectOne`, `flush`, `verify`) | `core/api/example-api/example/example.service.spec.ts` |
| Interceptor     | `provideHttpClient(withInterceptors([x]))` + `HttpTestingController`                                            | `core/interceptors/http.interceptor.spec.ts`           |
| Rutas           | `provideRouter(routes)` + `RouterTestingHarness.create()` + `navigateByUrl`                                     | `app.routes.spec.ts`                                   |
| Guard funcional | `TestBed.runInInjectionContext(() => guard(route, state))`                                                      | —                                                      |
| Inicializadores | `await TestBed.inject(ApplicationInitStatus).donePromise`                                                       | `core/i18n/i18n.providers.spec.ts`                     |
| Traducciones    | `provideTranslateService()` → se asertan claves                                                                 | `shared/components/header/header.component.spec.ts`    |
| Tiempo          | `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)`; `vi.useRealTimers()` en `afterEach`                        | —                                                      |

## 12. Reglas de lint de Angular

`prefer-on-push-component-change-detection`, `prefer-signals` (signals
`readonly`), `prefer-output-emitter-ref`, `prefer-output-readonly`,
`no-uncalled-signals`, `no-async-lifecycle-method`, `no-lifecycle-call`,
`sort-lifecycle-methods`, `use-lifecycle-interface`,
`use-injectable-provided-in`, `use-component-view-encapsulation`,
`consistent-component-styles`, selectores `app-*`; en plantillas:
`prefer-control-flow`, `prefer-self-closing-tags`, `prefer-ngsrc`
(`NgOptimizedImage`), `no-any`, `button-has-type` y las de accesibilidad.
Compilador: `strictTemplates`, `strictInjectionParameters`,
`strictInputAccessModifiers`, `strictStandalone`, `typeCheckHostBindings` y
diagnósticos extendidos como error.

## 13. Usar otro framework

La skill `new-project` pregunta el framework al arrancar. Si no es Angular, se
conserva todo lo agnóstico (arquitectura, estilos compartidos, i18n, MSW,
Playwright, gates genéricos, documentación y configuración de IA) y se rehace lo
de la tabla del §1 con los equivalentes del nuevo framework, sustituyendo este
documento por `docs/stack/{framework}.md`.
