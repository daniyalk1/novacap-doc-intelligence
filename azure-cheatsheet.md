# Azure CLI & Deployment Cheatsheet
> Built during NovaCap Document Intelligence project — July 2026
> Notes on what worked, what failed, and why.

---

## 1. Azure CLI Setup & Login

### ✅ Check Azure CLI version
```bash
az --version
```

### ✅ Login to Azure
```bash
az login
```
Browser opens, sign in, subscription appears in terminal.

### ✅ Show current subscription
```bash
az account show --output table
```

### ✅ List all subscriptions
```bash
az account list --output table
```

### ✅ Set active subscription
```bash
az account set --subscription "your-subscription-id"
```

---

## 2. Resource Groups

### ✅ Create a resource group
```bash
az group create --name danyal-dev-rg --location eastus
```

### ✅ List all resource groups
```bash
az group list --output table
```

---

## 3. Resource Provider Registration
> Required before creating any Azure resource for the first time on a subscription.

### ✅ Register a provider
```bash
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.ApiManagement
```

### ✅ Check registration status
```bash
az provider show --namespace Microsoft.Storage --query "registrationState"
```
Wait until it shows `"Registered"` before proceeding.

---

## 4. Azure Storage

### ✅ Create a storage account
```bash
az storage account create --name danyaldevstorage --resource-group danyal-dev-rg --location eastus --sku Standard_LRS
```

### ❌ Error: SubscriptionNotFound
```
(SubscriptionNotFound) Subscription was not found.
```
**Why:** `Microsoft.Storage` provider was not registered on the subscription.
**Fix:** Run `az provider register --namespace Microsoft.Storage` and wait for `"Registered"`.

---

## 5. RBAC Role Assignments
> Azure separates management plane (creating resources) from data plane (reading/writing data).
> DefaultAzureCredential requires explicit data plane roles.

### ✅ Assign Storage Blob Data Contributor to your user
```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope /subscriptions/YOUR_SUB_ID/resourceGroups/danyal-dev-rg/providers/Microsoft.Storage/storageAccounts/danyaldevstorage
```

### ✅ Assign Search Index Data Contributor to your user
```bash
az role assignment create \
  --role "Search Index Data Contributor" \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope /subscriptions/YOUR_SUB_ID/resourceGroups/danyal-dev-rg/providers/Microsoft.Search/searchServices/danyal-ai-search
```

### ✅ Assign roles to Service Principal (for Docker/production)
```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee YOUR_APP_ID \
  --scope /subscriptions/YOUR_SUB_ID/resourceGroups/danyal-dev-rg/providers/Microsoft.Storage/storageAccounts/danyaldevstorage

az role assignment create \
  --role "Search Index Data Contributor" \
  --assignee YOUR_APP_ID \
  --scope /subscriptions/YOUR_SUB_ID/resourceGroups/danyal-dev-rg/providers/Microsoft.Search/searchServices/danyal-ai-search
```

---

## 6. Azure AI Search

### ✅ Create via portal
Azure CLI doesn't support free tier AI Search creation reliably.
Go to portal.azure.com → search "AI Search" → Create → select Free tier.

### ❌ Error: AuthorizationPermissionMismatch on upload
```
azure.core.exceptions.HttpResponseError: Operation returned an invalid status 'Forbidden'
ErrorCode: AuthorizationPermissionMismatch
```
**Why:** DefaultAzureCredential authenticated fine but the user/app didn't have the data plane role.
**Fix:** Assign `Search Index Data Contributor` role (see section 5).

---

## 7. Python Azure SDK Issues

### ❌ Error: Cannot import ResourceManagementClient
```
ImportError: cannot import name 'ResourceManagementClient' from 'azure.mgmt.resource'
```
**Why:** In `azure-mgmt-resource` v26+, the class moved to a submodule.
**Fix:** Change import to:
```python
from azure.mgmt.resource.resources import ResourceManagementClient
```

### ❌ Error: azure.mgmt.resource.__file__ returns None
```python
python -c "import azure.mgmt.resource; print(azure.mgmt.resource.__file__)"
# Returns: None
```
**Why:** Azure CLI installs its own namespace package that shadows the venv package. Missing `__init__.py`.
**Fix:**
```bash
python -c "open('venv/Lib/site-packages/azure/mgmt/resource/__init__.py', 'w').write('')"
```

### ❌ Error: NullBytes in __init__.py
```
SyntaxError: source code string cannot contain null bytes
```
**Why:** PowerShell `echo "" > file.py` creates files with null bytes.
**Fix:** Always use Python to create empty files:
```bash
python -c "open('path/to/file.py', 'w').write('')"
```

---

## 8. Service Principal (for Production Auth)

### ✅ Create a Service Principal
```bash
az ad sp create-for-rbac --name "novacap-app" --role contributor \
  --scopes /subscriptions/YOUR_SUB_ID/resourceGroups/danyal-dev-rg
```
Output gives you: `appId`, `password`, `tenant`

Add to `.env`:
```
AZURE_CLIENT_ID=appId
AZURE_CLIENT_SECRET=password
AZURE_TENANT_ID=tenant
```

### ❌ Error: DefaultAzureCredential failed inside Docker
```
DefaultAzureCredential failed to retrieve a token.
AzureCliCredential: Azure CLI not found on path
```
**Why:** Docker container has no Azure CLI installed, so DefaultAzureCredential can't use CLI auth.
**Fix:** Create a Service Principal and pass credentials via environment variables in `.env`.

---

## 9. Docker

### ✅ Build Docker image
```bash
docker build -t novacap-backend .
```

### ✅ Run Docker container with env file
```bash
docker run -p 8000:8000 --env-file .env novacap-backend
```

### ❌ Error: Cannot connect to Docker daemon
```
ERROR: failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```
**Why:** Docker Desktop wasn't running.
**Fix:** Open Docker Desktop from Start menu, wait for whale icon to stop animating.

---

## 10. Azure Container Registry

### ✅ Create container registry
```bash
az acr create --name novacapregistry --resource-group danyal-dev-rg --sku Basic --admin-enabled true
```

### ✅ Login to registry
```bash
az acr login --name novacapregistry
```

### ✅ Tag and push image
```bash
docker tag novacap-backend novacapregistry.azurecr.io/novacap-backend:latest
docker push novacapregistry.azurecr.io/novacap-backend:latest
```

---

## 11. Azure Container Apps

### ✅ Create Container Apps environment
```bash
az containerapp env create --name novacap-env --resource-group danyal-dev-rg --location eastus
```
Creates a Log Analytics workspace automatically for observability.

### ✅ Deploy container app
```bash
az containerapp create \
  --name novacap-backend \
  --resource-group danyal-dev-rg \
  --environment novacap-env \
  --image novacapregistry.azurecr.io/novacap-backend:latest \
  --registry-server novacapregistry.azurecr.io \
  --registry-username novacapregistry \
  --registry-password $(az acr credential show --name novacapregistry --query "passwords[0].value" -o tsv) \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --env-vars AZURE_CLIENT_ID=x AZURE_CLIENT_SECRET=x AZURE_TENANT_ID=x ...
```

### ✅ Scale to zero (save costs)
```bash
az containerapp update --name novacap-backend --resource-group danyal-dev-rg --min-replicas 0
```
Container scales to zero when idle — near zero cost. Cold start takes ~5-10 seconds.

---

## 12. Azure Static Web Apps

### ✅ Create Static Web App
```bash
az staticwebapp create --name novacap-frontend --resource-group danyal-dev-rg --location eastus2 --sku Free
```

### ✅ Get deployment token
```bash
az staticwebapp secrets list --name novacap-frontend --query "properties.apiKey" -o tsv
```

### ✅ Build and deploy frontend
```bash
# Build React app first
npm run build

# Deploy to Static Web Apps
swa deploy ./dist --deployment-token YOUR_TOKEN --env production
```

---

## 13. Azure APIM

### ✅ Create APIM instance (Consumption tier)
```bash
az apim create \
  --name novacap-apim \
  --resource-group danyal-dev-rg \
  --publisher-email "your@email.com" \
  --publisher-name "Your Name" \
  --sku-name Consumption
```
Consumption tier provisions in seconds. Standard/Developer tier takes 30-40 minutes.

### ✅ Register backend API in APIM
```bash
az apim api create \
  --resource-group danyal-dev-rg \
  --service-name novacap-apim \
  --api-id novacap-api \
  --display-name "NovaCap Document Intelligence API" \
  --path "novacap" \
  --protocols https \
  --service-url "https://your-backend.azurecontainerapps.io"
```

### ✅ Add API operations
```bash
az apim api operation create --resource-group danyal-dev-rg --service-name novacap-apim --api-id novacap-api --operation-id upload --display-name "Upload Document" --method POST --url-template "/api/upload"

az apim api operation create --resource-group danyal-dev-rg --service-name novacap-apim --api-id novacap-api --operation-id search --display-name "Search Documents" --method GET --url-template "/api/search"

az apim api operation create --resource-group danyal-dev-rg --service-name novacap-apim --api-id novacap-api --operation-id chat --display-name "Chat" --method POST --url-template "/api/chat"
```

### ❌ az apim api policy — DOES NOT EXIST
```bash
az apim api policy create ...  # This command does not exist in Azure CLI
```
**Why:** Azure CLI doesn't support APIM policy management. It's a known gap.
**Fix:** Use the Azure Portal → APIM → APIs → All Operations → Policies → paste XML directly.

### ❌ rate-limit-by-key not allowed on Consumption tier
```
Error: Policy is not allowed in 'Consumption' sku
```
**Why:** `rate-limit-by-key` and `quota-by-key` require Standard or Premium tier.
**Fix:** Use basic `rate-limit` instead:
```xml
<policies>
  <inbound>
    <base />
    <rate-limit calls="10" renewal-period="60" />
  </inbound>
  <backend><base /></backend>
  <outbound><base /></outbound>
  <on-error><base /></on-error>
</policies>
```

### ✅ Test APIM endpoint via PowerShell
```powershell
Invoke-RestMethod -Uri "https://novacap-apim.azure-api.net/novacap/api/chat" -Method POST -ContentType "application/json" -Body '{"question": "what is this document about?"}'
```

---

## 14. Git & GitHub

### ❌ Never commit these files
```
venv/
.env
__pycache__/
*.pyc
node_modules/
```
Always add to `.gitignore` before first commit.

### ❌ GitHub blocked push due to exposed secret
```
remote: - Push cannot contain secrets
remote: —— OpenAI API Key ————————————————
```
**Why:** .env file was committed with API key inside.
**Fix:**
```bash
git rm --cached .env
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all
git push origin main --force
```
**Also:** Immediately rotate the exposed API key.

---

## Key Concepts Learned

| Concept | What it means |
|---|---|
| Management plane vs data plane | Creating a resource vs reading/writing its data — require separate RBAC roles |
| DefaultAzureCredential | Uses CLI locally, Service Principal in production — same code both environments |
| Service Principal | App identity with scoped permissions — needed when no human is logging in |
| RBAC | Role-Based Access Control — every Azure service needs explicit data roles |
| Container Apps min-replicas 0 | Scales to zero when idle, saves cost, ~5-10s cold start |
| APIM Consumption tier | Serverless APIM, cheap, but missing some policy types available in paid tiers |
| Provider registration | Every Azure service namespace must be registered on a subscription before first use |
