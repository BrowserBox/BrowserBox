import { default as tone } from 'tonegenerator';

const DTMF_MAP = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  'A': [697, 1633],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  'B': [770, 1633],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  'C': [852, 1633],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
  'D': [941, 1633]
};

async function playDTMF(key, durationMs = 200) {
  const freqs = DTMF_MAP[key];
  if (!freqs) {
    console.warn(`Unknown DTMF key: ${key}`);
    return;
  }

  const sampleRate = 44100;
  let speaker = null;

  if (process.platform !== 'win32') {
    try {
      const { default: Speaker } = await import('@browserbox/speaker');
      speaker = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: sampleRate,
        signed: true,
        float: false
      });
    } catch (err) {
      console.warn('Failed to init speaker:', err.message);
      return;
    }
  } else {
    console.log('Running on Windows, skipping playback.');
    return;
  }

  const lengthInSecs = durationMs / 1000;

  // Generate both tones
  const tone1 = tone({
    freq: freqs[0],
    lengthInSecs,
    volume: tone.MAX_16 / 2,
    rate: sampleRate,
    shape: 'sine',
    Int16Array: true
  });

  const tone2 = tone({
    freq: freqs[1],
    lengthInSecs,
    volume: tone.MAX_16 / 2,
    rate: sampleRate,
    shape: 'sine',
    Int16Array: true
  });

  // Mix the tones
  const mixed = new Int16Array(tone1.length);
  for (let i = 0; i < mixed.length; i++) {
    mixed[i] = tone1[i] + tone2[i];
  }

  const buffer = Buffer.from(mixed.buffer);
  speaker.write(buffer);
  speaker.end();
  console.log(`Played DTMF for key "${key}"`);
}

// Example usage: play "123"
(async () => {
  for (const key of ['1', '2', '3']) {
    await playDTMF(key);
    await new Promise(res => setTimeout(res, 250)); // small pause between tones
  }
})();

