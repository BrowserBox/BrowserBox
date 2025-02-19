#!/usr/bin/env bash

# killing bundling for now until work out babel issue
# "Cannot find preset babel/env relative to directory public"
#./install_bundle_deps.sh

rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix

cd zombie-lord 
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix
cd ../

cd public/voodoo
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix
cd ../../

cd zombie-lord/custom-launcher
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix
cd ../../

cd parec-server
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix
cd ../

cd crdp-secure-proxy-server
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix
cd ../

cd pptr-console-server
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix
cd websocket_chat_app
rm -rf node_modules && rm package-lock.json && npm upgrade && npm audit fix

cd ../../

npm i

#./make_bundle.sh

