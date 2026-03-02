# HTTPS with GoDaddy domain and EKS ALB

## 1. Request certificate in AWS ACM

1. In **AWS Console** → **Certificate Manager** (region = same as EKS, e.g. **ap-south-1**).
2. **Request a certificate**.
3. Choose **Request a public certificate**.
4. Add your domain, e.g. `app.yourdomain.com` or `yourdomain.com` (and `*.yourdomain.com` if you want a wildcard).
5. **Validation**: choose **DNS validation**.
6. ACM will show a **CNAME name** and **CNAME value** for each domain.

## 2. Validate domain in GoDaddy (DNS)

1. In **GoDaddy** → your domain → **DNS** / **Manage DNS**.
2. Add a **CNAME** record:
   - **Name**: use the ACM CNAME *name* (e.g. `_abc123.app.yourdomain.com` → often you only enter the subdomain part like `_abc123` if the zone is already yourdomain.com).
   - **Value**: the ACM CNAME *value* (e.g. `_xyz.acm-validations.aws.`).
   - **TTL**: 600 or default.
3. Save. Validation can take 5–30 minutes. In ACM, status will change to **Issued**.
4. Copy the **Certificate ARN** (e.g. `arn:aws:acm:ap-south-1:123456789012:certificate/...`).

## 3. Update Ingress with your domain and cert

Edit **`k8s/ingress.yaml`**:

- Replace `REPLACE_WITH_ACM_CERT_ARN` with your ACM certificate ARN.
- Replace `REPLACE_WITH_YOUR_DOMAIN` with your hostname (e.g. `app.yourdomain.com`).

Example:

```yaml
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-south-1:250560143950:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# ...
rules:
  - host: app.yourdomain.com
```

Apply:

```bash
kubectl apply -f k8s/ingress.yaml
```

## 4. Point GoDaddy to the ALB

1. After the Ingress is applied, get the ALB hostname:
   ```bash
   kubectl get ingress -n frontend
   ```
   Note the **ADDRESS** (ALB DNS name).

2. In **GoDaddy** → **DNS**:
   - Add **CNAME**: Name = `app` (for app.yourdomain.com), Value = the ALB hostname (e.g. `k8s-frontend-xxxxx.ap-south-1.elb.amazonaws.com`).
   - Or for root domain (yourdomain.com): use GoDaddy’s “A record with ALIAS” or “Forwarding” if they support it; otherwise use a subdomain like `app.yourdomain.com` with CNAME.

3. Wait for DNS to propagate (up to 48 hours, often minutes).

## 5. Result

- **HTTP (80)** → ALB redirects to **HTTPS (443)**.
- **HTTPS (443)** → ALB terminates TLS with your ACM cert and forwards to the frontend service.

## Optional: Use GitHub variables (no ARN/domain in repo)

In **Settings → Secrets and variables → Actions → Variables** add:

- **`ACM_CERT_ARN`** = your ACM certificate ARN (e.g. `arn:aws:acm:ap-south-1:250560143950:certificate/...`)
- **`INGRESS_HOST`** = your hostname (e.g. `app.yourdomain.com`)

The pipeline will substitute these into `k8s/ingress.yaml` before apply. If either is missing, the Ingress is not applied (deploy still runs without HTTPS).
