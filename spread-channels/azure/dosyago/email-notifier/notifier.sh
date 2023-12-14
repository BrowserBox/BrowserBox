#!/bin/bash

adminUsername=$1  # Assuming the first argument is the admin username
region="${2//[[:space:]]/}"
resourceId="${3//[[:space:]]/}"
connectionString="${4//[[:space:]]/}"

# Outer heredoc starts here
sudo -u "$adminUsername" bash -s "$region" "$resourceId" "$connectionString" <<'EOF'
# Inner script starts after this line

# Parameters received from outer script
region="$1"
resourceId="$2"
connectionString="$3"

# Logging
echo "Region: [$region]"
echo "ResourceID: [$resourceId]"

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_SUSPEND=1
export NEEDRESTART_MODE=a

# Install jq if not present
command -v jq || sudo apt install -y jq

sleep 5

# Install Node.js using nvm
cd $HOME
touch $HOME/.bashrc
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source $HOME/.nvm/nvm.sh
nvm install node

# Create and navigate to the application directory
mkdir test-app
cd test-app

# Initialize a new Node.js project
npm init -y

# Install Application Insights
npm i --save applicationinsights

# Export the connection string to an environment variable
export APPINSIGHTS_CONNECTIONSTRING="$connectionString"

# Create a Node.js script using a heredoc
cat << 'INNER_EOF' > app.js
const appInsights = require('applicationinsights');
appInsights.setup().start();

const client = appInsights.defaultClient;

// Example URL for the login link
const loginLinkUrl = "https://example.com/login?token=abc123";

// Sending a custom event
client.trackEvent({name: "LoginLink", properties: {url: loginLinkUrl}});

console.log('Custom event sent to Application Insights');
INNER_EOF

# Run the Node.js script
node app.js

# End of the inner script
EOF
# End of the outer heredoc

exit 0

