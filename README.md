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

The config automatically starts `kubectl port-forward` for:

- `frontend-svc` on `127.0.0.1:8080` when `UI_BASE_URL` is not set.
- `mongo-svc` on `127.0.0.1:27017` when `MONGODB_URI` is not set.

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
global-setup.ts        # Deletes all tasks via the API before each test run
playwright.config.ts   # Playwright configuration
```

## Global setup

`global-setup.ts` deletes all existing tasks via the API before each test run so that tests start from a clean state.

## Todo DB helper

`helpers/TodoDbHelper.ts` provides MongoDB operations for todo items: `list`, `create`, `edit`, `delete`, and `clearAll`.

Connection behavior:

- In-cluster: connects to `mongodb://mongo-svc:27017` (or namespace FQDN when `K8S_NAMESPACE` is set).
- Local: defaults to `mongodb://127.0.0.1:27017` (typically via `kubectl port-forward`), unless `MONGODB_URI` is explicitly set.
