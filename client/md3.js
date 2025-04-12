import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// List of six ditty musical structures
const ditties = [
  {
    name: 'Pixel Sunrise',
    notes: [
      { freq: 523, duration: 200, shape: 'square' },          // C5, punchy start
      { freq: 659, duration: 300, shape: 'square' },          // E5, rising
      { freq: 784, duration: 400, shape: 'square' },          // G5, soaring
      { freq: 1046, duration: 500, shape: 'sine' },           // C6, warm peak
      { freq: [659, 880], duration: 350, shape: 'sine' },     // E5+A5, chord-like
      { freq: 523, duration: 250, shape: 'sine' }             // C5, soft resolve
    ]
  },
  {
    name: 'Cosmic Stroll',
    notes: [
      { freq: 349, duration: 250, shape: 'triangle' },        // F4, gentle intro
      { freq: 523, duration: 150, shape: 'triangle' },        // C5, quick step
      { freq: 698, duration: 400, shape: 'triangle' },        // F5, lingering
      { freq: [523, 784], duration: 450, shape: 'triangle' }, // C5+G5, harmony
      { freq: 880, duration: 350, shape: 'sine' },            // A5, bright lift
      { freq: 698, duration: 300, shape: 'sine' }             // F5, cozy end
    ]
  },
  {
    name: 'Neon Quest',
    notes: [
      { freq: 440, duration: 180, shape: 'square' },          // A4, bold beep
      { freq: 659, duration: 220, shape: 'square' },          // E5, climbing
      { freq: [784, 1046], duration: 400, shape: 'square' },  // G5+C6, gritty chord
      { freq: 880, duration: 300, shape: 'square' },          // A5, steady
      { freq: 1174, duration: 500, shape: 'sine' },           // D6, soaring
      { freq: 880, duration: 200, shape: 'sine' }             // A5, resolve
    ]
  },
  {
    name: 'Dreamy Boot',
    notes: [
      { freq: 392, duration: 300, shape: 'sine' },            // G4, soft hum
      { freq: 587, duration: 400, shape: 'sine' },            // D5, warm rise
      { freq: 784, duration: 200, shape: 'sine' },            // G5, quick shine
      { freq: [587, 880], duration: 450, shape: 'sine' },     // D5+A5, dreamy chord
      { freq: 698, duration: 350, shape: 'sine' },            // F5, gentle peak
      { freq: 523, duration: 500, shape: 'sine' }             // C5, long fade
    ]
  },
  {
    name: 'Arcade Dawn',
    notes: [
      { freq: 523, duration: 150, shape: 'square' },          // C5, snappy start
      { freq: 784, duration: 250, shape: 'square' },          // G5, bold leap
      { freq: 880, duration: 350, shape: 'square' },          // A5, rising
      { freq: [659, 1046], duration: 400, shape: 'square' },  // E5+C6, chord buzz
      { freq: 1174, duration: 450, shape: 'sine' },           // D6, triumphant
      { freq: 784, duration: 300, shape: 'sine' }             // G5, warm close
    ]
  },
  {
    name: 'Retro Spark',
    notes: [
      { freq: 440, duration: 200, shape: 'triangle' },        // A4, steady kickoff
      { freq: 659, duration: 300, shape: 'triangle' },        // E5, climbing
      { freq: 880, duration: 150, shape: 'triangle' },        // A5, quick hop
      { freq: 1046, duration: 400, shape: 'triangle' },       // C6, bright peak
      { freq: [659, 880], duration: 500, shape: 'sine' },     // E5+A5, rich harmony
      { freq: 523, duration: 350, shape: 'sine' }             // C5, soft landing
    ]
  }
];

// Play a single ditty by index or name
async function playStartupDitty(dittySelector = 0) {
  const sampleRate = 44100;

  // Select ditty
  let ditty;
  if (typeof dittySelector === 'string') {
    ditty = ditties.find(d => d.name === dittySelector);
  } else {
    ditty = ditties[dittySelector];
  }
  if (!ditty) {
    throw new Error(`Ditty not found: ${dittySelector}`);
  }

  console.log(`Playing ditty: ${ditty.name}`);

  // Create Speaker instance
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });

  let totalDuration = 0;

  // Play each note
  for (const [index, note] of ditty.notes.entries()) {
    const isChord = Array.isArray(note.freq);
    const freqs = isChord ? note.freq : [note.freq];
    const segmentCount = isChord ? 10 : 5; // More segments for chords to alternate
    const segmentDuration = note.duration / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
      setTimeout(() => {
        // Alternate frequencies for chord effect
        const freq = isChord ? freqs[i % 2] : freqs[0];
        const volume = tone.MAX_16 * (0.8 - (i * (0.7 / segmentCount))); // Fade 0.8 to 0.1
        console.log(`Note ${index + 1}, segment ${i + 1}: freq=${freq}, duration=${segmentDuration}, volume=${Math.round(volume)}`);
        const tonedata = tone({
          freq: freq,
          lengthInSecs: segmentDuration / 1000,
          volume: volume,
          rate: sampleRate,
          shape: note.shape,
          Int16Array: true
        });
        speaker.write(Buffer.from(tonedata));
      }, totalDuration + (i * segmentDuration));
    }

    totalDuration += note.duration + 10; // 10ms silence
    setTimeout(() => {
      const silenceSamples = Math.floor((10 / 1000) * sampleRate);
      speaker.write(Buffer.alloc(silenceSamples * 2, 0));
    }, totalDuration - 10);
  }

  // Finalize
  setTimeout(() => {
    const finalSilenceSamples = Math.floor((100 / 1000) * sampleRate);
    speaker.write(Buffer.alloc(finalSilenceSamples * 2, 0));
    setTimeout(() => {
      speaker.end();
      console.log(`${ditty.name} finished playing`);
    }, 100);
  }, totalDuration);
}

// Run a ditty (e.g., index 0 for Pixel Sunrise, or name 'Cosmic Stroll')
playStartupDitty(0).catch(err => {
  console.error('Error playing ditty:', err);
  process.exit(1);
});
