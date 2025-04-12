import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// Chiptune Odyssey theme (global sine wave)
const chiptuneOdyssey = {
  name: 'Chiptune Odyssey',
  notes: [
    // Intro (~5s): Nostalgic console boot
    261, 300,  // C4, warm hum
    392, 300,  // G4, gentle rise
    523, 250,  // C5, soft ping
    659, 250,  // E5, familiar glow
    784, 300,  // G5, steady climb
    523, 200,  // C5, reflective dip
    392, 300,  // G4, cozy echo
    261, 350,  // C4, deep start
    // Buildup (~10s): Exploring the pixel world
    523, 200,  // C5, stepping out
    659, 200,  // E5, quick hop
    784, 150,  // G5, rising beat
    880, 150,  // A5, excited zip
    1046, 200, // C6, soaring high
    880, 150,  // A5, playful bounce
    784, 150,  // G5, driving pulse
    659, 200,  // E5, steady stride
    523, 250,  // C5, grounding note
    784, 150,  // G5, back up
    880, 150,  // A5, eager leap
    1046, 200, // C6, bright surge
    1174, 200, // D6, bold push
    1046, 150, // C6, quick dip
    880, 150,  // A5, rhythmic hit
    784, 200,  // G5, forward march
    // Climax (~10s): Triumphant peak
    1046, 150, // C6, victory call
    1318, 150, // E6, epic soar
    1174, 200, // D6, powerful stab
    1046, 150, // C6, sharp echo
    880, 150,  // A5, fast thrill
    784, 200,  // G5, bold pulse
    1046, 150, // C6, back up
    1318, 200, // E6, soaring peak
    1174, 150, // D6, high hit
    1046, 150, // C6, quick zip
    880, 200,  // A5, triumphant beat
    784, 150,  // G5, driving force
    659, 200,  // E5, steady climb
    1046, 150, // C6, final surge
    1318, 250, // E6, epic crest
    // Resolution (~5s): Victorious close
    1046, 200, // C6, softening fall
    880, 200,  // A5, gentle glide
    784, 250,  // G5, warm fade
    659, 250,  // E5, reflective dip
    523, 300,  // C5, cozy land
    392, 300,  // G4, steady hum
    261, 350,  // C4, deep resolve
    523, 300,  // C5, final glow
    392, 400   // G4, heartfelt end
  ]
};

// Play the theme with no silence, all sine waves
async function playChiptuneOdyssey() {
  const sampleRate = 44100;
  const waveShape = 'sine'; // Global sine wave for all notes

  // Create Speaker instance
  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });

  let totalDuration = 0;

  // Generate and write samples for all notes directly
  for (let i = 0; i < chiptuneOdyssey.notes.length; i += 2) {
    const freq = chiptuneOdyssey.notes[i];
    const duration = chiptuneOdyssey.notes[i + 1];
    console.log(`Theme ${chiptuneOdyssey.name}, Note ${i / 2 + 1}: freq=${freq}, duration=${duration}`);
    const tonedata = tone({
      freq: freq,
      lengthInSecs: duration / 1000, // Convert ms to seconds
      volume: tone.MAX_16,
      rate: sampleRate,
      shape: waveShape,
      Int16Array: true
    });

    // Convert tonedata to a Buffer and write immediately
    const buffer = Buffer.from(tonedata);
    speaker.write(buffer);

    totalDuration += duration; // Track total duration
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
    console.log('Chiptune Odyssey finished playing');
  }, totalDuration);
}

// Run the theme
playChiptuneOdyssey().catch(err => {
  console.error('Error playing Chiptune Odyssey:', err);
  process.exit(1);
});
