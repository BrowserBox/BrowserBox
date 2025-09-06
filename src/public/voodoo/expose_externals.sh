#!/usr/bin/env bash

protecc_win_sysadmins() {
    # Check for Windows environments
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" || -n "$WINDIR" || "$(uname -s)" =~ ^MINGW || "$(uname -s)" =~ ^CYGWIN || -n "$WSL_DISTRO_NAME" ]]; then
        echo -e "Not running bash postinstall script on Windows."
        exit 0
    fi
}

# Call the function right away
protecc_win_sysadmins

#cp -r node_modules/bang.html/* .bang.html.snapshot/

# Find and delete all LICENSE files in .bang.html.snapshot to avoid any excuse for confusion with BB license as we save this useful view library in BB repo for posterity (DOSAYGO owns the library)
#find .bang.html.snapshot -type f -name "LICENSE" -delete

cp node_modules/simple-peer/simplepeer.min.js src/ 
cp node_modules/lucide-static/icons/*.svg assets/icons/
