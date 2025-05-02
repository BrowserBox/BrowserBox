import { default as tone } from 'tonegenerator';
import readline from 'readline';

const DTMF_MAP = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '0': [941, 1336],
  '*': [941, 1209],
  '#': [941, 1477]
};

async function setupSpeaker() {
  const sampleRate = 44100;
  const { default: Speaker } = await import('@browserbox/speaker');
  return new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: sampleRate,
    signed: true,
    float: false
  });
}

async function playDTMF(key, speaker, durationMs = 200) {
  const freqs = DTMF_MAP[key];
  if (!freqs) return;

  const sampleRate = 44100;
  const lengthInSecs = durationMs / 1000;

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

  const mixed = new Int16Array(tone1.length);
  for (let i = 0; i < mixed.length; i++) {
    mixed[i] = tone1[i] + tone2[i];
  }

  const buffer = Buffer.from(mixed.buffer);
  speaker.write(buffer);
}

async function runDTMFKeypad() {
  if (process.platform === 'win32') {
    console.log('Windows detected — speaker module not supported. Exiting.');
    process.exit(0);
  }

  let speaker;
  try {
    speaker = await setupSpeaker();
  } catch (err) {
    console.error('Could not initialize speaker:', err.message);
    return;
  }

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  console.log('DTMF Keypad Active. Type 0-9 * # to play tones. Press Ctrl+C to exit.');

  process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') {
      speaker.end();
      process.exit();
    }

    const inputKey = str.toUpperCase();
    if (DTMF_MAP[inputKey]) {
      console.log(`Key pressed: ${inputKey}`);
      await playDTMF(inputKey, speaker);
    }
  });
}

runDTMFKeypad();

