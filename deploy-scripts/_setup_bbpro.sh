#!/usr/bin/env bash

# Check if the port is available
is_port_free() {
  if [[ "$1" =~ ^[0-9]+$ ]] && [ "$1" -ge 1024 ] && [ "$1" -le 65535 ]; then
    echo "Valid port number." >&2
  else
    echo "Invalid port number." >&2
    return 1
  fi

  if netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ":'$1'$" {exit 1}'; then
    # Return a truthy value if the port is available
    return 0
  else
    # Return a falsey value if the port is in use
    return 1
  fi
}

echo -n "Parsing command line args..." >&2

# determine if running on MacOS
if [[ $(uname) == "Darwin" ]]; then
  # check if brew is installed
  if ! command -v brew >/dev/null 2>&1; then
    echo "Error: Homebrew is not installed. Please install Homebrew first." >&2
    echo "Visit https://brew.sh for installation instructions." >&2
    exit 1
  fi

  # if gnu-getopt is not installed, install it
  if ! brew --prefix gnu-getopt > /dev/null 2>&1; then
    brew install gnu-getopt
  fi
  getopt=$(brew --prefix gnu-getopt)/bin/getopt
else
  # else use regular getopt
  getopt="/usr/bin/getopt"
fi

OPTS=`$getopt -o p:t:c: --long port:,token:,cookie:,doc-key: -n 'parse-options' -- "$@"`

if [ $? != 0 ] ; then echo "Failed parsing options." >&2 ; exit 1 ; fi

eval set -- "$OPTS"

while true; do
  case "$1" in
    -p | --port ) 
      if [[ $2 =~ ^[0-9]+$ ]]; then
        PORT="$2"
      else
        echo "Error: --port requires a numeric argument.">&2
        exit 1
      fi
      shift 2
    ;;
    -t | --token ) TOKEN="$2"; shift 2;;
    -c | --cookie ) COOKIE="$2"; shift 2;;
    -d | --doc-key ) DOC_API_KEY="$2"; shift 2;;
    -- ) shift; break;;
    * ) echo "Invalid option: $1" >&2; exit 1;;
  esac
done

echo "Done!">&2;

if [ -z "$PORT" ]; then
  echo "Error: --port option is required" >&2
  exit 1
elif ! is_port_free "$PORT"; then
  echo "Error: the suggested port $PORT is already in use" >&2
  exit 1
elif ! is_port_free $(($PORT - 2)); then
  echo "Error: the suggested port range (audio) is already in use" >&2
  exit 1
elif ! is_port_free $(($PORT + 1)); then
  echo "Error: the suggested port range (devtools) is already in use" >&2
  exit 1
elif ! is_port_free $(($PORT - 1)); then
  echo "Error: the suggested port range (doc viewer) is already in use" >&2
  exit 1
fi

if [ -z "$TOKEN" ]; then
  echo -n "Token not provided, so will generate...">&2
  TOKEN=$(openssl rand -hex 16)
  echo " Generated token: $TOKEN">&2
fi

if [ -z "$COOKIE" ]; then
  echo -n "Cookie not provided, so will generate...">&2
  COOKIE=$(openssl rand -hex 16)
  echo "Generated cookie: $COOKIE">&2
fi

if [ -z "$DOC_API_KEY" ]; then
  echo -n "Doc API key not provided, so will generate...">&2
  DOC_API_KEY=$(openssl rand -hex 16)
  echo "Generated doc API key: $DOC_API_KEY">&2
fi

DT_PORT=$((PORT + 1))
SV_PORT=$((PORT - 1))

echo "Received port $PORT and token $TOKEN and cookie $COOKIE">&2

echo "Setting up bbpro...">&2

echo -n "Creating config directory...">&2

CONFIG_DIR=$HOME/.config/dosyago/bbpro/
mkdir -p $CONFIG_DIR

echo $(date) > $CONFIG_DIR/.bbpro_config_dir

echo "Done!">&2

echo -n "Creating test.env...">&2

sslcerts="$HOME/sslcerts"
cert_file="${sslcerts}/fullchain.pem"
sans=$(openssl x509 -in "$cert_file" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g')
HOST=$(echo $sans | awk '{print $1}')

cat > $CONFIG_DIR/test.env <<EOF
export APP_PORT=$PORT
export LOGIN_TOKEN=$TOKEN
export COOKIE_VALUE=$COOKIE
export DEVTOOLS_PORT=$DT_PORT
export DOCS_PORT=$SV_PORT
export DOCS_KEY=$DOC_API_KEY

# true runs within a 'browsers' group
#export BB_POOL=true

export RENICE_VALUE=-19

# used for building or for installing from repo on macos m1 
# (because of some dependencies with native addons that do not support m1)
# export TARGET_ARCH=x64

# use localhost certs (need export from access machine, can then block firewall ports and not expose connection to internet
# for truly private browser)
# export SSLCERTS_DIR=$HOME/localhost-sslcerts
export SSLCERTS_DIR=$sslcerts

# compute the domain from the cert file
export DOMAIN="$HOST"

# for extra security (but may reduce performance somewhat)
# set the following variables.
# alternately if below are empty
# you can:
# npm install --save-optional bufferutil utf-8-validate
# to utilise these binary libraries to improve performance
# at possible risk to security
WS_NO_UTF_8_VALIDATE=true
WS_NO_BUFFER_UTIL=true

EOF

echo "Done!">&2

echo "The login link for this instance will be:">&2

DOMAIN=$HOST

echo https://$DOMAIN:$PORT/login?token=$TOKEN > $CONFIG_DIR/login.link
echo https://$DOMAIN:$PORT/login?token=$TOKEN

echo "Setup complete. Exiting...">&2
