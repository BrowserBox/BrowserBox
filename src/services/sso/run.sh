#!/bin/bash

# Start the SSO portal service with PM2
pm2 start service.js --name browserbox-sso-portal

# Optional: Save the process list for auto-restart on boot (uncomment if needed)
pm2 save
