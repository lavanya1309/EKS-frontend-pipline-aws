# AWS setup first – then pipeline (EKS + ECR, no access keys)

Do these in AWS **before** enabling the GitHub Actions pipeline. Pipeline uses **OIDC** (no access/secret keys in GitHub).

---

## 1. EKS cluster

- Create EKS cluster (console or Terraform/CloudFormation).
- Ensure node groups exist and **kubectl** can connect (`aws eks update-kubeconfig --name <cluster> --region <region>`).
- Install **AWS Load Balancer Controller** on the cluster (for Ingress/ALB).

---

## 2. ECR repository

- **ECR** → Create repository → e.g. `frontend-data-validation`.
- Note: **URI** = `{account}.dkr.ecr.{region}.amazonaws.com/frontend-data-validation`.

Images will be tagged **v1**, **v2**, **v3** (immutable) and **vN-latest** (current).

---

## 3. GitHub OIDC in AWS (no access keys)

### 3.1 Create OIDC identity provider

- **IAM** → **Identity providers** → **Add provider**.
- **Provider type**: OpenID Connect.
- **Provider URL**: `https://token.actions.githubusercontent.com`
- **Audience**: `sts.amazonaws.com`
- Create.

### 3.2 Create IAM role for the pipeline

- **IAM** → **Roles** → **Create role**.
- **Trusted entity**: Web identity.
- **Identity provider**: `token.actions.githubusercontent.com`.
- **Audience**: `sts.amazonaws.com`.
- **Conditions** (optional but recommended):

```json
{
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
  },
  "StringLike": {
    "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/aws-codepipline-frontend-data-validation-tracker:*"
  }
}
```

Replace `YOUR_ORG` with your GitHub org or username.

- Attach policies (or create custom):
  - **ECR**: push/pull (e.g. `AmazonEC2ContainerRegistryPowerUser` or custom ECR push for this repo).
  - **EKS**: allow `eks:DescribeCluster` (for `aws eks get-token`). Restrict to your cluster ARN in the policy if needed.
- Create role and note the **Role ARN** (e.g. `arn:aws:iam::123456789012:role/github-eks-frontend-pipeline`).

### 3.3 Let the pipeline role access EKS (aws-auth)

The role above can call `eks:DescribeCluster`, but **kubectl** needs the role to be allowed **inside** the cluster. Edit the EKS **aws-auth** ConfigMap and add a mapRoles entry so this IAM role can authenticate as a Kubernetes user that can update deployments, e.g.:

```yaml
- rolearn: arn:aws:iam::YOUR_ACCOUNT:role/github-eks-frontend-pipeline
  username: github-pipeline
  groups:
    - system:masters
```

Apply with `kubectl edit configmap aws-auth -n kube-system` (or apply a YAML). Without this, `kubectl set image` will get "Forbidden".

---

## 4. GitHub repo settings (no secrets for keys)

- In the repo: **Settings** → **Secrets and variables** → **Actions**.
- Add **variables** (not secrets if you prefer):
  - `AWS_REGION` (e.g. `ap-south-1`).
  - `ECR_REPOSITORY` (e.g. `frontend-data-validation`).
  - `EKS_CLUSTER_NAME`.
  - `EKS_NAMESPACE` (e.g. `production`).
- Add **one secret** (sensitive):
  - `AWS_ROLE_ARN` = the IAM role ARN from step 3.2 (pipeline will assume this via OIDC; no access key).

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`.

---

## 5. Order summary

| Order | What |
|-------|------|
| 1 | EKS cluster + node groups + Load Balancer Controller |
| 2 | ECR repository for frontend image |
| 3 | IAM OIDC provider + IAM role for GitHub (ECR + EKS) |
| 4 | GitHub variables + `AWS_ROLE_ARN` secret |
| 5 | Run pipeline (build → tag vN, vN-latest → push ECR → deploy EKS) |

After step 5, each pipeline run uses **OIDC** to assume the role and get short-lived credentials; no long-lived keys in GitHub.
