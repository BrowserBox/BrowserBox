import { default as tone } from 'tonegenerator';
import { default as Speaker } from '@browserbox/speaker';

// List of six ditty musical structures, short and playful
const ditties = [
  {
    name: 'Pixel Sunrise',
    notes: [
      { freq: 523, duration: 150, shape: 'square' },         // C5, zippy beep
      { freq: 784, duration: 200, shape: 'square' },         // G5, quick climb
      { freq: 1046, duration: 250, shape: 'sine' },          // C6, bright pop
      { freq: [659, 880], duration: 200, shape: 'sine' },    // E5+A5, chirpy chord
      { freq: 523, duration: 150, shape: 'sine' }            // C5, soft blip
    ]
  },
  {
    name: 'Cosmic Stroll',
    notes: [
      { freq: 349, duration: 200, shape: 'triangle' },       // F4, bouncy hum
      { freq: 698, duration: 150, shape: 'triangle' },       // F5, light bloop
      { freq: 880, duration: 250, shape: 'triangle' },       // A5, starry ping
      { freq: [523, 784], duration: 200, shape: 'triangle' },// C5+G5, fizzy buzz
      { freq: 698, duration: 150, shape: 'sine' }            // F5, warm dip
    ]
  },
  {
    name: 'Neon Quest',
    notes: [
      { freq: 440, duration: 100, shape: 'square' },         // A4, snappy tick
      { freq: 880, duration: 150, shape: 'square' },         // A5, bold boop
      { freq: [784, 1046], duration: 200, shape: 'square' }, // G5+C6, gritty chord
      { freq: 1174, duration: 250, shape: 'sine' },          // D6, zesty leap
      { freq: 880, duration: 150, shape: 'sine' }            // A5, smooth drop
    ]
  },
  {
    name: 'Dreamy Boot',
    notes: [
      { freq: 392, duration: 200, shape: 'sine' },           // G4, gentle hum
      { freq: 587, duration: 150, shape: 'sine' },           // D5, soft rise
      { freq: 784, duration: 250, shape: 'sine' },           // G5, twinkly shine
      { freq: [587, 880], duration: 200, shape: 'sine' },    // D5+A5, dreamy buzz
      { freq: 523, duration: 200, shape: 'sine' }            // C5, cozy fade
    ]
  },
  {
    name: 'Arcade Dawn',
    notes: [
      { freq: 523, duration: 100, shape: 'square' },         // C5, crisp snap
      { freq: 784, duration: 150, shape: 'square' },         // G5, punchy hop
      { freq: 1046, duration: 200, shape: 'square' },        // C6, lively ping
      { freq: [659, 880], duration: 150, shape: 'square' },  // E5+A5, arcade fizz
      { freq: 784, duration: 150, shape: 'sine' }            // G5, warm close
    ]
  },
  {
    name: 'Retro Spark',
    notes: [
      { freq: 440, duration: 150, shape: 'triangle' },       // A4, perky bleep
      { freq: 659, duration: 200, shape: 'triangle' },       // E5, bouncy jump
      { freq: 880, duration: 150, shape: 'triangle' },       // A5, quick spark
      { freq: [523, 784], duration: 200, shape: 'triangle' },// C5+G5, zippy chord
      { freq: 1046, duration: 250, shape: 'sine' }           // C6, bright finish
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

  // Generate and write samples for each ditty
  for (const [dittyIndex, ditty] of ditties.entries()) {
    console.log(`Starting ditty: ${ditty.name}`);

    // Process each note in the ditty
    for (const [noteIndex, note] of ditty.notes.entries()) {
      const isChord = Array.isArray(note.freq);
      const freqs = isChord ? note.freq : [note.freq];
      const segmentCount = isChord ? 8 : 4; // Fewer segments for short notes
      const segmentDuration = note.duration / segmentCount;

      for (let i = 0; i < segmentCount; i++) {
        const freq = isChord ? freqs[i % 2] : freqs[0];
        const volume = tone.MAX_16 * (0.8 - (i * (0.7 / segmentCount))); // Fade 0.8 to 0.1
        console.log(`Ditty ${ditty.name}, Note ${noteIndex + 1}, segment ${i + 1}: freq=${freq}, duration=${segmentDuration}, volume=${Math.round(volume)}`);
        const tonedata = tone({
          freq: freq,
          lengthInSecs: segmentDuration / 1000,
          volume: volume,
          rate: sampleRate,
          shape: note.shape,
          Int16Array: true
        });
        speaker.write(Buffer.from(tonedata));
      }

      totalSequenceDuration += note.duration; // No gaps between notes
    }

    // Add 2-second pause after each ditty (except the last)
    if (dittyIndex < ditties.length - 1) {
      const pauseDuration = 2000; // 2 seconds
      const pauseSamples = Math.floor((pauseDuration / 1000) * sampleRate);
      const pauseBuffer = Buffer.alloc(pauseSamples * 2, 0);
      speaker.write(pauseBuffer);
      totalSequenceDuration += pauseDuration;
    }
  }

  // Finalize with a single setTimeout
  setTimeout(() => {
    const finalSilenceSamples = Math.floor((100 / 1000) * sampleRate);
    speaker.write(Buffer.alloc(finalSilenceSamples * 2, 0));
    speaker.end();
    console.log('All ditties finished playing');
  }, totalSequenceDuration);
}

// Run the full sequence
playStartupSequence().catch(err => {
  console.error('Error playing sequence:', err);
  process.exit(1);
});
