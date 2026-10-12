# minikube-local-tests

Playwright e2e tests for a Task Manager application running in Kubernetes. Tests can be run locally (minikube / port-forward) or directly inside the cluster (in-cluster mode).

## Prerequisites

- Node.js
- `kubectl` (for local execution)
- A running Kubernetes cluster (e.g. minikube)

## Installation

```bash
npm install
npx playwright install
```

## Running tests

Tests run against three browser projects: Chromium, Firefox, and WebKit (see `projects` in [playwright.config.ts](playwright.config.ts)).

### Locally (automatic port-forward)

The config automatically starts `kubectl port-forward` for `frontend-svc` on `127.0.0.1:8080` when `UI_BASE_URL` is not set.

```bash
npm run test:e2e
```

To run a single browser:

```bash
npx playwright test --project=chromium
```

### Interactive UI mode

```bash
npx playwright test --ui
```

### In-cluster mode

When tests run inside a Kubernetes Pod, the config automatically uses cluster-internal service URLs (`svc.cluster.local`).

## CI/CD

Tests run automatically via a self-hosted GitHub Actions runner on push, pull request, and manual trigger (`workflow_dispatch`). See [.github/workflows/playwright.yml](.github/workflows/playwright.yml).

The pipeline does not run Playwright directly on the runner. Instead, it:

1. Applies [k8s/testworkflow.yaml](k8s/testworkflow.yaml) to sync the Testkube `TestWorkflow` definition with the cluster (`kubectl apply`).
2. Triggers that `TestWorkflow` via the Testkube CLI (`kubectl testkube run testworkflow ... -f --download-artifacts`), which runs the tests **inside a pod in the cluster**, against the in-cluster service URLs.
3. Downloads the resulting Playwright report/test-results artifacts from Testkube and uploads them as a GitHub Actions artifact.

### Requirements on the self-hosted runner machine

- `kubectl` and the `kubectl-testkube` CLI plugin on `PATH`, pointing at the target cluster.
- A working kubeconfig for the account the runner process uses.
- A Testkube instance installed in the cluster (OSS stack: `testkube` namespace with `testkube-api-server`, MongoDB, MinIO, NATS).

### Running the TestWorkflow manually

```powershell
kubectl apply -f k8s/testworkflow.yaml
kubectl testkube run testworkflow minikube-local-tests-e2e -f --download-artifacts --download-dir artifacts
kubectl testkube get testworkflowexecution
```

## Test reporting (Allure)

Besides the built-in Playwright HTML reporter, tests also produce [Allure](https://allurereport.org/) results (configured in [playwright.config.ts](playwright.config.ts)).

### Viewing the report locally

```bash
npm run test:e2e
npm run allure:generate
npm run allure:open
```

### Published report (GitHub Pages)

On every CI run, the `publish-report` job (runs on a GitHub-hosted `ubuntu-latest` runner, not the self-hosted one) downloads the `allure-results` produced in the cluster, generates the HTML report, and publishes it to the `gh-pages` branch.

The latest report is publicly available at:

**https://csaszi89.github.io/minikube-local-tests/**

Notes:

- The `gh-pages` branch and the GitHub Pages site are created automatically after the first successful workflow run.
- The published site is **public** by default, even if the repository itself is private (unless GitHub Enterprise's private Pages visibility is used).

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `UI_BASE_URL` | Frontend URL | `http://127.0.0.1:8080` |
| `API_BASE_URL` | Backend API URL | `http://127.0.0.1:8080` |
| `K8S_NAMESPACE` | Kubernetes namespace | `default` |
| `K8S_FRONTEND_SERVICE_NAME` | Frontend service name | `frontend-svc` |
| `K8S_BACKEND_SERVICE_NAME` | Backend service name | `backend-svc` |
| `K8S_BACKEND_SERVICE_PORT` | Backend service port | `8080` |
| `MONGODB_URI` | Full MongoDB connection string override | auto-calculated |
| `MONGODB_SERVICE_NAME` | MongoDB service name | `mongo-svc` |
| `MONGODB_SERVICE_PORT` | MongoDB service port | `27017` |
| `MONGODB_DB_NAME` | MongoDB database name | `taskmanager` |
| `MONGODB_COLLECTION` | MongoDB collection name for todos | `tasks` |

## Structure

```
tests/
  e2e.spec.ts          # e2e tests
  pages/
    TaskManagerPage.ts # Page Object Model
playwright.config.ts   # Playwright configuration
```

## Cleanup

`tests/e2e.spec.ts` deletes all existing tasks via the API in an `afterEach` hook, so every test starts from a clean state regardless of run mode (e.g. repeated runs in UI mode).

## Todo DB helper

`helpers/TodoDbHelper.ts` provides MongoDB operations for todo items: `list`, `create`, `edit`, `delete`, and `clearAll`. It is not wired into the test setup; it is available for direct DB assertions if needed.

Connection behavior:

- In-cluster: connects to `mongodb://mongo-svc:27017` (or namespace FQDN when `K8S_NAMESPACE` is set).
- Local: defaults to `mongodb://127.0.0.1:27017` (requires a manual `kubectl port-forward`), unless `MONGODB_URI` is explicitly set.

