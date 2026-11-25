---
name: i18n
description: >
  Use when adding, updating, or reviewing any user-visible text in this Angular project — labels,
  titles, placeholders, button texts, aria-labels, table column headers, modal titles/descriptions,
  validation messages or notification messages. Also use when the user asks in Spanish about
  traducciones, i18n, internacionalización, textos traducibles, claves de traducción, añadir texto,
  hardcoded text, cambiar un texto visible, etiquetas, títulos, mensajes de éxito, mensajes de error,
  or any task that involves text shown to the user. Covers: key naming convention, JSON structure in
  src/assets/i18n/es.json, TranslatePipe in templates, the type-safe translateText() helper in
  TypeScript, common.* for shared actions, form.* validation messages (errorMessage pipe and
  translationTag validators) and httpRequest.* tags for HTTP notifications.
user-invocable: true
---

# Skill: i18n (textos traducibles)

## 1. Cuándo usar esta skill

Siempre que aparezca texto visible para el usuario (incluidos `placeholder`, `aria-label`, `alt`,
`title` y toasts). **Cero texto hardcodeado** en templates o TypeScript.

Stack: `@ngx-translate/core` + `@ngx-translate/http-loader`, configurado en `provideI18n()`
(`core/i18n/i18n.providers.ts`): carga `./assets/i18n/es.json`, locale `es-ES`, y bloquea el
primer render hasta tener las traducciones (no hay parpadeo de claves).

## 2. Estructura de claves (`src/assets/i18n/es.json`)

Formato `{domain}.{component}.{grupo}.{clave}`, en camelCase; usar solo los niveles necesarios.

```json
{
  "common": { "cancel": "Cancelar", "accept": "Aceptar", "close": "Cerrar", "logout": "Salir" },
  "app": { "name": "App Template" },
  "notifications": { "regionLabel": "Notificaciones" },
  "httpRequest": {
    "error": { "sessionExpired": "La sesión ha expirado.", "default": "Se ha producido un error." },
    "warning": { "default": "La operación se ha completado con avisos." },
    "success": { "exampleUpdated": "Elemento actualizado correctamente.", "default": "Operación realizada con éxito." }
  },
  "form": { "globalError": "…", "requiredError": "Campo obligatorio", "maxLengthError": "Máximo {{max}} caracteres" },
  "login": { "title": "Acceso", "usernameLabel": "Usuario", "submitButton": "Acceder" },
  "main": { "welcomeMessage": "¡Hola! Bienvenido a {{appName}}" },
  "globalLoader": { "loading": "Cargando..." }
}
```

| Raíz | Uso |
|---|---|
| `common.*` | Acciones y textos compartidos (`cancel`, `accept`, `close`, `logout`). Reutilizar antes de crear |
| `app.*` | Datos de la aplicación (`app.name`, lo sustituye `npm run rename`) |
| `notifications.*` | Textos del contenedor de notificaciones |
| `httpRequest.{error,warning,success}.*` | Tags de notificaciones HTTP; cada grupo con su `default` (skill `@success-notifications`) |
| `form.*` | Mensajes de validación genéricos y `form.globalError` |
| `{dominio}.*` | Textos de cada dominio/página (`login.*`, `main.*`); componentes compartidos por su nombre (`globalLoader.*`) |

- Claves en **inglés** y camelCase; valores en **español**.
- Interpolación con `{{param}}`.
- Al borrar un componente o dominio, borrar también sus claves.

## 3. En templates: `| translate`

```html
<label for="login-input-username">{{ 'login.usernameLabel' | translate }}</label>
<input
  id="login-input-username"
  type="text"
  formControlName="username"
  [placeholder]="'login.usernamePlaceholder' | translate"
/>

<h1>{{ 'main.welcomeMessage' | translate: { appName: 'app.name' | translate } }}</h1>

<p>{{ form.controls.username | errorMessage }}</p>

<button type="button" [attr.aria-label]="'common.close' | translate">&times;</button>
```

El componente importa `TranslatePipe` de `@ngx-translate/core`.

## 4. En TypeScript: `translateText()`

`TranslateService.instant()` devuelve `any`, y el lint estricto (`no-unsafe-*`) lo prohíbe. Usar
siempre el helper tipado de `@shared/utils/i18n.utils`:

```typescript
import { TranslateService } from '@ngx-translate/core';
import { translateText } from '@shared/utils/i18n.utils';

// Injections
private translate = inject(TranslateService);
private notificationService = inject(NotificationService);

// Methods
public handleSave(): void {
  this.notificationService.success(
    translateText(this.translate, 'example.detail.saved', { name: this.name() }),
  );
}
```

`translateText(translate, key, params?)` devuelve `string` y, si la clave no existe o no es un
texto, devuelve la propia clave.

## 5. Validaciones de formulario

- El pipe `errorMessage` (`shared/pipes/error-message.pipe.ts`) muestra el primer error de uno o
  varios controles: `{{ form.controls.username | errorMessage }}`.
- Validadores nativos se mapean en `ANGULAR_NATIVE_VALIDATORS` (`required` → `form.requiredError`).
  Para otro nativo (`email`, `min`…) añadir su entrada allí y su clave en `form.*`.
- Validadores propios devuelven `{ translationTag, interpolationParams? }`
  (ver `shared/validations/common.validators.ts`):

```typescript
return {
  maxLength: { translationTag: 'form.maxLengthError', interpolationParams: { max } },
};
```

## 6. Tests

`provideTranslateService()` sin loader: el pipe y `translateText()` devuelven la **clave**, así que
los specs asertan claves (`toContain('form.requiredError')`). Los e2e (Playwright) ven el texto real
en español.

## Checklist

- [ ] Ningún texto visible hardcodeado (incluye `placeholder`, `aria-label`, `alt`, toasts)
- [ ] Clave `{domain}.{component}.{grupo}.{clave}` en camelCase en `es.json`
- [ ] Reutilizado `common.*` antes de crear claves nuevas
- [ ] `| translate` en templates, `translateText()` en TS (nunca `instant()` directo)
- [ ] Tags HTTP en `httpRequest.{success,warning,error}.*`
- [ ] Claves huérfanas eliminadas
- [ ] **`npm run check` en verde**
