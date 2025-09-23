FROM projectmonai/monai:latest

RUN pip install --no-cache-dir \
    jupyterlab ipywidgets \
    boto3 s3fs \
    pydicom nibabel SimpleITK \
    tqdm matplotlib scikit-image \
    monai[all]

WORKDIR /workspace