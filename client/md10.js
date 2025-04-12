import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// List of three theme tunes with musical structure
const themes = [
  {
    name: 'Cyber Dawn',
    notes: [
      // Intro (1.5s): Rising grit
      { freq: 440, duration: 150, shape: 'square' },   // A4, bold tick
      { freq: 523, duration: 150, shape: 'square' },   // C5, quick step
      { freq: 659, duration: 200, shape: 'square' },   // E5, rising buzz
      { freq: 784, duration: 200, shape: 'square' },   // G5, punchy leap
      // Main Melody (5s): Energetic hook
      { freq: 880, duration: 150, shape: 'square' },   // A5, sharp boop
      { freq: 1046, duration: 200, shape: 'square' },  // C6, zesty zip
      { freq: 880, duration: 100, shape: 'square' },   // A5, quick dip
      { freq: 784, duration: 200, shape: 'square' },   // G5, driving pulse
      { freq: 880, duration: 150, shape: 'square' },   // A5, back up
      { freq: 1046, duration: 250, shape: 'sine' },    // C6, neon peak
      { freq: 1174, duration: 200, shape: 'sine' },    // D6, high surge
      { freq: 880, duration: 150, shape: 'square' },   // A5, rhythmic hit
      { freq: 784, duration: 200, shape: 'square' },   // G5, push forward
      // Resolution (1.5s): Confident close
      { freq: 659, duration: 200, shape: 'sine' },     // E5, softening
      { freq: 523, duration: 250, shape: 'sine' },     // C5, warm resolve
      { freq: 440, duration: 200, shape: 'sine' }      // A4, final hum
    ]
  },
  {
    name: 'Starlit Quest',
    notes: [
      // Intro (2s): Dreamy shimmer
      { freq: 349, duration: 200, shape: 'triangle' }, // F4, gentle hum
      { freq: 523, duration: 200, shape: 'triangle' }, // C5, soft rise
      { freq: 698, duration: 250, shape: 'triangle' }, // F5, starry glow
      { freq: 784, duration: 250, shape: 'sine' },     // G5, warm lift
      // Main Melody (5s): Adventurous journey
      { freq: 880, duration: 150, shape: 'sine' },     // A5, twinkly ping
      { freq: 1046, duration: 200, shape: 'sine' },    // C6, hopeful soar
      { freq: 880, duration: 150, shape: 'triangle' }, // A5, quick bloop
      { freq: 698, duration: 200, shape: 'triangle' }, // F5, flowing step
      { freq: 784, duration: 150, shape: 'sine' },     // G5, rising again
      { freq: 880, duration: 200, shape: 'sine' },     // A5, bright hook
      { freq: 1046, duration: 250, shape: 'sine' },    // C6, peak shine
      { freq: 784, duration: 150, shape: 'triangle' }, // G5, gentle dip
      { freq: 698, duration: 200, shape: 'triangle' }, // F5, steady glide
      // Resolution (2s): Hopeful close
      { freq: 523, duration: 250, shape: 'sine' },     // C5, cozy fade
      { freq: 349, duration: 300, shape: 'sine' },     // F4, deep resolve
      { freq: 392, duration: 250, shape: 'sine' }      // G4, final breath
    ]
  },
  {
    name: 'Retro Pulse',
    notes: [
      // Intro (1.5s): Funky kickoff
      { freq: 440, duration: 150, shape: 'triangle' }, // A4, perky bleep
      { freq: 659, duration: 150, shape: 'triangle' }, // E5, bouncy snap
      { freq: 784, duration: 200, shape: 'square' },   // G5, gritty pop
      { freq: 880, duration: 150, shape: 'square' },   // A5, sharp boop
      // Main Melody (4.5s): Danceable groove
      { freq: 1046, duration: 200, shape: 'triangle' },// C6, zappy zip
      { freq: 880, duration: 100, shape: 'triangle' }, // A5, quick tap
      { freq: 784, duration: 150, shape: 'square' },   // G5, funky hit
      { freq: 659, duration: 150, shape: 'square' },   // E5, driving beat
      { freq: 880, duration: 200, shape: 'triangle' }, // A5, lively bloop
      { freq: 1046, duration: 200, shape: 'triangle' },// C6, high pulse
      { freq: 880, duration: 150, shape: 'square' },   // A5, sharp stab
      { freq: 784, duration: 150, shape: 'square' },   // G5, rhythmic kick
      // Resolution (1.5s): Cool finish
      { freq: 659, duration: 200, shape: 'sine' },     // E5, softening
      { freq: 523, duration: 250, shape: 'sine' },     // C5, neon fade
      { freq: 440, duration: 200, shape: 'sine' }      // A4, groovy close
    ]
  }
];

// Play all themes in sequence with 2-second pauses
async function playStartupSequence() {
  const sampleRate = 44100;

  // Create Speaker instance
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });

  let totalSequenceDuration = 0;

  // Play each theme
  for (const [themeIndex, theme] of themes.entries()) {
    console.log(`Starting theme: ${theme.name}`);

    let totalThemeDuration = 0;

    // Play each note in the theme
    for (const [noteIndex, note] of theme.notes.entries()) {
      setTimeout(() => {
        console.log(`Theme ${theme.name}, Note ${noteIndex + 1}: freq=${note.freq}, duration=${note.duration}`);
        const tonedata = tone({
          freq: note.freq,
          lengthInSecs: note.duration / 1000, // Convert ms to seconds
          volume: tone.MAX_16,
          rate: sampleRate,
          shape: note.shape,
          Int16Array: true
        });

        // Convert tonedata to a Buffer
        const buffer = Buffer.from(tonedata);
        speaker.write(buffer);

        // Add a small silence after each note to reduce underflow
        const silenceDuration = 10; // 10 ms of silence
        const silenceSamples = Math.floor((silenceDuration / 1000) * sampleRate);
        const silenceBuffer = Buffer.alloc(silenceSamples * 2, 0);
        speaker.write(silenceBuffer);
      }, totalSequenceDuration + totalThemeDuration);

      totalThemeDuration += note.duration + 10; // Add silence duration
    }

    totalSequenceDuration += totalThemeDuration;

    // Add 2-second pause after each theme (except the last)
    if (themeIndex < themes.length - 1) {
      const pauseDuration = 2000; // 2 seconds
      setTimeout(() => {
        const pauseSamples = Math.floor((pauseDuration / 1000) * sampleRate);
        const pauseBuffer = Buffer.alloc(pauseSamples * 2, 0);
        speaker.write(pauseBuffer);
      }, totalSequenceDuration);
      totalSequenceDuration += pauseDuration;
    }
  }

  // End the speaker stream after the last theme
  setTimeout(() => {
    const finalSilenceDuration = 100; // 100 ms of silence
    const finalSilenceSamples = Math.floor((finalSilenceDuration / 1000) * sampleRate);
    const finalSilenceBuffer = Buffer.alloc(finalSilenceSamples * 2, 0);
    speaker.write(finalSilenceBuffer);

    setTimeout(() => {
      speaker.end();
      console.log('All themes finished playing');
    }, finalSilenceDuration);
  }, totalSequenceDuration);
}

// Run the full sequence
playStartupSequence().catch(err => {
  console.error('Error playing sequence:', err);
  process.exit(1);
});
