import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// List of six ditty musical structures, discotheque-inspired
const ditties = [
  {
    name: 'Pixel Sunrise',
    notes: [
      { freq: 523, duration: 150, shape: 'square' },   // C5, snappy beep
      { freq: 784, duration: 150, shape: 'square' },   // G5, zippy hop
      { freq: 1046, duration: 200, shape: 'sine' },    // C6, neon pop
      { freq: 880, duration: 100, shape: 'sine' },     // A5, bright ping
      { freq: 523, duration: 150, shape: 'sine' }      // C5, warm blip
    ]
  },
  {
    name: 'Cosmic Stroll',
    notes: [
      { freq: 349, duration: 200, shape: 'triangle' }, // F4, groovy hum
      { freq: 698, duration: 150, shape: 'triangle' }, // F5, bouncy bloop
      { freq: 880, duration: 150, shape: 'triangle' }, // A5, starry zap
      { freq: 523, duration: 100, shape: 'triangle' }, // C5, quick tap
      { freq: 698, duration: 150, shape: 'sine' }      // F5, smooth dip
    ]
  },
  {
    name: 'Neon Quest',
    notes: [
      { freq: 440, duration: 100, shape: 'square' },   // A4, gritty tick
      { freq: 880, duration: 150, shape: 'square' },   // A5, bold boop
      { freq: 1174, duration: 200, shape: 'square' },  // D6, zesty zip
      { freq: 1046, duration: 150, shape: 'sine' },    // C6, high ping
      { freq: 880, duration: 100, shape: 'sine' }      // A5, neon drop
    ]
  },
  {
    name: 'Dreamy Boot',
    notes: [
      { freq: 392, duration: 150, shape: 'sine' },     // G4, soft hum
      { freq: 587, duration: 150, shape: 'sine' },     // D5, gentle rise
      { freq: 784, duration: 200, shape: 'sine' },     // G5, twinkly glow
      { freq: 698, duration: 100, shape: 'sine' },     // F5, dreamy dip
      { freq: 523, duration: 150, shape: 'sine' }      // C5, cozy fade
    ]
  },
  {
    name: 'Arcade Dawn',
    notes: [
      { freq: 523, duration: 100, shape: 'square' },   // C5, crisp snap
      { freq: 784, duration: 150, shape: 'square' },   // G5, punchy leap
      { freq: 1046, duration: 150, shape: 'square' },  // C6, lively buzz
      { freq: 880, duration: 100, shape: 'square' },   // A5, arcade pop
      { freq: 784, duration: 150, shape: 'sine' }      // G5, warm close
    ]
  },
  {
    name: 'Retro Spark',
    notes: [
      { freq: 440, duration: 150, shape: 'triangle' }, // A4, perky bleep
      { freq: 659, duration: 150, shape: 'triangle' }, // E5, bouncy spark
      { freq: 880, duration: 100, shape: 'triangle' }, // A5, quick zip
      { freq: 1046, duration: 200, shape: 'sine' },    // C6, bright flare
      { freq: 523, duration: 150, shape: 'sine' }      // C5, neon blip
    ]
  }
];

// Play all ditties in sequence with 2-second pauses
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

  // Play each ditty
  for (const [dittyIndex, ditty] of ditties.entries()) {
    console.log(`Starting ditty: ${ditty.name}`);

    let totalDittyDuration = 0;

    // Play each note in the ditty
    for (const [noteIndex, note] of ditty.notes.entries()) {
      setTimeout(() => {
        console.log(`Ditty ${ditty.name}, Note ${noteIndex + 1}: freq=${note.freq}, duration=${note.duration}`);
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
      }, totalSequenceDuration + totalDittyDuration);

      totalDittyDuration += note.duration + 10; // Add silence duration
    }

    totalSequenceDuration += totalDittyDuration;

    // Add 2-second pause after each ditty (except the last)
    if (dittyIndex < ditties.length - 1) {
      const pauseDuration = 2000; // 2 seconds
      setTimeout(() => {
        const pauseSamples = Math.floor((pauseDuration / 1000) * sampleRate);
        const pauseBuffer = Buffer.alloc(pauseSamples * 2, 0);
        speaker.write(pauseBuffer);
      }, totalSequenceDuration);
      totalSequenceDuration += pauseDuration;
    }
  }

  // End the speaker stream after the last ditty
  setTimeout(() => {
    const finalSilenceDuration = 100; // 100 ms of silence
    const finalSilenceSamples = Math.floor((finalSilenceDuration / 1000) * sampleRate);
    const finalSilenceBuffer = Buffer.alloc(finalSilenceSamples * 2, 0);
    speaker.write(finalSilenceBuffer);

    setTimeout(() => {
      speaker.end();
      console.log('All ditties finished playing');
    }, finalSilenceDuration);
  }, totalSequenceDuration);
}

// Run the full sequence
playStartupSequence().catch(err => {
  console.error('Error playing sequence:', err);
  process.exit(1);
});
