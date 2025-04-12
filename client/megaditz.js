import { default as tone } from 'tonegenerator';

// Play the ditzy tune
async function ditzyTune() {
  const sampleRate = 44100;
  let speaker = null;

  if (process.platform !== 'win32') {
    try {
      const { default: Speaker } = await import('speaker');
      speaker = new Speaker({
        channels: 1, // Mono sound
        bitDepth: 16, // 16-bit depth (PCM)
        sampleRate: sampleRate,
        signed: true,
        float: false
      });
      console.log('🎵 Speaker initialized successfully!');
    } catch (err) {
      console.warn('⚠️ Failed to initialize speaker:', err.message);
      speaker = null;
    }
  } else {
    console.log('ℹ️ Running on Windows, skipping audio playback.');
    return; // Exit early on Windows
  }

  if (!speaker) {
    console.log('ℹ️ Audio playback skipped due to unavailable speaker.');
    return;
  }

  // Define the ditzy little tune
  const tune = [
    { freq: 600, duration: 150 },
    { freq: 800, duration: 150 },
    { freq: 1000, duration: 150 },
    { freq: 800, duration: 100 },
    { freq: 1200, duration: 200 },
    { freq: 600, duration: 150 },
    { freq: 800, duration: 100 }
  ];

  // Generate PCM data for all notes and play them sequentially
  let totalDuration = 0;
  for (const [index, note] of tune.entries()) {
    setTimeout(() => {
      console.log(`Playing note ${index + 1}: freq=${note.freq}, duration=${note.duration}`);
      const tonedata = tone({
        freq: note.freq,
        lengthInSecs: note.duration / 1000, // Convert ms to seconds
        volume: tone.MAX_16,
        rate: sampleRate,
        shape: 'triangle',
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
    }, totalDuration);

    totalDuration += note.duration + 10; // Add silence duration to the total
  }

  // End the speaker stream after the last note
  setTimeout(() => {
    // Add a final silence to ensure the last note plays fully
    const finalSilenceDuration = 100; // 100 ms of silence
    const finalSilenceSamples = Math.floor((finalSilenceDuration / 1000) * sampleRate);
    const finalSilenceBuffer = Buffer.alloc(finalSilenceSamples * 2, 0);
    speaker.write(finalSilenceBuffer);

    setTimeout(() => {
      speaker.end();
      console.log('Tune finished playing');
    }, finalSilenceDuration);
  }, totalDuration);
}

// Run the tune
ditzyTune().catch(err => {
  console.error('Error playing tune:', err);
  process.exit(1);
});
