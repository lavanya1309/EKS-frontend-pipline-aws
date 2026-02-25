# GitHub Actions ↔ AWS (EKS + ECR) – what to do now

No access/secret keys. Use **OIDC**: GitHub gets a short-lived token and assumes an IAM role.

---

## In AWS (do first)

### 1. OIDC identity provider (one-time per account)

- **IAM** → **Identity providers** → **Add provider**
- **Provider URL:** `https://token.actions.githubusercontent.com`
- **Audience:** `sts.amazonaws.com`
- Save

### 2. ECR repository

- **ECR** → **Create repository** → name e.g. `frontend-data-validation`
- Note the repo name (used in GitHub variable)

### 3. IAM role for the pipeline

- **IAM** → **Roles** → **Create role**
- **Trusted entity:** Web identity
  - **Identity provider:** `token.actions.githubusercontent.com`
  - **Audience:** `sts.amazonaws.com`
  - **Condition** (replace with your org/repo):
    - `token.actions.githubusercontent.com:sub` → `repo:YOUR_GITHUB_ORG/REPO_NAME:*`
- **Permissions:** attach
  - `AmazonEC2ContainerRegistryPowerUser` (or custom ECR push)
  - Custom inline policy for EKS:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "eks:DescribeCluster",
      "Resource": "arn:aws:eks:YOUR_REGION:YOUR_ACCOUNT_ID:cluster/YOUR_CLUSTER_NAME"
    }
  ]
}
```

- Create role → copy **Role ARN** (e.g. `arn:aws:iam::123456789012:role/github-eks-frontend`)

### 4. Allow the role inside EKS (aws-auth)

- On your laptop (with `kubectl` pointing at the cluster):
  - `kubectl edit configmap aws-auth -n kube-system`
- Under `mapRoles:` add:

```yaml
- rolearn: arn:aws:iam::YOUR_ACCOUNT_ID:role/github-eks-frontend
  username: github-pipeline
  groups:
    - system:masters
```

- Save and exit. Without this, deploy workflow will get "Forbidden".

---

## In GitHub (repo settings)

- Repo → **Settings** → **Secrets and variables** → **Actions**

**Variables:**

| Name              | Example value        |
|-------------------|----------------------|
| `AWS_REGION`      | `ap-south-1`         |
| `ECR_REPOSITORY`  | `frontend-data-validation` |
| `EKS_CLUSTER_NAME`| your cluster name    |
| `EKS_NAMESPACE`   | `production` or `default` |

**Secrets:**

| Name           | Value                    |
|----------------|--------------------------|
| `AWS_ROLE_ARN` | the IAM role ARN from step 3 |

Do **not** add `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`.

---

## Verify

1. Push to `main` → **Build and Push to ECR** should run and push images.
2. **Actions** → **Deploy to EKS** → **Run workflow** → enter `image_tag` (e.g. `v1-latest`) → run. Deployment should update the cluster.
