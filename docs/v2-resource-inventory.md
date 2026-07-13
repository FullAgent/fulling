# v2 Kubernetes Resource Inventory

The v3 foundation does not migrate v2 database records and does not delete
Kubernetes resources created by v2. Complete this inventory before resetting the
Fulling database, because the old database contains the ownership and naming
information needed to clean up those resources.

## Procedure

1. Stop every v2 application instance and reconciliation worker.
2. Export the old PostgreSQL database and retain it according to the deployment's
   backup policy.
3. Record every user kubeconfig and project namespace without placing credential
   content in tickets, logs, or chat.
4. For each affected namespace, inventory:
   - Deployments and StatefulSets
   - Services and Ingresses
   - PersistentVolumeClaims
   - Secrets and ConfigMaps
   - ServiceAccounts, Roles, and RoleBindings
   - KubeBlocks Cluster resources and related backups
5. Record the resource owner, cleanup decision, expected ongoing cost, and person
   responsible for cleanup.
6. Confirm the inventory with the operator responsible for the cluster.
7. Only then deploy the v3 baseline to a new or explicitly reset database.

Do not assume that deleting a v2 PostgreSQL row removed the corresponding
Kubernetes object. Retain the inventory until every resource has been adopted or
removed through an operator-approved process.
