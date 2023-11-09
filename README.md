## Run full contianerized app locally in minikube
### Switch to minikube Docker Daemon
`eval $(minikube -p minikube docker-env)`

### Build image
`docker build -t <image-tag> .`

### (Optional) Check the built image
`minikube image ls --format table`

Image name will be as **docker.io/library/<image-tag>**

### Update the image name for deployment
Locate to the deployment environment

`cd deployment/overlays/<service>/<environment>`

Update the image in **patch.yaml** by the image name above **docker.io/library/<image-tag>**

### Apply the deployment
`kubectl apply -k .`


Please note that the service will be exposed in the minikube container, not the local machine.
If you want to check it out, please forward the port using minikube.
