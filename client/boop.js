import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// Create a Speaker instance
const sampleRate = 44100;
const speaker = new Speaker({
  channels: 1,          // Mono sound
  bitDepth: 16,        // 16-bit depth (PCM)
  sampleRate: sampleRate,
  signed: true,
  float: false
});

// Function to play a sound
function playSound(freq, duration) {
  const tonedata = tone({
    freq: freq,
    lengthInSecs: duration / 1000, // Convert ms to seconds
    volume: tone.MAX_16,
    rate: sampleRate,
    shape: 'triangle',
    Int16Array: true
  });

  const buffer = Buffer.from(tonedata);
  speaker.write(buffer);

  // Add a small silence to prevent underflow
  const silenceDuration = 10; // 10 ms of silence
  const silenceSamples = Math.floor((silenceDuration / 1000) * sampleRate);
  const silenceBuffer = Buffer.alloc(silenceSamples * 2, 0);
  speaker.write(silenceBuffer);
}

// Listen for IPC messages
process.on('message', (message) => {
  if (message === 'jump') {
    // Play a "boop" sound for jumping
    playSound(800, 100); // 800 Hz, 100 ms
  } else if (message === 'gameOver') {
    // Play a "game over" sound (lower pitch, longer duration)
    playSound(400, 300); // 400 Hz, 300 ms
  }
});

// Keep the process alive
process.on('SIGINT', () => {
  speaker.end();
  process.exit(0);
});
