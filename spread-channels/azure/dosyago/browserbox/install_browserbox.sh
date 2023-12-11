#!/bin/bash
#set -xeo pipefail
set -x

# Parameters passed from ARM template
USEREMAIL=$1
HOSTNAME=$2
TOKEN=$3
INSTALL_DOC_VIEWER=$4
UNDERSTANDING=$5

# Function to determine the Linux Distribution
get_distro() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "$ID"
  else
    echo "Distribution not supported" >&2
    exit 1
  fi
}

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

# Check if essential fields are present
if [ -z "$HOSTNAME" ] || [ -z "$USEREMAIL" ]; then
  echo "Both 'HOSTNAME' and 'USEREMAIL' are required to proceed." >&2
  exit 1
fi

# Update and install git non-interactively
distro=$(get_distro)
case $distro in
  debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update && apt-get -y upgrade
    apt-get install -y git
    ;;
  centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
    # the following line (exclude) is necessary at least on CentOS because otherwise
    # the WA agent has an error when the script it is running tries to update the WA agent. :)
    yum update -y --exclude=WALinuxAgent,WALinuxAgent-udev --skip-broken
    yum install -y git
    ;;
  *)
    echo "Unsupported distribution: $distro"
    exit 1
    ;;
esac

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
  ./deploy-scripts/wait_for_hostname.sh "$HOSTNAME"
  yes | ./deploy-scripts/global_install.sh "$HOSTNAME" "$USEREMAIL"
  export INSTALL_DOC_VIEWER="$INSTALL_DOC_VIEWER"
  if [[ -z "$TOKEN" ]]; then
    setup_bbpro --port 8080 
  else
    setup_bbpro --port 8080 --token "$TOKEN"
  fi
  bbpro
EOF

