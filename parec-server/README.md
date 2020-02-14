# parec-server

Encodes PulseAudio stream and serves it as a live http stream.

# Background

I decided to write my own server after I found pulseaudio's
`Enable network access to local sound devices` option too cumbersome to setup.

I wanted something plain and simple which would serve my currently playing
stream so I can play it on my Sonos device.

The only limitation I noticed (which is also present in pulseaudio's network
server, if enabled) is
 the latency which is on my system around 5 seconds.

Flac encoding is also possible (commented in code), but is disabled as Sonos
only supports `mp3`, `wma` and `aac`.

# Installation

```bash
# clone the repository
git clone https://github.com/jere/parec-server.git

# run the server
node parec-server <sink/source to connect to>
```

The server will be available on `http://localhost:2000` or
`http://<your_ip>:2000`.

`<sink/source to connect to>` must be defined or a default `steam.monitor` will
be used.

You can use `pactl load-module module-null-sink sink_name=steam` to use
the default monitor. You then need to redirect your output to that sink. See
details [here](http://askubuntu.com/a/60856/42823).

# Requirements

Node.js and a linux machine running PulseAudio
