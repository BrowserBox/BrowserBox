// Code adapted from example provided at: 
// https://github.com/almoghamdani/audify/tree/04b9fba318619ef76cca99249bbd8662bb0af460 
// by @almoghamdani

import audify from 'audify';

const { RtAudio, RtAudioFormat, RtAudioStreamFlags } = audify;
const DEBUG = false;

// Init RtAudio instance using default sound API
const rtAudio = new RtAudio(/* Insert here specific API if needed */);

// Open the input/output stream
let open;
let running;
const FLAGS = (
  RtAudioStreamFlags.RTAUDIO_MINIMIZE_LATENCY 
  |
  RtAudioStreamFlags.RTAUDIO_NONINTERLEAVED 
  |
  RtAudioStreamFlags.RTAUDIO_SCHEDULE_REALTIME
);
const stream = rtAudio.openStream(
  {
    deviceId: rtAudio.getDefaultOutputDevice(), // Output device id (Get all devices using `getDevices`)
    nChannels: 1, // Number of channels
    firstChannel: 0, // First channel index on device (default = 0).
  },
  {
    deviceId: rtAudio.getDefaultOutputDevice(), // Input device id (Get all devices using `getDevices`)
    nChannels: 1, // Number of channels
    firstChannel: 0, // First channel index on device (default = 0).
  },
  RtAudioFormat.RTAUDIO_SINT16, // PCM Format - Signed 16-bit integer
  48000, // Sampling rate is 44.1kHz
  1920, // Frame size is 1764 (40ms)
  "MyStream", // The name of the stream (used for JACK Api)
  pcm => {
    open = rtAudio.isStreamOpen();
    running = rtAudio.isStreamRunning();
    DEBUG && console.error(`Stream open? ${open}. Stream running? ${running}. Stream time: ${rtAudio.streamTime}`);
    if ( open && running ) {
      process.stdout.write(pcm.toString('binary'));
    } else {
      // not sure if we would ever hit this, but hey. Probably add some event handlers for close, etc
      rtAudio.start();
    }
  },
  null,
  FLAGS
);

// Start the stream
rtAudio.start();
