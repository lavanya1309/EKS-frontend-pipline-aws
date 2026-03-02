# GitHub OIDC → AWS (no access keys)

Pipeline uses **OIDC**: GitHub gets short-lived credentials from AWS. No long-lived access/secret keys in GitHub.

## 1. Create OIDC identity provider in IAM

- IAM → Identity providers → Add provider
- Provider type: **OpenID Connect**
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com` (or leave default)

## 2. Create IAM role for GitHub

- IAM → Roles → Create role
- Trusted entity: **Web identity**
- Identity provider: `token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`
- Conditions (optional but recommended):

```json
{
  "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
  "StringLike": { "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/aws-codepipline-frontend-data-validation-tracker:*" }
}
```

Replace `YOUR_ORG` with your GitHub org or username.

- Attach policy that allows ECR push, e.g.:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
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
      "Resource": "arn:aws:ecr:REGION:ACCOUNT_ID:repository/REPO_NAME"
    }
  ]
}
```

Replace REGION, ACCOUNT_ID, REPO_NAME (e.g. `frontend-data-validation-tracker`).

## 3. Create ECR repository

- ECR → Create repository → name: `frontend-data-validation-tracker` (or match `ECR_REPOSITORY` in workflow)

## 4. GitHub repo configuration

- Repo → Settings → Secrets and variables → Actions → **Variables**
- Add variable: `AWS_ROLE_ARN` = full ARN of the IAM role (e.g. `arn:aws:iam::123456789012:role/github-oidc-ecr`)

Workflow uses `vars.AWS_ROLE_ARN` to assume this role. No secrets needed.
