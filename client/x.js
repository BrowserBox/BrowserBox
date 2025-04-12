import { default as tone } from 'tonegenerator';
import { default as Speaker } from 'speaker';

// Single note test
const testNote = {
  name: 'Test Note',
  notes: [523, 1000] // C5, 1000ms
};

async function playTestNote() {
  const sampleRate = 44100;

  const speaker = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });

  const freq = testNote.notes[0];
  const duration = testNote.notes[1];
  console.log(`Test Note: freq=${freq}, duration=${duration}`);
  const tonedata = tone({
    freq: freq,
    lengthInSecs: duration / 1000, // 1s
    volume: tone.MAX_16,
    rate: sampleRate,
    shape: 'sine',
    Int16Array: true
  });

  console.log(`Generated ${tonedata.length / 2} samples`); // Int16Array, 2 bytes per sample
  const buffer = Buffer.from(tonedata);
  speaker.write(buffer);

  const finalSilenceDuration = 100;
  const finalSilenceSamples = Math.floor((finalSilenceDuration / 1000) * sampleRate);
  const finalSilenceBuffer = Buffer.alloc(finalSilenceSamples * 2, 0);
  speaker.write(finalSilenceBuffer);

  setTimeout(() => {
    speaker.end();
    console.log('Test finished');
  }, duration + finalSilenceDuration);
}

playTestNote().catch(err => console.error('Error:', err));
