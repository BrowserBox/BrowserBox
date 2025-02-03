#!/usr/bin/env bash


cd $HOME
source .config/dosyago/bbpro/test.env 

BROWSER_PORT="$(( $APP_PORT - 3000 ))"
echo "Browser port: $BROWSER_PORT"

ids=$(curl -s http://localhost:$BROWSER_PORT/json | jq -r '.[] | select(.type == "page").id')

for id in $ids; do
  echo "Processing ID: $id"
  curl -s http://localhost:$BROWSER_PORT/json/close/$id
  # You can add additional commands here to use each ID, e.g., curl or any other logic
done

max=5
count=0
while true; do
  ids=$(curl -s http://localhost:$BROWSER_PORT/json | jq -r '.[] | select(.type == "page")')
  if [[ -z "$ids" ]] || [ $count -gt $max ]; then
    break
  fi
  echo "Waiting for $ids..."
  count=$(( $count + 1 ))
  sleep 1
done

rm -rf .config/dosyago/bbpro/browser-cache/Default/History* || (echo "Error clearing history" >&2 && exit 1)
rm -rf .cache/dosyago/bbpro || (echo "Error clearing caches" >&2 && exit 1)

echo "History and caches cleared for $(whoami)"

echo "Restarting browser" >&2
echo "$(date)" > "${HOME}/restart_chrome"

CHROME_PID="$(cat "${HOME}/.config/dosyago/bbpro/chrome-${BROWSER_PORT}/pid")"

kill $CHROME_PID
rm -rf .config/dosyago/bbpro/targetCount
sleep 1
if ps $CHROME_PID; then
  kill -9 $CHROME_PID
  rm -rf .config/dosyago/bbpro/targetCount
fi

exit 0
