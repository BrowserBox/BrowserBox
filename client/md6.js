import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// List of six ditty musical structures, slowed down
const ditties = [
  {
    name: 'Pixel Sunrise',
    notes: [
      { freq: 523, duration: 300, shape: 'square' },          // C5, punchy opener
      { freq: 659, duration: 400, shape: 'square' },          // E5, rising glow
      { freq: 784, duration: 600, shape: 'square' },          // G5, soaring linger
      { freq: 1046, duration: 800, shape: 'sine' },           // C6, warm peak
      { freq: [659, 880], duration: 500, shape: 'sine' },     // E5+A5, noir chord
      { freq: 523, duration: 400, shape: 'sine' }             // C5, soft fade
    ]
  },
  {
    name: 'Cosmic Stroll',
    notes: [
      { freq: 349, duration: 400, shape: 'triangle' },        // F4, dreamy start
      { freq: 523, duration: 200, shape: 'triangle' },        // C5, quick step
      { freq: 698, duration: 600, shape: 'triangle' },        // F5, long sway
      { freq: [523, 784], duration: 700, shape: 'triangle' }, // C5+G5, cosmic buzz
      { freq: 880, duration: 500, shape: 'sine' },            // A5, neon lift
      { freq: 698, duration: 400, shape: 'sine' }             // F5, mellow close
    ]
  },
  {
    name: 'Neon Quest',
    notes: [
      { freq: 440, duration: 250, shape: 'square' },          // A4, gritty beep
      { freq: 659, duration: 350, shape: 'square' },          // E5, bold climb
      { freq: [784, 1046], duration: 600, shape: 'square' },  // G5+C6, retro chord
      { freq: 880, duration: 450, shape: 'square' },          // A5, steady pulse
      { freq: 1174, duration: 700, shape: 'sine' },           // D6, soaring arc
      { freq: 880, duration: 300, shape: 'sine' }             // A5, smooth resolve
    ]
  },
  {
    name: 'Dreamy Boot',
    notes: [
      { freq: 392, duration: 500, shape: 'sine' },            // G4, warm hum
      { freq: 587, duration: 600, shape: 'sine' },            // D5, gentle rise
      { freq: 784, duration: 300, shape: 'sine' },            // G5, quick shine
      { freq: [587, 880], duration: 700, shape: 'sine' },     // D5+A5, dreamy chord
      { freq: 698, duration: 450, shape: 'sine' },            // F5, soft peak
      { freq: 523, duration: 800, shape: 'sine' }             // C5, long fade
    ]
  },
  {
    name: 'Arcade Dawn',
    notes: [
      { freq: 523, duration: 200, shape: 'square' },          // C5, snappy kick
      { freq: 784, duration: 400, shape: 'square' },          // G5, bold leap
      { freq: 880, duration: 500, shape: 'square' },          // A5, rising vibe
      { freq: [659, 1046], duration: 600, shape: 'square' },  // E5+C6, arcade buzz
      { freq: 1174, duration: 700, shape: 'sine' },           // D6, triumphant
      { freq: 784, duration: 400, shape: 'sine' }             // G5, warm close
    ]
  },
  {
    name: 'Retro Spark',
    notes: [
      { freq: 440, duration: 300, shape: 'triangle' },        // A4, steady spark
      { freq: 659, duration: 400, shape: 'triangle' },        // E5, climbing
      { freq: 880, duration: 250, shape: 'triangle' },        // A5, quick pop
      { freq: 1046, duration: 600, shape: 'triangle' },       // C6, bright linger
      { freq: [659, 880], duration: 700, shape: 'sine' },     // E5+A5, rich harmony
      { freq: 523, duration: 500, shape: 'sine' }             // C5, neon fade
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
      const isChord = Array.isArray(note.freq);
      const freqs = isChord ? note.freq : [note.freq];
      const segmentCount = isChord ? 10 : 5; // More segments for chord buzz
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

      totalDittyDuration += note.duration; // 10ms silence between notes
      /*
      setTimeout(() => {
        const silenceSamples = Math.floor((10 / 1000) * sampleRate);
        speaker.write(Buffer.alloc(silenceSamples * 2, 0));
      }, totalSequenceDuration + totalDittyDuration - 10);
      */
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

  // Finalize
  setTimeout(() => {
    const finalSilenceSamples = Math.floor((100 / 1000) * sampleRate);
    speaker.write(Buffer.alloc(finalSilenceSamples * 2, 0));
    setTimeout(() => {
      speaker.end();
      console.log('All ditties finished playing');
    }, 100);
  }, totalSequenceDuration);
}

// Run the full sequence
playStartupSequence().catch(err => {
  console.error('Error playing sequence:', err);
  process.exit(1);
});
