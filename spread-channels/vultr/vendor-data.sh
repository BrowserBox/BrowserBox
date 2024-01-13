#!/bin/bash
################################################
## Prerequisites
chmod +x /root/vultr-helper.sh
. /root/vultr-helper.sh
error_detect_on
install_cloud_init latest


################################################
## BrowserBox Specific Stuff, Starts Here! :)

export HOSTNAME="$(curl -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/hostname)"
export TOKEN="$(curl -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/token)"
export EMAIL="$(curl -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/email)"

get_distro() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "$ID"
  else
    echo "Distribution not supported" >&2
    shutdown now &
    exit 1
  fi
}

# Update and install git non-interactively
distro=$(get_distro)
case $distro in
  debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
    export DEBIAN_FRONTEND=noninteractive
    export NEEDRESTART_SUSPEND=1
    export NEEDRESTART_MODE=a
    apt-get update && apt-get -y upgrade
    apt-get install -y git
    ;;
  centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
    yum update -y
    yum install -y git
    ;;
  *)
    echo "Unsupported distribution: $distro"
    shutdown now & 
    exit 1
    ;;
esac

# Function to add a user non-interactively
add_user() {
  local username=$1
  local distro=$(get_distro)
  case $distro in
    debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
      adduser --gecos "" --disabled-password "$username"
      ;;
    centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
      adduser "$username"
      passwd -d "$username"
      ;;
    *)
      echo "Unsupported distribution: $distro" >&2
      return 1
      ;;
  esac
}

# Create a new user and add to sudoers
username="pro"
if ! id "$username" &>/dev/null; then
  add_user "$username"
  echo "$username ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$username
  chmod 0440 /etc/sudoers.d/$username
fi

# Switch to the new user and run the scripts
su - "$username" <<EOF
  cd "/home/${username}" || cd "$HOME"
  git clone https://github.com/BrowserBox/BrowserBox.git
  cd BrowserBox
  export INSTALL_DOC_VIEWER="true"
  yes | ./deploy-scripts/global_install.sh "localhost" "vultr-marketplace-setup@dosyago.com"
EOF


# Create setup-per-instance.sh with nested heredoc to run as our BrowserBox power user
cat <<EOF_OUTER > /root/setup-per-instance.sh
  #!/bin/bash
  # Switch to the new user and run the scripts
  su - "$username" <<'EOF2'  
    cd "/home/${username}" || cd "\$HOME"
    cd BrowserBox
    export BB_USER_EMAIL="$EMAIL"
    ./deploy-scripts/wait_for_hostname.sh "$HOSTNAME"
    ./deploy-scripts/tls "$HOSTNAME"
    mkdir -p "/home/${username}/sslcerts"
    sudo ./deploy-scripts/cp_certs "$HOSTNAME" "/home/${username}/sslcerts"
    setup_bbpro --port 8080 --token "$TOKEN"
    bbpro
    pm2 save

    # Function to extract the 'sudo env' line from pm2 startup command output
    extract_pm2_startup_command() {
      local output=\$(pm2 startup)
      local sudo_line=\$(echo "\$output" | grep -v '^\[PM2\]' | awk '/^sudo env/')
      echo "\$sudo_line"
    }

    # Main script execution
    # Extract the command
    command_line=\$(extract_pm2_startup_command)

    if [ -n "\$command_line" ]; then
      echo "Executing: \$command_line"
      # Execute the extracted command
      eval \$command_line
      echo "BrowserBox installed to be 'always on' and run every startup"
    else
      echo "No command line found to execute."
    fi
  EOF2
EOF_OUTER

################################################
## Install provisioning scripts
mkdir -p /var/lib/cloud/scripts/per-boot/
mkdir -p /var/lib/cloud/scripts/per-instance/

#mv /root/setup-per-boot.sh /var/lib/cloud/scripts/per-boot/setup-per-boot.sh
mv /root/setup-per-instance.sh /var/lib/cloud/scripts/per-instance/setup-per-instance.sh

#chmod +x /var/lib/cloud/scripts/per-boot/setup-per-boot.sh
chmod +x /var/lib/cloud/scripts/per-instance/setup-per-instance.sh

################################################
## Prepare server for Marketplace snapshot

clean_system
