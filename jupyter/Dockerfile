# jupyter/Dockerfile
FROM projectmonai/monai:latest

# Make sure Python tooling + Jupyter are present (the MONAI image is PyTorch-ready)
RUN pip install --no-cache-dir \
    jupyterlab ipywidgets \
    boto3 s3fs \
    pydicom nibabel SimpleITK \
    tqdm matplotlib scikit-image \
    monai[all]  

# Helpful: make sure widgets show up in notebooks
RUN jupyter labextension list || true

# Create a workspace dir that matches your docker-compose volume
WORKDIR /workspace

