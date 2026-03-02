# IAM role permissions for ECR + EKS (GitHub OIDC)

Use one IAM role for the pipeline with permissions for both ECR (push image) and EKS (get cluster access for deploy).  
**If deploy fails with "the server has asked for the client to provide credentials"** → grant the OIDC role access to the cluster using either **EKS Access Entries** (Section 3a, no aws-auth) or the **aws-auth** ConfigMap (Section 3b).

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
- `ap-south-1` = region where ECR repo lives (change if different)  
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
      "Sid": "ECRCreate",
      "Effect": "Allow",
      "Action": "ecr:CreateRepository",
      "Resource": "arn:aws:ecr:ap-south-1:250560143950:repository/frontend-data-validation-tracker"
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
      "Resource": "arn:aws:ecr:ap-south-1:250560143950:repository/frontend-data-validation-tracker"
    },
    {
      "Sid": "EKSDescribe",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": [
        "arn:aws:eks:ap-south-1:250560143950:cluster/YOUR_EKS_CLUSTER_NAME",
        "arn:aws:eks:ap-south-1:250560143950:cluster/*"
      ]
    }
  ]
}
```

- **ECR:** push and list images in that repository.  
- **EKS:** get cluster endpoint and CA so `aws eks update-kubeconfig` / kubectl can talk to the cluster. The role does **not** get Kubernetes permissions from this policy; that comes from **EKS auth** (step 3).

---

## 3a. EKS Access Entries (alternative — no aws-auth)

Use this if your cluster supports Access Entries (EKS 1.23+) and you prefer not to create or edit the aws-auth ConfigMap. Run these from your laptop (or any client) with an IAM user/role that can manage the cluster (e.g. cluster creator or an admin with `eks:UpdateClusterConfig`, `eks:CreateAccessEntry`, `eks:AssociateAccessPolicy`).

**1. Enable Access Entries on the cluster** (one-time; use your cluster name and region):

```bash
aws eks update-cluster-config --name eks-cluster --access-config authenticationMode=API_AND_CONFIG_MAP --region ap-south-1
```

Wait until the cluster status is Active again (EKS console or `aws eks describe-cluster --name eks-cluster --region ap-south-1 --query 'cluster.status'`).

**2. Create an access entry for the GitHub OIDC role** (replace the role ARN with your `vars.AWS_ROLE_ARN`):

```bash
aws eks create-access-entry \
  --cluster-name eks-cluster \
  --principal-arn arn:aws:iam::250560143950:role/YOUR_GITHUB_OIDC_ROLE_NAME \
  --type STANDARD \
  --region ap-south-1
```

**3. Give that role cluster-admin so the pipeline can deploy:**

```bash
aws eks associate-access-policy \
  --cluster-name eks-cluster \
  --principal-arn arn:aws:iam::250560143950:role/YOUR_GITHUB_OIDC_ROLE_NAME \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region ap-south-1
```

After this, the pipeline (using that OIDC role) can run `kubectl` against the cluster. No aws-auth needed. Your existing node group continues to work (EKS manages node role access when using managed node groups).

---

## 3b. EKS cluster: allow the OIDC role via aws-auth (required if not using Access Entries)

Without this, you get: **"the server has asked for the client to provide credentials"**.  
EKS uses **aws-auth** to map IAM roles to Kubernetes users; the GitHub OIDC role must be listed there.

**Step A – Get the role ARN**  
Same as `vars.AWS_ROLE_ARN` in GitHub, e.g. `arn:aws:iam::250560143950:role/github-oidc-ecr-eks`.

**Step B – Edit aws-auth** (from a machine that already has kubectl access to the cluster, e.g. your laptop with `aws eks update-kubeconfig`):

```bash
kubectl get configmap aws-auth -n kube-system -o yaml > aws-auth.yaml
```

Open `aws-auth.yaml`. Find **`data.mapRoles`** (a multi-line string). Add this **new entry** to the list (keep all existing entries):

```yaml
    - rolearn: arn:aws:iam::250560143950:role/YOUR_GITHUB_OIDC_ROLE_NAME
      username: github-actions
      groups:
        - system:masters
```

- Replace `YOUR_GITHUB_OIDC_ROLE_NAME` with the IAM role name you use for GitHub OIDC (same role as `vars.AWS_ROLE_ARN`, e.g. `github-oidc-ecr-eks`).  
- Use your account ID if different from `250560143950`.

**Step C – Apply:**

```bash
kubectl apply -f aws-auth.yaml
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
| EKS kubectl/deploy   | EKS Access Entries (3a) or `aws-auth` ConfigMap (3b) | Add OIDC role via Access Entries (no ConfigMap) or add role to aws-auth |

**GitHub variable:**  
`AWS_ROLE_ARN` = full ARN of this role, e.g. `arn:aws:iam::250560143950:role/github-oidc-ecr-eks`
