import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// Mario-inspired theme tune
const marioTheme = {
  name: 'Mario Discotheque',
  notes: [
    // Intro (~3s): Iconic fanfare
    { freq: 523, duration: 150, shape: 'square' },   // C5, da-
    { freq: 784, duration: 150, shape: 'square' },   // G5, -da-
    { freq: 1046, duration: 200, shape: 'square' },  // C6, -da!
    { freq: 880, duration: 150, shape: 'square' },   // A5, quick hop
    { freq: 784, duration: 150, shape: 'square' },   // G5, bounce
    { freq: 659, duration: 200, shape: 'square' },   // E5, landing
    { freq: 523, duration: 200, shape: 'square' },   // C5, punchy kick
    { freq: 392, duration: 250, shape: 'triangle' }, // G4, bass hum
    // Main Melody (~12s): Bouncy Overworld hook
    { freq: 659, duration: 100, shape: 'square' },   // E5, da-
    { freq: 659, duration: 100, shape: 'square' },   // E5, -da-
    { freq: 659, duration: 150, shape: 'square' },   // E5, -da
    { freq: 784, duration: 200, shape: 'square' },   // G5, jump
    { freq: 523, duration: 150, shape: 'square' },   // C5, skip
    { freq: 587, duration: 150, shape: 'square' },   // D5, hop
    { freq: 659, duration: 200, shape: 'square' },   // E5, bounce
    { freq: 784, duration: 150, shape: 'square' },   // G5, climb
    { freq: 880, duration: 150, shape: 'square' },   // A5, peak
    { freq: 1046, duration: 200, shape: 'sine' },    // C6, neon zip
    { freq: 880, duration: 100, shape: 'triangle' }, // A5, quick bloop
    { freq: 784, duration: 150, shape: 'triangle' }, // G5, funky dip
    { freq: 659, duration: 200, shape: 'square' },   // E5, groove
    { freq: 523, duration: 150, shape: 'square' },   // C5, beat
    { freq: 392, duration: 200, shape: 'triangle' }, // G4, bass pulse
    // Repeat melody snippet (~3s)
    { freq: 659, duration: 100, shape: 'square' },   // E5, da-
    { freq: 659, duration: 100, shape: 'square' },   // E5, -da-
    { freq: 659, duration: 150, shape: 'square' },   // E5, -da
    { freq: 784, duration: 200, shape: 'square' },   // G5, jump
    { freq: 1046, duration: 250, shape: 'sine' },    // C6, high pop
    // Resolution (~3s): Flagpole finish
    { freq: 880, duration: 150, shape: 'sine' },     // A5, smooth fall
    { freq: 784, duration: 200, shape: 'sine' },     // G5, gentle glide
    { freq: 659, duration: 200, shape: 'square' },   // E5, softening
    { freq: 523, duration: 250, shape: 'sine' },     // C5, cozy land
    { freq: 392, duration: 300, shape: 'sine' }      // G4, final hum
  ]
};

// Play the Mario theme with no setTimeout
async function playMarioTheme() {
  const sampleRate = 48000;

  // Create Speaker instance
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });

  let totalDuration = 0;

  // Generate and write samples for each note directly
  for (const [noteIndex, note] of marioTheme.notes.entries()) {
    console.log(`Theme ${marioTheme.name}, Note ${noteIndex + 1}: freq=${note.freq}, duration=${note.duration}`);
    const tonedata = tone({
      freq: note.freq,
      lengthInSecs: note.duration / 1000, // Convert ms to seconds
      volume: tone.MAX_16,
      rate: sampleRate,
      shape: note.shape,
      Int16Array: true
    });

    // Convert tonedata to a Buffer and write immediately
    const buffer = Buffer.from(tonedata);
    speaker.write(buffer);

    totalDuration += note.duration; // Track duration for cleanup
  }

  // Add a final silence and close the speaker
  const finalSilenceDuration = 100; // 100 ms of silence
  const finalSilenceSamples = Math.floor((finalSilenceDuration / 1000) * sampleRate);
  const finalSilenceBuffer = Buffer.alloc(finalSilenceSamples * 2, 0);
  speaker.write(finalSilenceBuffer);
  totalDuration += finalSilenceDuration;

  // Wait for total duration before ending (async safety)
  setTimeout(() => {
    speaker.end();
    console.log('Mario theme finished playing');
  }, totalDuration);
}

// Run the Mario theme
playMarioTheme().catch(err => {
  console.error('Error playing Mario theme:', err);
  process.exit(1);
});
