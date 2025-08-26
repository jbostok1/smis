# SMIS + Orthanc + OHIF + MONAI Label (and MinIO/Jupyter)

This is my local stack for working with medical images and AI-assisted labeling. It’s simple, repeatable, and everything talks to each other.

**What’s here:**

- **Orthanc** (DICOM server) on `:8042` and DICOM (C-STORE) on `:4242`
- **OHIF** viewer on `:3000`
- **MONAI Label** server on `:8000` (serves an OHIF build at `/ohif/`)
- **MinIO** S3-compatible storage on `:9000` (console on `:9001`)
- **JupyterLab** on `:8888` (GPU-ready)

---

## Quick Start

```bash
# 0) Make sure Docker daemon is running
sudo systemctl start docker

# 1) Use Docker Compose v2 (not the old Python v1)
docker compose version

# 2) Bring up everything
docker compose up -d

Open these:

    Orthanc UI: http://localhost:8042/app/explorer.html

OHIF: http://localhost:3000

MONAI OHIF (from the MONAI server): http://localhost:8000/ohif/

MinIO: http://localhost:9001

(user: smis, pass: smis-secret-123)

Jupyter: http://localhost:8888
Services (what I’m running)
Orthanc (smis-orthanc)

    Ports: 8042 (HTTP), 4242 (DICOM C-STORE)

    Config (mounted at ./orthanc/orthanc.json):

{
  "HttpServerEnabled": true,
  "HttpPort": 8042,
  "AuthenticationEnabled": false,
  "RemoteAccessAllowed": true,
  "EnableCors": true,
  "CorsAllowedOrigin": "*",
  "DicomWeb": { "Enable": true, "Root": "/dicom-web" }
}

    Why RemoteAccessAllowed: true? Because the browser is “remote” from the container’s point of view. With this set, no Basic Auth prompt on :8042 for local dev.

OHIF (smis-ohif)

    Port: 3000

    Config mounted at ./ohif/app-config.json. Use localhost URLs (the browser isn’t inside Docker):

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

    If I want MONAI tools directly in this viewer, I can enable the MONAI extension/mode and set serverUrl to http://localhost:8000. (I’m fine using the MONAI-bundled OHIF at :8000/ohif for now.)

MONAI Label (smis-monailabel)

    Port: 8000

    Starts by downloading the Radiology sample app and enabling all models (I can slim this later):

command: ["bash","-lc",
  "monailabel apps --download --name radiology --output /workspace/apps && \
   monailabel start_server --app /workspace/apps/radiology \
   --studies http://orthanc:8042/dicom-web \
   --conf models all \
   --host 0.0.0.0 --port 8000"]

Notes:

    Inside Docker, MONAI talks to Orthanc via http://orthanc:8042/dicom-web (service name DNS).

    From my browser, I use http://localhost:8042/....

    I can persist models so I don’t re-download huge weights each time:

monailabel:
  volumes:
    - monai-cache:/root/.cache/monailabel
    - monai-apps:/workspace/apps

volumes:
  monai-cache: {}
  monai-apps: {}

MinIO (smis-minio)

    Ports: 9000 (API), 9001 (console)

    Credentials: smis / smis-secret-123

Jupyter (smis-jupyter)

    Port: 8888

    GPU-enabled (runtime: nvidia), S3 env vars pointed at MinIO

First Run Checklist

    Upload a study in Orthanc: http://localhost:8042/app/explorer.html

→ Upload.

Open OHIF at http://localhost:3000

. Study list should appear.

Open MONAI’s OHIF at http://localhost:8000/ohif/

    and fill the modal:

        DICOMweb QIDO/WADO-RS: http://localhost:8042/dicom-web

        WADO-URI: http://localhost:8042/wado

        MONAI Label server: http://localhost:8000

        Username/Password: (blank)

    Try a model (e.g., DeepEdit, Segmentation, etc.).

Sanity Checks

# container status
docker compose ps

# Orthanc DICOMweb
curl -i http://localhost:8042/ | sed -n '1,12p'    # should be 307 redirect, no WWW-Authenticate
curl -s http://localhost:8042/dicom-web/studies | wc -c

# MONAI API
curl -s http://localhost:8000/info
curl -s http://localhost:8000/models
curl -s http://localhost:8000/datastore

Common Pitfalls I already fixed

    Compose v1 “http+docker” error

        Switched to Compose v2: docker compose up -d

        If keeping v1, install requests-unixsocket and clear DOCKER_HOST.

    Orthanc asking for login with AuthenticationEnabled: false

        Set "RemoteAccessAllowed": true and restart Orthanc.

        Hard refresh / private window to clear cached 401.

    MONAI says “APP Directory NOT provided”

        The shell wrapped flags got split. Use exec/array form or the one-liner that downloads the app and then starts the server (see above).

    MONAI says “Provide --conf models <name>”

        Add --conf models all (or a subset) to start_server.

Performance / GPU Notes

    runtime: nvidia is enabled for MONAI and Jupyter. Quick check:

    docker exec -it smis-monailabel nvidia-smi

    If GPU isn’t available, MONAI still runs on CPU (slower). Remove the runtime/NVIDIA envs if needed.

Security Notes (when not just localhost)

    Re-enable Orthanc auth or set "RemoteAccessAllowed": false before exposing 8042.

    Consider putting the stack behind a reverse proxy with TLS + auth if needed.

Ports at a glance

    Orthanc: 8042, DICOM C-STORE: 4242

    OHIF: 3000

    MONAI Label: 8000

    MinIO: 9000 (API), 9001 (console)

    Jupyter: 8888

Stop / Start

docker compose down            # stop everything
docker compose up -d           # start
docker compose restart <svc>   # restart one service

That’s it. If I forget anything, it’s probably in the logs:

docker logs -f smis-orthanc
docker logs -f smis-ohif
docker logs -f smis-monailabel
docker logs -f smis-minio
docker logs -f smis-jupyter


### Option B: one-liner to write the file for you
Run this in your repo root:

```bash
cat > README.md <<'EOF'
# SMIS + Orthanc + OHIF + MONAI Label (and MinIO/Jupyter)

This is my local stack for working with medical images and AI-assisted labeling. It’s simple, repeatable, and everything talks to each other.

**What’s here:**

- **Orthanc** (DICOM server) on `:8042` and DICOM (C-STORE) on `:4242`
- **OHIF** viewer on `:3000`
- **MONAI Label** server on `:8000` (serves an OHIF build at `/ohif/`)
- **MinIO** S3-compatible storage on `:9000` (console on `:9001`)
- **JupyterLab** on `:8888` (GPU-ready)

--- (content continues exactly as above) ---
EOF

want me to also add a tiny ASCII diagram of the services + ports up top?