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

### Locally (automatic port-forward)

The config automatically starts a `kubectl port-forward` to the `frontend-svc` service when not running in-cluster and `UI_BASE_URL` is not set.

```bash
npm run test:e2e
```

### Interactive UI mode

```bash
npx playwright test --ui
```

### In-cluster mode

When tests run inside a Kubernetes Pod, the config automatically uses cluster-internal service URLs (`svc.cluster.local`).

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `UI_BASE_URL` | Frontend URL | `http://127.0.0.1:8080` |
| `API_BASE_URL` | Backend API URL | `http://127.0.0.1:8080` |
| `K8S_NAMESPACE` | Kubernetes namespace | `default` |
| `K8S_FRONTEND_SERVICE_NAME` | Frontend service name | `frontend-svc` |
| `K8S_BACKEND_SERVICE_NAME` | Backend service name | `backend-svc` |

## Structure

```
tests/
  e2e.spec.ts          # e2e tests
  pages/
    TaskManagerPage.ts # Page Object Model
global-setup.ts        # Deletes all tasks via the API before each test run
playwright.config.ts   # Playwright configuration
```

## Global setup

`global-setup.ts` deletes all existing tasks via the API before each test run so that tests start from a clean state.
