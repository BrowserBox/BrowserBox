import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// Play a retro-inspired startup ditty
async function startupDitzyTune() {
  const sampleRate = 44100;

  // Create a Speaker instance
  const speaker = new Speaker({
    channels: 1,          // Mono sound
    bitDepth: 16,        // 16-bit depth (PCM)
    sampleRate: sampleRate, // Sample rate
    signed: true,        // Signed samples
    float: false         // No floating-point samples
  });

  // Define the retro startup ditty
  const tune = [
    { freq: 440, duration: 120, shape: 'square' },  // Low, punchy start (C4)
    { freq: 659, duration: 120, shape: 'square' },  // E5, bright climb
    { freq: 880, duration: 180, shape: 'square' },  // A5, soaring note
    { freq: 659, duration: 100, shape: 'square' },  // Back to E5, quick dip
    { freq: 784, duration: 160, shape: 'sine' },    // G5, warm transition
    { freq: 880, duration: 200, shape: 'sine' },    // A5, uplifting peak
    { freq: 1046, duration: 240, shape: 'sine' },   // C6, triumphant finish
    { freq: 880, duration: 120, shape: 'sine' }     // A5, soft resolve
  ];

  // Generate PCM data for all notes and play them sequentially
  let totalDuration = 0;
  for (const [index, note] of tune.entries()) {
    setTimeout(() => {
      console.log(`Playing note ${index + 1}: freq=${note.freq}, duration=${note.duration}, shape=${note.shape}`);
      const tonedata = tone({
        freq: note.freq,
        lengthInSecs: note.duration / 1000, // Convert ms to seconds
        volume: tone.MAX_16 * 0.8,          // Slightly lower volume for warmth
        rate: sampleRate,
        shape: note.shape,
        Int16Array: true
      });

      // Convert tonedata to a Buffer
      const buffer = Buffer.from(tonedata);
      speaker.write(buffer);

      // Add a tiny silence after each note for clarity
      const silenceDuration = 8; // 8 ms of silence
      const silenceSamples = Math.floor((silenceDuration / 1000) * sampleRate);
      const silenceBuffer = Buffer.alloc(silenceSamples * 2, 0); // 2 bytes per sample
      speaker.write(silenceBuffer);
    }, totalDuration);

    totalDuration += note.duration + 8; // Add silence duration
  }

  // End the speaker stream after the tune
  setTimeout(() => {
    // Add a final silence to ensure the last note plays fully
    const finalSilenceDuration = 100; // 100 ms of silence
    const finalSilenceSamples = Math.floor((finalSilenceDuration / 1000) * sampleRate);
    const finalSilenceBuffer = Buffer.alloc(finalSilenceSamples * 2, 0);
    speaker.write(finalSilenceBuffer);

    setTimeout(() => {
      speaker.end();
      console.log('Startup ditty finished playing');
    }, finalSilenceDuration);
  }, totalDuration);
}

// Run the startup tune
startupDitzyTune().catch(err => {
  console.error('Error playing startup ditty:', err);
  process.exit(1);
});
