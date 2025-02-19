#!/usr/bin/env bash
################################################
## Prerequisites
chmod +x /root/vultr-helper.sh
. /root/vultr-helper.sh
error_detect_on
install_cloud_init latest


################################################
## BrowserBox Specific Stuff, Starts Here! :)

export HOSTNAME="$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-hostname)"
export TOKEN="$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-token)"
export EMAIL="$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-email)"

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
  cd "/home/${username}" || cd "\$HOME"
  git clone https://github.com/BrowserBox/BrowserBox.git
  cd BrowserBox
  export INSTALL_DOC_VIEWER="true"
  # just trigger the install of the tls related tools so they are not needed to be installed later when we are running a background 
  # install task for doc viewer
  ./deploy-scripts/tls "$HOSTNAME"
  yes | ./deploy-scripts/global_install.sh "localhost" "vultr-marketplace-setup@dosyago.com"
EOF

su - "$username" <<EOF2 
  wait_for() {
    local command_to_check=\$1
    local max_wait=120  # Maximum wait time in seconds
    local interval=5  # Interval between checks in seconds

    # Start timer
    local start_time=\$(date +%s)

    echo "Waiting for \$command_to_check to become available..."

    # Wait for the command to become available
    while true; do
      if command -v \$command_to_check >/dev/null 2>&1; then
        echo "\$command_to_check is available now."
        break
      else
        local current_time=\$(date +%s)
        local elapsed=\$((current_time - start_time))

        if [ \$elapsed -ge \$max_wait ]; then
          echo "Timeout waiting for \$command_to_check to become available."
          exit 1
        fi

        # Wait for a specified interval before checking again
        sleep \$interval
      fi
    done
  }

  source "/home/${username}/.nvm/nvm.sh"
  cd "/home/${username}" || cd "\$HOME"
  cd BrowserBox
  export BB_USER_EMAIL="$EMAIL"
  ./deploy-scripts/wait_for_hostname.sh "$HOSTNAME"
  ./deploy-scripts/tls "$HOSTNAME"
  mkdir -p "/home/${username}/sslcerts"
  sudo ./deploy-scripts/cp_certs "$HOSTNAME" "/home/${username}/sslcerts"
  sudo mkdir -p "/usr/local/share/dosyago/sslcerts"
  sudo ./deploy-scripts/cp_certs "$HOSTNAME" "/usr/local/share/dosaygo/sslcerts"
  wait_for setup_bbpro
  wait_for bbpro
  setup_bbpro --port 8080 --token "$TOKEN"
  bbpro
  pm2 save

  # Function to extract the 'sudo env' line from pm2 startup command output
  extract_pm2_startup_command() {
    local output=\$(pm2 startup)
    local sudo_line=\$(echo "\$output" | grep -v '^\[PM2\]' | awk '/^sudo env/')
    echo "\$sudo_line"
  }

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

exit 0

