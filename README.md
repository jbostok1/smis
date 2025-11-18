# SMIS: Orthanc + OHIF + MONAI Label (+ MinIO/Jupyter)

A local stack for DICOM storage, viewing, and labeling. Orthanc holds the DICOM. OHIF views it. MONAI Label serves models. MinIO backs object storage. Jupyter is for quick scripts.

---

## Quick start

```bash
# 0) Docker running
sudo systemctl start docker

# 1) Check Compose v2
docker compose version

# 2) Launch
docker compose up -d
```

Open:

* Orthanc UI: [http://localhost:8042/app/explorer.html](http://localhost:8042/app/explorer.html)
* OHIF: [http://localhost:3000](http://localhost:3000)
* MONAI OHIF: [http://localhost:8000/ohif/](http://localhost:8000/ohif/)
* MinIO console: [http://localhost:9001](http://localhost:9001)  (user: smis, pass: smis-secret-123)
* Jupyter: [http://localhost:8888](http://localhost:8888)

---

## What’s running

**Orthanc (smis-orthanc)**

* Ports: `8042` (HTTP), `4242` (DICOM C‑STORE)
* DICOMweb: enabled at `/dicom-web`
* Dev config highlights:

  ```json
  {
    "HttpServerEnabled": true,
    "HttpPort": 8042,
    "AuthenticationEnabled": false,
    "RemoteAccessAllowed": true,
    "EnableCors": true,
    "CorsAllowedOrigin": "*",
    "DicomWeb": { "Enable": true, "Root": "/dicom-web" }
  }
  ```
* Why `RemoteAccessAllowed: true`: the browser is “remote” to the container; no auth prompt in dev.

**OHIF (smis-ohif)**

* Port: `3000`
* Localhost config (browser is outside Docker):

  ```json
  {
    "servers": {
      "dicomWeb": [
        {
          "name": "Orthanc",
          "qidoRoot": "http://localhost:8042/dicom-web",
          "wadoRoot": "http://localhost:8042/dicom-web",
          "wadoUriRoot": "http://localhost:8042/wado",
          "qidoSupportsIncludeField": true,
          "imageRendering": "wadors",
          "thumbnailRendering": "wadors"
        }
      ]
    }
  }
  ```
* (Optional) MONAI tools in this viewer: set `serverUrl` to `http://localhost:8000`, or just use `:8000/ohif` below.

**MONAI Label (smis-monailabel)**

* Port: `8000`
* Starts the Radiology app and enables all models. Talks to Orthanc via `http://orthanc:8042/dicom-web` (Docker DNS). From the browser, use `http://localhost:8042/...`.
* Persist models to avoid re‑downloading:

  ```yaml
  volumes:
    monai-cache: {}
    monai-apps: {}
  ```

**MinIO (smis-minio)**

* Ports: `9000` (API), `9001` (console)
* Credentials: `smis / smis-secret-123`

**Jupyter (smis-jupyter)**

* Port: `8888`
* GPU‑enabled; S3 envs point at MinIO.

---

## First run

1. Upload a study in Orthanc: `http://localhost:8042/app/explorer.html` → **Upload**.
2. Open OHIF: `http://localhost:3000` → study list should appear.
3. Open MONAI OHIF: `http://localhost:8000/ohif/` → fill modal:

   * QIDO/WADO‑RS: `http://localhost:8042/dicom-web`
   * WADO‑URI: `http://localhost:8042/wado`
   * MONAI Label server: `http://localhost:8000`
   * Username/Password: *(blank)*
4. Try a model (e.g., DeepEdit, Segmentation).

---

## Sanity checks

```bash
# Container status
docker compose ps

# Orthanc DICOMweb
curl -i http://localhost:8042/ | sed -n '1,12p'   # 307 redirect, no WWW-Authenticate
curl -s http://localhost:8042/dicom-web/studies | wc -c

# MONAI API
curl -s http://localhost:8000/info
curl -s http://localhost:8000/models
curl -s http://localhost:8000/datastore
```

---

## Gotchas I already fixed

* **Compose v1 http+docker error** → Use Compose v2: `docker compose up -d`.
* **Orthanc asks for login** with `AuthenticationEnabled: false` → set `RemoteAccessAllowed: true`, restart, hard‑refresh.
* **MONAI “APP Directory NOT provided”** → use a one‑liner that *downloads* the app then `start_server`.
* **MONAI “Provide --conf models <name>”** → add `--conf models all` (or pick a subset).

---

## Performance / GPU

* MONAI and Jupyter run with `runtime: nvidia`.
* Quick check: `docker exec -it smis-monailabel nvidia-smi`.
* No GPU? It falls back to CPU. Remove NVIDIA bits if needed.

---

## Security (beyond localhost)

* Re‑enable Orthanc auth or set `RemoteAccessAllowed: false` before exposing `:8042`.
* Prefer a reverse proxy (TLS + auth) if publishing any ports.

---

## Ports

* Orthanc: `8042`, C‑STORE: `4242`
* OHIF: `3000`
* MONAI Label: `8000`
* MinIO: `9000` (API), `9001` (console)
* Jupyter: `8888`

---

## Stop / start / logs

```bash
docker compose down            # stop everything
docker compose up -d           # start
docker compose restart <svc>   # restart one service

docker logs -f smis-orthanc
docker logs -f smis-ohif
docker logs -f smis-monailabel
docker logs -f smis-minio
docker logs -f smis-jupyter
```
