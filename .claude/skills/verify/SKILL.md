---
name: verify
description: >
  Use before declaring any task done, before every commit, and whenever the Stop hook reports
  unverified changes. Also use when the user asks in Spanish to verificar, validar, comprobar que
  todo está en verde, pasar los checks, ejecutar npm run check, cerrar la tarea or Definition of
  Done. Runs npm run check (npm run check:static for markdown-only changes), reads the first
  failing phase, fixes the code without relaxing any quality gate and repeats until green; stops
  and explains to the user when a rule blocks a legitimate pattern or the environment fails.
user-invocable: true
---

# Skill: Verificar (Definition of Done)

## 1. Cuándo usar esta skill

Siempre antes de decir que una tarea está terminada y antes de cada commit. La tarea **no está
terminada hasta que el comando termina en verde** (exit code 0). DoD completa:
[`docs/architecture/quality.md`](../../../docs/architecture/quality.md) §6.

## 2. Qué ejecutar

| Cambios                                   | Comando                |
| ----------------------------------------- | ---------------------- |
| Código, tests, estilos o configuración    | `npm run check`        |
| Solo documentación (`*.md`), incluidos retoques tras un `check` en verde | `npm run check:static` |

- `npm run check` tarda varios minutos (lint con tipos, tests con cobertura, build y e2e): ejecútalo
  con un tiempo de espera amplio y **nunca dos a la vez** (los e2e usan el puerto 4200).
- Truco: lanza antes `npm run check:static` (más rápido) y, en verde, el `check` completo.
- En verde, la salida termina con `✔ Definition of Done (full) verified…`: ese sello es el que
  comprueba el hook de cierre.

## 3. Bucle

1. Ejecuta el comando. Se detiene en la **primera fase que falla**: arregla esa.
2. Corrige según la fase:

   | Fase que falla | Cómo se arregla                                                                                       |
   | -------------- | ----------------------------------------------------------------------------------------------------- |
   | `format:check` | `npm run format`                                                                                      |
   | `lint`         | Corrige el código (itera con `npx eslint <fichero>`); los `eslint-disable` no tienen efecto           |
   | `lint:styles`  | Tokens y mixins en vez de valores; reduce anidamiento; `npm run format` arregla lo automático         |
   | `lint:arch`    | Mueve el fichero a su capa, quita el import entre dominios o borra el fichero huérfano               |
   | `lint:unused`  | Borra el fichero, export o dependencia que sobra (o úsalo de verdad)                                  |
   | `typecheck`    | Tipa bien: sin `any`, sin `!`, sin `@ts-*`                                                            |
   | `test:ci`      | Test rojo: arregla el código (o el test si estaba mal, explicando por qué). Cobertura de un fichero por debajo: añade tests de las ramas que faltan (`coverage/index.html`) |
   | `build`        | Presupuesto superado: divide componentes o carga en lazy; nunca subas el presupuesto                  |
   | `e2e`          | Lee el error y `test-results/**/error-context.md`; reproduce con `npm run e2e:ui` (skill `e2e-testing`) |

3. Repite primero solo lo que falló (`npx eslint <fichero>`, `npm run test:file -- <ruta>`,
   `npm run e2e -- <spec>`) y, cuando pase, vuelve a lanzar el comando completo.
4. Sigue hasta exit code 0.

## 4. Si no se puede poner en verde

- **Nunca** relajes un gate: ni desactivar o rebajar reglas, ni `eslint-disable`, `@ts-ignore` o
  `@ts-expect-error`, ni bajar umbrales, subir presupuestos, excluir ficheros, `.skip`/`.only` o
  borrar tests que fallan.
- Si una regla bloquea un patrón legítimo, **para y explícaselo al usuario**: fase, regla, fichero y
  por qué crees que el patrón es correcto. Espera su decisión.
- Problemas de entorno (versión de Node distinta de `engines`, Chromium sin instalar →
  `npm run e2e:install`, puerto 4200 ocupado…): explícalos al usuario con el error exacto.

## 5. Cierre

Informa al usuario de qué se verificó (`npm run check` en verde), qué ha cambiado y qué queda
pendiente (`docs/project/TODOS.md`).
