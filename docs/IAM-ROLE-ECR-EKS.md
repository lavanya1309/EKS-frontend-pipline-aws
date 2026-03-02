# IAM role permissions for ECR + EKS (GitHub OIDC)

Use one IAM role for the pipeline with permissions for both ECR (push image) and EKS (get cluster access for deploy).

---

## 1. Trust policy (who can assume this role)

Create role → **Trusted entity**: Web identity  
**Identity provider:** `token.actions.githubusercontent.com`  
**Audience:** `sts.amazonaws.com`

**Trust policy JSON** (optional condition = only your repo can assume):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::250560143950:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/aws-codepipline-frontend-data-validation-tracker:*"
        }
      }
    }
  ]
}
```

Replace `YOUR_GITHUB_ORG` with your GitHub org or username (e.g. `mycompany` or `john-doe`).

---

## 2. Permissions policy (ECR + EKS)

Create a custom policy, attach it to the role. Replace:

- `250560143950` = your AWS account ID  
- `us-east-1` = region where ECR and EKS live (change if different)  
- `frontend-data-validation-tracker` = ECR repository name  
- `your-eks-cluster-name` = EKS cluster name  

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:250560143950:repository/frontend-data-validation-tracker"
    },
    {
      "Sid": "EKSDescribe",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": [
        "arn:aws:eks:us-east-1:250560143950:cluster/your-eks-cluster-name",
        "arn:aws:eks:us-east-1:250560143950:cluster/*"
      ]
    }
  ]
}
```

- **ECR:** push and list images in that repository.  
- **EKS:** get cluster endpoint and CA so `aws eks update-kubeconfig` / kubectl can talk to the cluster. The role does **not** get Kubernetes permissions from this policy; that comes from **EKS auth** (step 3).

---

## 3. EKS cluster: allow the role to use kubectl (aws-auth)

The IAM role must be mapped in the EKS cluster so it can create/update resources (e.g. Deployment).

**Get current aws-auth:**

```bash
kubectl get configmap aws-auth -n kube-system -o yaml
```

**Add this under `mapRoles`** (merge with existing entries; do not remove existing roles):

```yaml
mapRoles:
  # existing entries...
  - rolearn: arn:aws:iam::250560143950:role/YOUR_GITHUB_OIDC_ROLE_NAME
    username: github-actions
    groups:
      - system:masters
```

- Replace `YOUR_GITHUB_OIDC_ROLE_NAME` with the name of the IAM role you created for GitHub OIDC.  
- `system:masters` = full admin. For less power, use a dedicated group and RBAC (see below).

**Apply:**

```bash
kubectl apply -f aws-auth-edited.yaml
```

**Optional – restrict to one namespace:**  
Use a dedicated group instead of `system:masters`, then create a RoleBinding in the `frontend` namespace that grants that group `edit` or `admin` only in that namespace.

---

## Summary

| Purpose              | Where                         | What to set |
|----------------------|-------------------------------|-------------|
| Who can assume role  | IAM role trust policy         | OIDC provider + optional `sub` condition |
| ECR push             | IAM role permissions policy   | `ecr:GetAuthorizationToken` + ECR repo actions |
| EKS kubeconfig       | IAM role permissions policy   | `eks:DescribeCluster` (and optionally `ListClusters`) |
| EKS kubectl/deploy   | EKS cluster `aws-auth` ConfigMap | Map role ARN to a user/group with RBAC (e.g. `system:masters` or namespace-scoped role) |

**GitHub variable:**  
`AWS_ROLE_ARN` = full ARN of this role, e.g. `arn:aws:iam::250560143950:role/github-oidc-ecr-eks`
