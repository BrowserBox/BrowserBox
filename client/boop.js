import { default as tone } from 'tonegenerator';

// Function to play a sound (only called if speaker is available)
async function playSound(freq, duration, speaker, sampleRate) {
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

// Initialize speaker only on non-Windows platforms
let speaker = null;
const sampleRate = 44100;

if (process.platform !== 'win32') {
  try {
    const { default: Speaker } = await import('@browserbox/speaker');
    speaker = new Speaker({
      channels: 1, // Mono sound
      bitDepth: 16, // 16-bit depth (PCM)
      sampleRate: sampleRate,
      signed: true,
      float: false
    });
    console.log('🎵 Speaker initialized successfully!');
  } catch (err) {
    console.warn('⚠️ Failed to initialize @browserbox/speaker:', err.message);
    speaker = null; // Ensure speaker remains null if import fails
  }
} else {
  console.log('ℹ️ Running on Windows, skipping audio playback.');
}

// Listen for IPC messages
process.on('message', (message) => {
  if (speaker) {
    if (message === 'jump') {
      // Play a "boop" sound for jumping
      playSound(800, 100, speaker, sampleRate);
    } else if (message === 'gameOver') {
      // Play a "game over" sound (lower pitch, longer duration)
      playSound(400, 300, speaker, sampleRate);
    }
  } else {
    console.log(`ℹ️ Received ${message}, but audio is disabled on this platform.`);
  }
});

// Keep the process alive
process.on('SIGINT', () => {
  if (speaker) {
    speaker.end();
  }
  process.exit(0);
});
