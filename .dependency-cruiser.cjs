/**
 * Architecture gate (`npm run lint:arch`). Enforces the layering described in
 * docs/architecture/overview.md: pages → shared/core, never the other way
 * round; no cycles; the fake backend is never imported by application code.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make code hard to reason about and test.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment: 'Unused modules must be deleted (knip also reports them).',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '\\.spec\\.ts$',
          '(^|/)mockServiceWorker\\.js$',
          '^src/main\\.ts$',
          '^src/fake-backend/enable-mocking\\.noop\\.ts$',
          '^src/environments/',
        ],
      },
      to: {},
    },
    {
      name: 'core-shared-not-to-pages',
      severity: 'error',
      comment:
        'core/ and shared/ are reusable: they must never depend on pages/.',
      from: { path: '^src/app/(core|shared)/' },
      to: { path: '^src/app/pages/' },
    },
    {
      name: 'shared-not-to-core-services',
      severity: 'error',
      comment:
        'shared/ may use core/ APIs and services, but not guards or interceptors.',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/core/(guards|interceptors)/' },
    },
    {
      name: 'pages-isolated',
      severity: 'error',
      comment:
        'A page (domain) must not import another page. Promote shared code to shared/.',
      from: { path: '^src/app/pages/([^/]+)/' },
      to: {
        path: '^src/app/pages/([^/]+)/',
        pathNot: '^src/app/pages/$1/',
      },
    },
    {
      name: 'app-not-to-fake-backend',
      severity: 'error',
      comment:
        'Only main.ts may load the fake backend (through enable-mocking).',
      from: { path: '^src/app/' },
      to: { path: '^src/fake-backend/' },
    },
    {
      name: 'no-spec-imports',
      severity: 'error',
      comment: 'Production code must never import test files.',
      from: { pathNot: '\\.spec\\.ts$' },
      to: { path: '\\.spec\\.ts$' },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment:
        'Application code must not depend on devDependencies (except MSW in the fake backend).',
      from: {
        path: '^src/',
        pathNot: ['\\.spec\\.ts$', '^src/fake-backend/'],
      },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
