# New Nx Repository

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!
## Finish your Nx platform setup

🚀 [Finish setting up your workspace](https://cloud.nx.app/connect/0Ou9e4OQpY) to get faster builds with remote caching, distributed task execution, and self-healing CI. [Learn more about Nx Cloud](https://nx.dev/ci/intro/why-nx-cloud).
## Generate a library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```

## Run tasks

To build the library use:

```sh
npx nx build pkg1
```

To run any task with Nx use:

```sh
npx nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Versioning and releasing

To version and release the library use

```
npx nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
npx nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
npx nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)

## Nx Cloud

Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Set up CI (non-Github Actions CI)

**Note:** This is only required if your CI provider is not GitHub Actions.

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Guia de tema unificado (PrimeNG + PrimeFlex + Tailwind)

Este projeto utiliza um conjunto único de tokens e utilitários para garantir consistência entre os modos claro/escuro e entre as bibliotecas PrimeNG, PrimeFlex e Tailwind.

### Tokens globais

- **Arquivo fonte:** `apps/v3ndor/src/styles.css` (seção `:root` / `.dark`).
- Use sempre as variáveis CSS `var(--v-*)` para superfícies e textos, e `var(--state-*)` para estados (sucesso, alerta, erro, informação).
- Tailwind está configurado para ler essas variáveis (`apps/v3ndor/tailwind.config.js`), então utilitários Tailwind refletem automaticamente a mudança de tema.

### Overrides do PrimeNG

- **Arquivo:** `apps/v3ndor/src/app/theme/primeng-overrides.css`.
- Todas as customizações de componentes PrimeNG devem ir para esse arquivo usando as variáveis globais.
- Evite `::ng-deep`: se precisar alterar um componente específico, adicione `styleClass` no template (ex.: `styleClass="action-button"`) e estilize via SCSS local.

### Utilitários e convenções

- `.v-urgent-badge`: badge pronta para estados críticos.
- `.advanced-grid-table`: aplicado nos `<p-table>` do grid compartilhado para estilização consistente.
- `.action-button`: usado nos botões de ações do modal para manter padding/tipografia iguais.
- Para PrimeNG, prefira `styleClass`/`appendTo="body"` em vez de injetar CSS global.

### Passos para novos componentes

1. **Defina superfícies e textos** usando `var(--v-bg-card)`, `var(--v-text-primary)`, etc.
2. **Estados** (sucesso/erro/alerta) vêm de `var(--state-success)` e variações `-soft` para fundos.
3. **PrimeNG:** atribua `styleClass` e adicione classes no SCSS local; só altere `primeng-overrides.css` para regras realmente globais.
4. **Tailwind:** use utilitários normalmente — eles já apontam para as variáveis globais.
5. **Sem `::ng-deep`:** se identificar algum legado, substitua por classes locais ou pelos overrides globais.

### Checklist rápido antes de abrir PR

- [ ] Nenhuma cor hardcoded (usar tokens).
- [ ] Sem `::ng-deep` ou `prefers-color-scheme` locais.
- [ ] Novas classes documentadas/descritas neste README, se forem utilitários globais.
- [ ] Testar light e dark (especialmente dropdowns, timelines e modais PrimeNG).
