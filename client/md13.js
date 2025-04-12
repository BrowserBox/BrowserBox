import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// Mario-inspired theme tune with silences
const marioTheme = {
  name: 'Mario Discotheque',
  notes: [
    // Intro: Iconic fanfare
    { freq: 523, duration: 150, shape: 'square' },   // C5, da-
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 784, duration: 150, shape: 'square' },   // G5, -da-
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 1046, duration: 200, shape: 'square' },  // C6, -da!
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 880, duration: 150, shape: 'square' },   // A5, quick hop
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 784, duration: 150, shape: 'square' },   // G5, bounce
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 659, duration: 200, shape: 'square' },   // E5, landing
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 523, duration: 200, shape: 'square' },   // C5, punchy kick
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 392, duration: 250, shape: 'triangle' }, // G4, bass hum
    { freq: 20, duration: 10, shape: 'triangle' },   // Silence
    // Main Melody: Bouncy Overworld hook
    { freq: 659, duration: 100, shape: 'square' },   // E5, da-
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 659, duration: 100, shape: 'square' },   // E5, -da-
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 659, duration: 150, shape: 'square' },   // E5, -da
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 784, duration: 200, shape: 'square' },   // G5, jump
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 523, duration: 150, shape: 'square' },   // C5, skip
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 587, duration: 150, shape: 'square' },   // D5, hop
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 659, duration: 200, shape: 'square' },   // E5, bounce
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 784, duration: 150, shape: 'square' },   // G5, climb
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 880, duration: 150, shape: 'square' },   // A5, peak
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 1046, duration: 200, shape: 'sine' },    // C6, neon zip
    { freq: 20, duration: 10, shape: 'sine' },       // Silence
    { freq: 880, duration: 100, shape: 'triangle' }, // A5, quick bloop
    { freq: 20, duration: 10, shape: 'triangle' },   // Silence
    { freq: 784, duration: 150, shape: 'triangle' }, // G5, funky dip
    { freq: 20, duration: 10, shape: 'triangle' },   // Silence
    { freq: 659, duration: 200, shape: 'square' },   // E5, groove
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 523, duration: 150, shape: 'square' },   // C5, beat
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 392, duration: 200, shape: 'triangle' }, // G4, bass pulse
    { freq: 20, duration: 10, shape: 'triangle' },   // Silence
    // Repeat melody snippet
    { freq: 659, duration: 100, shape: 'square' },   // E5, da-
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 659, duration: 100, shape: 'square' },   // E5, -da-
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 659, duration: 150, shape: 'square' },   // E5, -da
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 784, duration: 200, shape: 'square' },   // G5, jump
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 1046, duration: 250, shape: 'sine' },    // C6, high pop
    { freq: 20, duration: 10, shape: 'sine' },       // Silence
    // Resolution: Flagpole finish
    { freq: 880, duration: 150, shape: 'sine' },     // A5, smooth fall
    { freq: 20, duration: 10, shape: 'sine' },       // Silence
    { freq: 784, duration: 200, shape: 'sine' },     // G5, gentle glide
    { freq: 20, duration: 10, shape: 'sine' },       // Silence
    { freq: 659, duration: 200, shape: 'square' },   // E5, softening
    { freq: 20, duration: 10, shape: 'square' },     // Silence
    { freq: 523, duration: 250, shape: 'sine' },     // C5, cozy land
    { freq: 20, duration: 10, shape: 'sine' },       // Silence
    { freq: 392, duration: 300, shape: 'sine' }      // G4, final hum
    // No final silence here—hardware handles end
  ]
};

// Play the Mario theme by pushing all samples to hardware
async function playMarioTheme() {
  const sampleRate = 44100;

  // Create Speaker instance
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });

  let totalDuration = 0;

  // Generate and write samples for all notes and silences directly
  for (const [noteIndex, note] of marioTheme.notes.entries()) {
    console.log(`Theme ${marioTheme.name}, Entry ${noteIndex + 1}: freq=${note.freq}, duration=${note.duration}`);
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

    totalDuration += note.duration; // Track total duration
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
