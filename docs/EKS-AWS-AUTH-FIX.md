# Fix: kubectl "server has asked for the client to provide credentials"

The GitHub Actions role can call AWS (DescribeCluster) but the **EKS cluster** does not allow that role to run kubectl. Add the role to **aws-auth** so the cluster trusts it.

---

## Step 1: Get your GitHub Actions role ARN

Same value as in GitHub secret **AWS_ROLE_ARN**, e.g.:
`arn:aws:iam::250560143950:role/YOUR-ROLE-NAME`

---

## Step 2: Edit aws-auth on the cluster

From a machine where **kubectl** already works (e.g. your laptop with `aws eks update-kubeconfig` done):

```bash
kubectl edit configmap aws-auth -n kube-system
```

---

## Step 3: Add this block under mapRoles

Find the `mapRoles:` section. Add this entry (replace the role ARN with yours):

```yaml
mapRoles: |
  - rolearn: arn:aws:iam::250560143950:role/YOUR-GITHUB-ACTIONS-ROLE-NAME
    username: github-actions
    groups:
      - system:masters
```

If there are already entries, add the new block as another list item, e.g.:

```yaml
mapRoles:
  - rolearn: arn:aws:iam::250560143950:role/eks-node-role
    username: system:node:{{EC2PrivateDNSName}}
    groups:
      - system:bootstrappers
      - system:nodes
  - rolearn: arn:aws:iam::250560143950:role/YOUR-GITHUB-ACTIONS-ROLE-NAME
    username: github-actions
    groups:
      - system:masters
```

Save and exit (`:wq` in vim, or Ctrl+X then Y in nano).

---

## Step 4: Re-run the workflow

Run the Build and Push to EKS workflow again. The deploy step should succeed.
