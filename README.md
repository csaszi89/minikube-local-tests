# minikube-local-tests

Playwright e2e tesztek egy Kubernetes-ben futó Task Manager alkalmazáshoz. A tesztek futtathatók lokálisan (minikube / port-forward) és közvetlenül a clusterben is (in-cluster mód).

## Előfeltételek

- Node.js
- `kubectl` (lokális futtatáshoz)
- Futó Kubernetes cluster (pl. minikube)

## Telepítés

```bash
npm install
npx playwright install
```

## Tesztek futtatása

### Lokálisan (automatikus port-forward)

A konfiguráció automatikusan elindít egy `kubectl port-forward`-ot a `frontend-svc` service-re, ha nem fut a teszt clusterben és nincs `UI_BASE_URL` beállítva.

```bash
npm run test:e2e
```

### Interaktív UI módban

```bash
npx playwright test --ui
```

### In-cluster módban

Ha a tesztek egy Kubernetes Podokon belül futnak, a konfiguráció automatikusan a cluster-internal service URL-eket használja (`svc.cluster.local`).

## Környezeti változók

| Változó | Leírás | Alapértelmezett |
|---|---|---|
| `UI_BASE_URL` | Frontend URL | `http://127.0.0.1:8080` |
| `API_BASE_URL` | Backend API URL | `http://127.0.0.1:8080` |
| `K8S_NAMESPACE` | Kubernetes namespace | `default` |
| `K8S_FRONTEND_SERVICE_NAME` | Frontend service neve | `frontend-svc` |
| `K8S_BACKEND_SERVICE_NAME` | Backend service neve | `backend-svc` |

## Struktúra

```
tests/
  e2e.spec.ts          # e2e tesztek
  pages/
    TaskManagerPage.ts # Page Object Model
global-setup.ts        # Tesztek előtt törli az összes taskot az API-n keresztül
playwright.config.ts   # Playwright konfiguráció
```

## Global setup

A `global-setup.ts` minden tesztfutás előtt törli az összes meglévő taskot az API-n keresztül, hogy a tesztek tiszta állapotból induljanak.
