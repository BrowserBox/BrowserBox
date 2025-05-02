# Sign-ExeWithAzureSignTool.ps1
# PowerShell script to sign an executable using Azure Sign Tool with Azure Key Vault.

param (
    [Parameter(Mandatory=$true, HelpMessage="Path to the executable to sign (e.g., .\winget-script.exe)")]
    [string]$ExePath,

    [Parameter(Mandatory=$true, HelpMessage="Azure Key Vault name")]
    [string]$KeyVaultName,

    [Parameter(Mandatory=$false, HelpMessage="Azure subscription ID. If not provided, the active subscription will be used.")]
    [string]$SubscriptionId,

    [Parameter(Mandatory=$false, HelpMessage="Azure resource group name. If not provided, it will be fetched from the Key Vault.")]
    [string]$ResourceGroup,

    [Parameter(Mandatory=$false, HelpMessage="Certificate name in Key Vault. If not provided, available certificates will be listed.")]
    [string]$CertificateName,

    [Parameter(Mandatory=$false, HelpMessage="Service principal appId (client ID). If not provided, a new SPN will be created.")]
    [string]$AppId,

    [Parameter(Mandatory=$false, HelpMessage="Service principal password (client secret). Required if AppId is provided.")]
    [string]$Password,

    [Parameter(Mandatory=$false, HelpMessage="Tenant ID. Required if AppId is provided.")]
    [string]$Tenant
)

# Function to display usage and exit
function Show-Usage {
    Write-Host "Usage: .\Sign-ExeWithAzureSignTool.ps1 -ExePath <path-to-exe> -KeyVaultName <key-vault-name> [-SubscriptionId <subscription-id>] [-ResourceGroup <resource-group>] [-CertificateName <certificate-name>] [-AppId <appId> -Password <password> -Tenant <tenant>]"
    Write-Host "Parameters:"
    Write-Host "  -ExePath        : Path to the executable to sign (e.g., .\winget-script.exe)"
    Write-Host "  -KeyVaultName   : Azure Key Vault name"
    Write-Host "  -SubscriptionId : Azure subscription ID (optional; if not provided, the active subscription will be used)"
    Write-Host "  -ResourceGroup  : Azure resource group name (optional; if not provided, it will be fetched from the Key Vault)"
    Write-Host "  -CertificateName: Certificate name in Key Vault (optional; if not provided, available certificates will be listed)"
    Write-Host "  -AppId          : Service principal appId (client ID). If not provided, a new SPN will be created."
    Write-Host "  -Password       : Service principal password (client secret). Required if AppId is provided."
    Write-Host "  -Tenant         : Tenant ID. Required if AppId is provided."
    Write-Host "Example:"
    Write-Host "  .\Sign-ExeWithAzureSignTool.ps1 -ExePath .\winget-script.exe -KeyVaultName MyKeyVault"
    Write-Host "  .\Sign-ExeWithAzureSignTool.ps1 -ExePath .\winget-script.exe -KeyVaultName MyKeyVault -CertificateName MyCert -AppId <appId> -Password <password> -Tenant <tenant>"
    exit 1
}

# Validate required parameters
if (-not $ExePath -or -not $KeyVaultName) {
    Show-Usage
}

# Validate that if AppId is provided, Password and Tenant must also be provided
if ($AppId -and (-not $Password -or -not $Tenant)) {
    Write-Host "Error: If -AppId is provided, -Password and -Tenant must also be provided."
    Show-Usage
}

# Validate that the executable exists
if (-not (Test-Path $ExePath)) {
    Write-Host "Error: Executable not found at path: $ExePath"
    exit 1
}

# Get the subscription ID if not provided
if (-not $SubscriptionId) {
    Write-Host "Fetching the active Azure subscription..."
    $subscriptionOutput = & az account show | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to retrieve active subscription. Ensure 'az' CLI is installed and you are logged in with 'az login'."
        exit 1
    }

    $SubscriptionId = $subscriptionOutput.id
    Write-Host "Using active subscription ID: $SubscriptionId"
}

# Set the active subscription
Write-Host "Setting active subscription to: $SubscriptionId"
& az account set --subscription $SubscriptionId

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to set active subscription."
    exit 1
}

# Fetch Key Vault details (vaultUri and resource group)
Write-Host "Fetching Key Vault details for: $KeyVaultName"
$keyVaultOutput = & az keyvault show --name $KeyVaultName --subscription $SubscriptionId | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to retrieve Key Vault details. Ensure the Key Vault exists and you have access."
    exit 1
}

$KeyVaultUrl = $keyVaultOutput.properties.vaultUri
Write-Host "Key Vault URL: $KeyVaultUrl"

# Fetch resource group if not provided
if (-not $ResourceGroup) {
    $ResourceGroup = $keyVaultOutput.resourceGroup
    if (-not $ResourceGroup) {
        Write-Host "Error: Could not retrieve resource group from Key Vault details."
        exit 1
    }
    Write-Host "Using resource group: $ResourceGroup"
}

# Fetch certificate name if not provided
if (-not $CertificateName) {
    Write-Host "Fetching available certificates in Key Vault: $KeyVaultName"
    $certListOutput = & az keyvault certificate list --vault-name $KeyVaultName | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to list certificates in Key Vault."
        exit 1
    }

    if ($certListOutput.Count -eq 0) {
        Write-Host "Error: No certificates found in Key Vault: $KeyVaultName"
        exit 1
    }

    Write-Host "Available certificates:"
    $certListOutput | ForEach-Object {
        Write-Host "  - $($_.name)"
    }

    # Use the first certificate as default (or prompt the user to select one)
    $CertificateName = $certListOutput[0].name
    Write-Host "Using first available certificate: $CertificateName"
    Write-Host "You can specify a different certificate using the -CertificateName parameter."
}

# Static parameter for timestamp server
$TimestampServer = "http://timestamp.digicert.com"

# If AppId, Password, and Tenant are not provided, create a new service principal
if (-not $AppId) {
    Write-Host "Creating a new service principal..."
    $scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.KeyVault/vaults/$KeyVaultName"
    $spnOutput = & az ad sp create-for-rbac --name CodeSigningSP --role Contributor --scopes $scope | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create service principal. Ensure 'az' CLI is installed and you are logged in."
        exit 1
    }

    $AppId = $spnOutput.appId
    $Password = $spnOutput.password
    $Tenant = $spnOutput.tenant

    Write-Host "Service principal created successfully."
    Write-Host "AppId: $AppId"
    Write-Host "Password: $Password"
    Write-Host "Tenant: $Tenant"
}

# Grant permissions to the service principal
Write-Host "Granting permissions to the service principal..."
$policyOutput = & az keyvault set-policy --name $KeyVaultName --spn $AppId --key-permissions sign --certificate-permissions get

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to set Key Vault policy. Ensure you have sufficient permissions."
    exit 1
}

Write-Host "Permissions granted successfully."

# Sign the executable using Azure Sign Tool
Write-Host "Signing the executable: $ExePath"
$signCommand = "AzureSignTool sign -kvu $KeyVaultUrl -kvi $AppId -kvs $Password -kvt $Tenant -kvc $CertificateName -tr $TimestampServer -v $ExePath"
$signOutput = Invoke-Expression $signCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to sign the executable. Output:"
    Write-Host $signOutput
    exit 1
}

Write-Host "Executable signed successfully."
Write-Host $signOutput

# Verify the signature using signtool.exe
Write-Host "Verifying the signature..."
$signtoolPath = "signtool.exe" # Adjust this path if signtool.exe is not in PATH (e.g., "C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\signtool.exe")
$verifyOutput = & $signtoolPath verify /pa $ExePath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Signature verification failed. Output:"
    Write-Host $verifyOutput
    exit 1
}

Write-Host "Signature verified successfully."
Write-Host $verifyOutput
