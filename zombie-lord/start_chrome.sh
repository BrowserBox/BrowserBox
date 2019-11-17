#!/bin/bash

port="$1"
username="$2"

mkdir -p /home/$username/chrome-browser/

sudo -g browsers google-chrome-stable --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
BGPID=$!

trap 'kill -1 $BGPID; exit' SIGHUP
trap 'kill -1 $BGPID; exit' SIGINT
trap 'kill -1 $BGPID; exit' SIGTERM

wait $BGPID

# google-chrome-stable --disable-gpu --disable-gpu-compositing --disable-gpu-rasterization --disable-webgl --disable-webgl-image-chromium --disable-webgl2 --disable-2d-canvas-image-chromium --disable-2d-canvas-clip-aa --disable-accelerated-2d-canvas --disable-3d-apis --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# The HeadlessExperimental flags cause command timeouts. I don't think this is just head of line
# blocking, this is actually the page is waiting, as it is supposed to.
# This is great for CPU but for now we can't use HEXP because it cannot be enabled on all tabs.
# google-chrome-stable --renderer-process-limit=1 --process-per-site --disable-gpu --disable-gpu-compositing --disable-gpu-rasterization --disable-webgl --disable-webgl-image-chromium --disable-webgl2 --disable-2d-canvas-image-chromium --disable-2d-canvas-clip-aa --disable-accelerated-2d-canvas --disable-3d-apis --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --no-gpu --disable-gpu --disable-software-rasterizer --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# google-chrome-stable --mute-audio --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 --enable-surface-synchronization --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-threaded-scrolling --disable-checker-imaging &
# google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# sudo cgexec -g memory,cpu:browsers sudo -u $username google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session --disk-cache-size=2750000000 &
# sudo cgexec -g memory,cpu:browsers sudo -u $username google-chrome-stable --mute-audio --no-gpu --disable-gpu --disable-software-rasterizer --headless --remote-debugging-port=$port --window-size=1280,800 --profile-directory=/home/$username/chrome-browser/Default --profiling-flush=1 --enable-aggressive-domstorage-flushing --user-data-dir=/home/$username/chrome-browser/ --restore-last-session &
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --remote-debugging-port=$1 --window-size=1280,800
# echo google-chrome-stable --no-gpu --disable-software-rasterizer --headless --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1280,800
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1280,800
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=800,495
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1337,666
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --hide-scrollbars --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=1337,666
# google-chrome-stable --no-gpu --disable-software-rasterizer --headless --mute-audio --hide-scrollbars --remote-debugging-port=$1 --remote-debugging-address=0.0.0.0 --window-size=640,480 --ignore-certificate-errors
