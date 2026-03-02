# Run frontend on specific node(s)

The deployment uses **nodeSelector: workload: frontend**. Pods run only on nodes that have this label.

## With 2 nodes – use only one node

Label **only the node** where you want the frontend to run:

```bash
kubectl label nodes <NODE_NAME> workload=frontend
```

Example (replace with your node name from `kubectl get nodes`):

```bash
kubectl get nodes
kubectl label nodes ip-10-0-1-5.us-east-2.compute.internal workload=frontend
```

Frontend pods will schedule only on that node.

## Use both nodes

Label **both** nodes:

```bash
kubectl label nodes <NODE_1> workload=frontend
kubectl label nodes <NODE_2> workload=frontend
```

Then both nodes can run frontend pods (up to your replica count).

## Remove or change

To allow frontend on any node, remove the `nodeSelector` from `k8s/deployment.yaml`.  
To use another label, change `workload: frontend` in the deployment to your label key/value.
