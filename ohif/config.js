window.config = {
  routers: [{ path: '/', name: 'default' }],
  servers: [
    {
      id: 'orthanc',
      type: 'dicomWeb',
      name: 'Orthanc',
      wadoUriRoot: `http://${location.hostname}:8042/wado`,
      qidoRoot:    `http://${location.hostname}:8042/dicom-web`,
      wadoRoot:    `http://${location.hostname}:8042/dicom-web`,
      qidoSupportsIncludeField: true,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors'
    }
  ]
};
