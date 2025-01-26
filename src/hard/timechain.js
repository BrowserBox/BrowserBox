// imports
  // import builtins
    import path from 'path';
    import os from 'os';
    import crypto from 'node:crypto';
    import fs from 'fs';
    import { Buffer } from 'buffer';
    import process from 'process';
    import { Worker } from 'worker_threads';
    import { fileURLToPath } from 'url';
   
  // import 3rd parties
    import * as ed from '@noble/ed25519';
    import yargs from 'yargs/yargs';
    import { hideBin } from 'yargs/helpers';

  // import our libs
    import { rainstormHash } from '@dosyago/rainsum';
    import { BinaryHandler } from 'binary-bliss';

  // import internal
    import { parseKey, sign, verify, encryptRSA, decryptRSA } from './keys.js';

// Configuration and data setup
  const __filename = () => fileURLToPath(import.meta.url);
  const __dirname = () => path.dirname(__filename());
  const MAX_SAFE_NUM = BigInt(Number.MAX_SAFE_INTEGER);
  const BH_OPTS = {
    etext: true
  };
  const CONFIG_DIR = path.resolve(os.homedir(), '.config', 'dosaygo', 'timechain');
  const signInterval = 1n;  // Sign every iteration for demonstration purposes
  const timeEstimatesFile = proofType => path.resolve(CONFIG_DIR, `time_estimates_${hashName}_${proofType}.json`);
  const dataQueue = [];
  let Proofs = [];
  let Estimate = [];
  let ENCRYPT = false;
  let DEBUG;
  let PARALLEL;
  let DEMO;
  let FORMAT;
  let argv;
  let hashFunction;
  let hashName;
  let handler;

  // ensure config dir is available
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

if ( import.meta.url.endsWith(process.argv[1]) ) {
  main();
}

// main functions
  async function main() {
    let ares, arej;
    const pr = new Promise((res, rej) => (ares = res, arej = rej));

    // Yargs configuration
    argv = await yargs(hideBin(process.argv))
      .command('mark', 'Begin marking the passage of time via a verifiable proof-of-time (a "timechain") and record it to file.', {}, (argv) => setTimeout(() => pr.then(() => startTimechainFile(argv)).then(() => process.exit(0)), 0))
      .command('prove', 'Prove recorded time by verifying a timechain file.', {}, (argv) => setTimeout(() => pr.then(() => verifyTimechainFile(argv)).then(({isValid}) => process.exit(isValid ? 0 : 1)), 0))
      .option('in-file', {
        alias: 'i',
        description: 'Timechain file to read',
        type: 'string'
      })
      .option('out-file', {
        alias: 'o',
        description: 'Timechain file to write',
        type: 'string'
      })
      .option('proof-type', {
        alias: 'p',
        description: 'Proof of time method: nonce or iteration',
        default: 'nonce',
        choices: ['nonce', 'iteration']
      })
      .option('mark-every', {
        alias: 'm',
        description: 'Record a computed hash every <mark-every> marks',
        type: 'number',
        default: 1000
      })
      .option('interval', {
        alias: 't',
        description: 'Human-readable desired time interval (e.g., 3 days, 1 hour)',
        type: 'string'
      })
      .option('difficulty', {
        alias: 'd',
        description: 'Desired hash finding difficulty, measured by zero-prefix length.',
        type: 'number'
      })
      .option('format', {
        alias: 'f',
        description: 'Timechain format: json or binary',
        type: 'string',
        default: 'binary'
      })
      .option('marks', {
        alias: 'z',
        description: 'Number of marks to run. Normally this should be unset so it runs until shut down.',
        type: 'number',
        default: Infinity
      })
      .option('use-hash', {
        description: 'Hash function to use',
        type: 'string',
        default: 'rainstorm',
        choices: ['rainstorm', 'sha256']
      })
      .option('first-block', {
        alias: 's',
        description: 'Override the random first block. Useful for sequence-numbered timechains to make the chain deterministic.',
        type: 'string'
      })
      .option('debug-mode', {
        alias: 'v',
        description: 'Enable debug mode',
        type: 'boolean',
        default: false
      })
      .option('parallel', {
        alias: 'k',
        description: 'Enable parallel mode (currently just for verifying iteration proofs)',
        type: 'boolean',
        default: false
      })
      .option('vendor-public-key', {
        description: 'RSA vendor public key for encryption',
        type: 'string',
      })
      .option('client-private-key', {
        description: 'Client secret key for signing',
        type: 'string',
      })
      .option('vendor-private-key', {
        description: 'RSA vendor secret key for decryption',
        type: 'string',
      })
      .option('client-public-key', {
        description: 'Client public key for verification',
        type: 'string',
      })
      .demandCommand(1)
      .help()
      .alias('help', 'h')
      .check(async argv => {
        DEMO = argv._.includes('demo');
        DEBUG = argv.debugMode || DEMO;
        PARALLEL = argv.parallel;
        ENCRYPT = argv.encrypt;
        if ( PARALLEL ) {
          process.stderr.write(`Using parallel mode\n`);
        }
        if (argv._.includes('mark') && !argv.outFile) {
          return new Error('The mark command requires an --out-file to write to.');
        } else if (argv._.includes('prove') && !argv.inFile) {
          return new Error('The prove command requires an --in-file to read from.');
        } else if ((argv._.includes('mark') || argv._.includes('demo')) && argv.proofType == 'nonce' && !argv.interval && !argv.difficulty) {
          return new Error('Specify an --interval or a --difficulty for your nonce-proved timechain.');
        } else if ((argv._.includes('mark') || argv._.includes('demo')) && argv.proofType == 'iteration' && !argv.interval && !argv.markEvery) {
          return new Error('Specify an --interval or a --mark-every for your iteration-proved timechain.');
        }
        if ( argv._.includes('mark') ) {
          if ( ! argv.clientPrivateKey ) {
            return new Error(`The mark command requires a --client-private-key to sign each time record. Provide an ED25519 secret key file.`);
          } 
          if ( ENCRYPT ) {
            if ( ! argv.vendorPublicKey ) {
              return new Error(`The mark command requires a --vendor-public-key to encrypt each time record. Provide an RSA public key file.`);
            }
          }
        }
        if ( argv._.includes('prove') ) {
          /*
          if ( ! argv.clientPublicKey ) {
            return new Error(`The prove command requires a --client-public-key to verify each time record. Provide an ED25519 public key file.`);
          } 
          */
          if ( ENCRYPT ) {
            if ( ! argv.vendorPrivateKey ) {
              return new Error(`The prove command requires a --vendor-private-key to decrypt each time record. Provide an RSA secret key file.`);
            }
          }
        }
        if (argv.inFile) { 
          if (!fs.existsSync(argv.inFile)) {
            return new Error(`In file ${argv.inFile} does not exist.`);
          } else {
            try {
              fs.accessSync(argv.inFile, fs.constants.R_OK);
            } catch {
              return new Error(`In file ${argv.inFile} is not readable.`);
            }
          }
        }
        if (argv.outFile) { 
          if (fs.existsSync(argv.outFile)) {
            try {
              fs.accessSync(argv.outFile, fs.constants.W_OK);
            } catch {
              return new Error(`Out file ${argv.outFile} is not writeable.`);
            }
          }
        }
        if (argv.proofType !== 'iteration' && process.argv.join(' ').includes('--mark-every')) {
          return new Error(`Option --mark-every only applies to --proof-type iteration`);
        }
        argv.marks = argv.marks == Infinity ? argv.marks : BigInt(argv.marks);
        argv.markEvery = BigInt(argv.markEvery);

        // Parse keys
        try {
          if (argv.clientPrivateKey) {
            const parsedClientPrivateKey = await parseKey(argv.clientPrivateKey);
            if (parsedClientPrivateKey.type !== 'ed25519' || !parsedClientPrivateKey.privateKey) {
              return new Error(`The client secret key must be an ED25519 private key.`);
            }
            argv.clientPrivateKey = parsedClientPrivateKey.privateKey;
          }
          if (argv.vendorPublicKey) {
            const parsedVendorPublicKey = await parseKey(argv.vendorPublicKey);
            if (parsedVendorPublicKey.type !== 'rsa' || !parsedVendorPublicKey.publicKey) {
              return new Error(`The vendor public key must be an RSA public key.`);
            }
            argv.vendorPublicKey = parsedVendorPublicKey.publicKey;
          }
          if (argv.clientPublicKey) {
            const parsedClientPublicKey = await parseKey(argv.clientPublicKey);
            if (parsedClientPublicKey.type !== 'ed25519' || !parsedClientPublicKey.publicKey) {
              return new Error(`The client public key must be an ED25519 public key.`);
            }
            argv.clientPublicKey = parsedClientPublicKey.publicKey;
            DEBUG && console.log({parsedClientPublicKey});
          }
          if (argv.vendorPrivateKey) {
            const parsedVendorPrivateKey = await parseKey(argv.vendorPrivateKey);
            if (parsedVendorPrivateKey.type !== 'rsa' || !parsedVendorPrivateKey.privateKey) {
              return new Error(`The vendor secret key must be an RSA private key.`);
            }
            argv.vendorPrivateKey = parsedVendorPrivateKey.privateKey;
          }
          ares();
        } catch(e) {
          console.error(e);
          return arej(e);
        }

        return true;
      })
      .argv;

    FORMAT = path.extname(argv.inFile || argv.outFile || 'file.binary').slice(1) == 'json' ? 'json' : 'binary';
    argv.format = FORMAT;

    hashFunction = argv.useHash?.toLowerCase?.() === 'sha256' ? sha256HashWrapper : rainstormHashWrapper;
    if (argv.useHash?.toLowerCase?.() === 'sha256') {
      console.log(`Using SHA256`);
      hashName = 'sha256';
    } else {
      hashName = 'rainstorm';
    }

    await pr;
  }

  async function generateProofOfTime(initialKey, difficulty, marks, signInterval, proofType, markerInterval) {
    if (proofType === 'nonce') {
      return await generateNonceProofOfTime(initialKey, difficulty, marks, signInterval);
    } else if (proofType === 'iteration') {
      return await generateIterationProofOfTime(initialKey, marks, signInterval, markerInterval);
    }
  }

  async function verifyProofOfTime(entries, proofType) {
    if (proofType === 'nonce') {
      return await verifyNonceProofOfTime(entries);
    } else if (proofType === 'iteration') {
      return await verifyIterationProofOfTime(entries);
    }
  }

// helpers
  async function generateIterationProofOfTime(initialKey, marks, signInterval, markerInterval) {
    let state = initialKey;
    let hashValue;
    let totalTime = 0n;
    let totalIterations = 0n;

    const pubKey = await ed.getPublicKeyAsync(argv.clientPrivateKey);
    let save = initialKey;
    let sequenceCounter;
    let lastSignature = Buffer.alloc(0);

    writeEntry(formatEntry({
      pubKey,
      hashName,
      hashValue: Buffer.from(initialKey),
      markEvery: markerInterval,
      proofType: 'iteration'
    }));

    for (sequenceCounter = 1n; sequenceCounter <= marks; sequenceCounter++) {
      const startTime = process.hrtime.bigint();
      const startDateTime = new Date();

      // Check if there's data in the queue
      let dataBuffer = Buffer.alloc(0);
      if (dataQueue.length > 0) {
        const data = dataQueue.shift(); // Get the next data item
        dataBuffer = data; // Already a Buffer
      }

      save = Buffer.concat([save, lastSignature, dataBuffer]);

      for (let i = 0n; i < markerInterval; i++) {
        hashValue = await hashFunction(new Uint8Array(save));
        save = Buffer.from(hashValue, 'hex');
        totalIterations++;
      }

      const endTime = process.hrtime.bigint();
      const iterationTime = endTime - startTime;
      totalTime += iterationTime;

      if (sequenceCounter % signInterval === 0n) {
        DEBUG && console.log({signData: [
          save.toString('hex'),
          iterationTime.toString(),
          sequenceCounter.toString(),
          startDateTime.toISOString(),
          dataBuffer.length > 0 ? dataBuffer.toString('hex') : ''
        ].join('/')});
        const signData = Buffer.from([
          save.toString('hex'),
          iterationTime.toString(),
          sequenceCounter.toString(),
          startDateTime.toISOString(),
          dataBuffer.length > 0 ? dataBuffer.toString('hex') : ''
        ].join('/'));
        const signature = await sign(signData, argv.clientPrivateKey);
        writeEntry(formatEntry({
          sequenceCounter,
          hashValue: Buffer.from(hashValue, 'hex'),
          signature,
          dateTime: startDateTime,
          iterationTime,
          data: dataBuffer.length > 0 ? dataBuffer : undefined, // Conditionally include data
        }));
        lastSignature = signature;
      } else {
        writeEntry(formatEntry({
          hashValue: Buffer.from(hashValue, 'hex'),
          data: dataBuffer.length > 0 ? dataBuffer : undefined, // Conditionally include data
        }));
      }
    }

    const averageTimePerIteration = totalTime / sequenceCounter;
    return { averageTimePerIteration, totalTime, totalIterations };
  }

  // Timechain proof generation and verification
  async function generateNonceProofOfTime(initialKey, difficulty, marks, signInterval) {
    let state = initialKey;
    let hashValue;
    let nonce;
    let totalTime = 0n;
    let totalIterations = 0n;
    let lastSignature = Buffer.alloc(0);

    marks = BigInt(marks);

    const pubKey = await ed.getPublicKeyAsync(argv.clientPrivateKey);
    let save = Buffer.from(hashValue || initialKey, 'hex');
    let sequenceCounter;

    // Initial entry
    writeEntry(
      formatEntry({
        difficulty,
        pubKey,
        hashName,
        proofType: 'nonce',
        hashValue: Buffer.from(initialKey),
        nonce: crypto.randomBytes(32),
      }),
    );

    for (sequenceCounter = 1n; sequenceCounter <= marks; sequenceCounter++) {
      const startTime = process.hrtime.bigint();
      const startDateTime = new Date();

      // Check if there's data in the queue
      let dataBuffer = Buffer.alloc(0);
      if (dataQueue.length > 0) {
        const data = dataQueue.shift(); // Get the next data item
        dataBuffer = data; // Already a Buffer
      }

      // Include data in hash calculation
      do {
        nonce = crypto.randomBytes(32);
        const combined = Buffer.concat([save, lastSignature, nonce, dataBuffer]);
        hashValue = await hashFunction(new Uint8Array(combined));
        totalIterations++;
      } while (!hashValue.startsWith('0'.repeat(difficulty)));

      const endTime = process.hrtime.bigint();
      const iterationTime = endTime - startTime;
      totalTime += iterationTime;

      if (sequenceCounter % signInterval === 0n) {
        const signData = Buffer.from([
          save.toString('hex'),
          nonce.toString('hex'),
          iterationTime.toString(),
          sequenceCounter.toString(),
          startDateTime.toISOString(),
          dataBuffer.length > 0 ? dataBuffer.toString('hex') : ''
        ].join('/'));
        const signature = await sign(signData, argv.clientPrivateKey);
        writeEntry(formatEntry({
          sequenceCounter,
          nonce,
          hashValue: save,
          signature,
          dateTime: startDateTime,
          iterationTime,
          data: dataBuffer.length > 0 ? dataBuffer : undefined, // Conditionally include data
        }));
        lastSignature = signature;
      } else {
        writeEntry(formatEntry({
          hashValue: save,
          nonce,
          data: dataBuffer.length > 0 ? dataBuffer : undefined, // Conditionally include data
        }));
      }
      save = Buffer.from(hashValue, 'hex');
    }

    const averageTimePerMark = totalTime / sequenceCounter;
    return { averageTimePerMark, totalTime, totalIterations };
  }

  async function verifyIterationProofOfTime(entries, { entry = null, timeProved = 0n } = {}) {
    if ( PARALLEL ) return verifyIterationProofOfTimeParallel(entries, {entry, timeProved});
    let i = 0n;
    let nextEntry;
    let ProofType;
    if (!entry) {
      entry = (await entries.next());
      if (entry.done) return { isValid: false };
      entry = unformatEntry(entry.value);
    }

    bigLoop: while (true) {
      const { proofType, hashName, pubKey: pubKeyArray, markEvery, hashValue } = entry;
      if (proofType !== "iteration") return verifyNonceProofOfTime(entries, { entry, timeProved });
      ProofType = proofType;
      let pubKey = Buffer.from(pubKeyArray, 'base64url');
      DEBUG && console.log(pubKey);
      if (argv.clientPublicKey && !pubKey.equals(argv.clientPublicKey)) {
        DEBUG && console.log(`Client public key is not equal to record`, pubKey, argv.clientPublicKey);
        return { isValid: false };
      }
      hashFunction = hashName === 'sha256' ? sha256HashWrapper : rainstormHashWrapper;
      nextEntry = entry;
      let initialKey = Buffer.from(hashValue, 'hex'); // Set initialKey to hashValue of the first record
      let lastSignature = Buffer.alloc(0);
      let candidateHash = initialKey;

      while (true) {
        i++;
        entry = nextEntry;
        const { hashValue, data } = entry;
        nextEntry = await entries.next();
        if (nextEntry.pubKey) {
          DEBUG && console.log('Continuing bigLoop');
          entry = nextEntry;
          pubKey = nextEntry.pubKey;
          continue bigLoop;
        } else if (hashValue) {
          DEBUG && console.log('Valid', { hashValue });

          if (entry.signature) {
            const { sequenceCounter, signature, iterationTime, dateTime } = entry;
            DEBUG && console.log('Verifying iteration signature:', { sequenceCounter, signature, iterationTime, dateTime, hashValue, data, });

            if (entry.hashValue !== hashValue) {
              DEBUG && console.log('Invalid sequence at:', sequenceCounter);
              return { isValid: false };
            }

            DEBUG && console.log({signData: [
              hashValue.toString('hex'),
              iterationTime.toString(),
              sequenceCounter.toString(),
              dateTime.toISOString(),
              data ? data.toString('hex') : ''
            ].join('/')});
            const signData = Buffer.from([
              hashValue.toString('hex'),
              iterationTime.toString(),
              sequenceCounter.toString(),
              dateTime.toISOString(),
              data ? data.toString('hex') : ''
            ].join('/'));
            lastSignature = Buffer.from(signature, 'hex');
            const isValidSignature = await verify(
              signData,
              lastSignature,
              pubKey
            );
            DEBUG && console.log('Iteration Signature valid:', isValidSignature);
            if (!isValidSignature) return { isValid: false };
          }
          candidateHash = Buffer.concat([candidateHash, lastSignature, data || Buffer.alloc(0)]);

          for (let j = 0n; j < markEvery; j++) {
            candidateHash = await hashFunction(new Uint8Array(candidateHash));
            candidateHash = Buffer.from(candidateHash, 'hex');
          }
          if (nextEntry?.value?.iterationTime) {
            timeProved += BigInt(nextEntry.value.iterationTime);
            DEBUG && console.log(`Time proved added`, {timeProved}, "iteration time", nextEntry.value.iterationTime);
          } else {
            DEBUG && console.log(`Next entry no time`, {nextEntry});
          }
        } 
        if (!nextEntry || nextEntry.done) {
          DEBUG && console.log('Break bigLoop');
          break bigLoop;
        }
        nextEntry = unformatEntry(nextEntry.value);
        if (nextEntry.pubKey) {
          DEBUG && console.log('Continuing bigLoop at no hash value', {nextEntry});
          entry = nextEntry;
          continue bigLoop;
        }
        const nextHashValue = nextEntry.hashValue.toString('hex');
        initialKey = Buffer.from(nextHashValue, 'hex');
        if (candidateHash.toString('hex') !== nextHashValue) {
          console.log('Iteration Out of sync:', { index: i, hashValue, nextHashValue, candidateHash: candidateHash.toString('hex') });
          return { isValid: false };
        }
      }
      DEBUG && console.log('Break bigLoop');
      break bigLoop;
    }

    Proofs.push(ProofType);
    return { isValid: true, timeProved };
  }

  async function verifyNonceProofOfTime(entries, { entry = null, timeProved = 0n } = {}) {
    let i = 0n;
    let nextEntry;
    let ProofType;
    if (!entry) {
      entry = (await entries.next());
      if (entry.done) return { isValid: false };
      entry = unformatEntry(entry.value);
    }
    bigLoop: while (true) {
      const { proofType, hashName, difficulty, pubKey: pubKeyArray } = entry;
      if (proofType !== "nonce") return verifyIterationProofOfTime(entries, { entry, timeProved });
      ProofType = proofType;
      let pubKey = Buffer.from(pubKeyArray, 'base64url');
      DEBUG && console.log(pubKey);
      if (argv.clientPublicKey && !pubKey.equals(argv.clientPublicKey)) {
        DEBUG && console.log(`Client public key is not equal to record`, pubKey, argv.clientPublicKey);
        return { isValid: false };
      }
      hashFunction = hashName === 'sha256' ? sha256HashWrapper : rainstormHashWrapper;
      nextEntry = unformatEntry((await entries.next()).value);
      let lastSignature = Buffer.alloc(0);
      let initialKey = Buffer.from(nextEntry.hashValue, 'hex'); // Set initialKey to hashValue of the first record
      while (true) {
        i++;
        entry = nextEntry;
        const { hashValue, nonce, data } = entry;
        nextEntry = await entries.next();
        if (!nextEntry || nextEntry.done) {
          DEBUG && console.log('Break bigLoop');
          break bigLoop;
        }
        nextEntry = unformatEntry(nextEntry.value);
        if (nextEntry.pubKey) {
          DEBUG && console.log('Continuing bigLoop');
          entry = nextEntry;
          pubKey = nextEntry.pubKey;
          continue bigLoop;
        } else if (nextEntry.hashValue) {
          const nextHashValue = nextEntry.hashValue.toString('hex');
          const combined = Buffer.concat([initialKey, lastSignature, nonce, data || Buffer.alloc(0)]);
          const candidateHash = await hashFunction(new Uint8Array(combined));

          if (!nextHashValue.startsWith('0'.repeat(difficulty)) || candidateHash !== nextHashValue) {
            console.log('Nonce Out of sync:', { nextEntry, index: i, hashValue, nonceHex: nonce.toString('hex'), nextHashValue, candidateHash, difficulty, lastSignature });
            return { isValid: false };
          }
          DEBUG && console.log('Valid', { hashValue, nonce: nonce.toString('hex') });
          initialKey = Buffer.from(nextHashValue, 'hex');
          if (entry.signature) {
            const { sequenceCounter, signature, iterationTime, dateTime } = entry;
            DEBUG && console.log('Verifying nonce signature:', { sequenceCounter, hashValue, signature });

            if (entry.hashValue !== hashValue) {
              DEBUG && console.log('Invalid sequence at:', sequenceCounter);
              return { isValid: false };
            }

            const signData = Buffer.from([
              hashValue.toString('hex'),
              nonce.toString('hex'),
              iterationTime.toString(),
              sequenceCounter.toString(),
              dateTime.toISOString(),
              data ? data.toString('hex') : ''
            ].join('/'));
            lastSignature = Buffer.from(signature, 'hex');
            const isValidSignature = await verify(
              signData,
              lastSignature,
              pubKey
            );
            DEBUG && console.log('Nonce Signature valid:', isValidSignature);
            if (!isValidSignature) return { isValid: false };
          }
          if (nextEntry?.iterationTime) {
            timeProved += BigInt(nextEntry.iterationTime);
            DEBUG && console.log(`Time proved added`, {timeProved}, "iteration time", nextEntry.iterationTime);
          } else {
            DEBUG && console.log(`Next entry no time`, {nextEntry});
          }
        } 
      }
      DEBUG && console.log('Break bigLoop');
      break bigLoop;
    }

    Proofs.push(ProofType);
    return { isValid: true, timeProved };
  }

  function writeEntry(...es) {
    for (const e of es) {
      if (argv.format === 'binary') {
        if (e.pubKey) e.pubKey = Buffer.from(e.pubKey);
        if (e.signature) e.signature = Buffer.from(e.signature);
        if (e.data) e.data = Buffer.from(e.data);
        if (typeof e.data == "undefined") {
          delete e.data;
        }
        if (ENCRYPT) {
          e[BinaryHandler.hard] = true;
          handler.hpojo(e);
        } else {
          handler.pojo(e);
        }
      } else if (argv.format === 'json') {
        if (ENCRYPT) {
          const encrypted = handler.rsaEncrypt(argv.vendorPublicKey, Buffer.from(JSON.stringify(e)));
          handler.cursor += fs.writeSync(handler.fd, encrypted.toString('base64') + '\n', handler.cursor);
        } else {
          handler.cursor += fs.writeSync(handler.fd, JSON.stringify(e) + '\n', handler.cursor);
        }
      } else if (argv.format === 'estimate') {
        Estimate.push(e);
      } else {
        throw new Error(`Invalid format for entry write: ${argv.format}`);
      }
    }
  }

  function formatEntry(e) {
    if (argv.format === 'binary') {
      if (e.pubKey) e.pubKey = Buffer.from(e.pubKey);
      if (e.signature) e.signature = Buffer.from(e.signature);
      if (e.data) e.data = Buffer.from(e.data); // Include data as Buffer
    } else {
      if (e.dateTime) e.dateTime = e.dateTime.toISOString();
      if ('markEvery' in e) e.markEvery = e.markEvery.toString();
      if ('sequenceCounter' in e) e.sequenceCounter = e.sequenceCounter.toString();
      if (e.pubKey) e.pubKey = Buffer.from(e.pubKey).toString('base64url');

      // Include 'data' in the list
      for (const key of ['signature', 'nonce', 'hashValue', 'data']) {
        if (e[key]) e[key] = Buffer.from(e[key]).toString('hex');
      }
      for (const key of ['dateTime', 'iterationTime']) {
        if (e[key]) e[key] = e[key].toString();
      }
    }
    return e;
  }

  function unformatEntry(e) {
    if (argv.format === 'json') {
      if (e.pubKey) e.pubKey = Buffer.from(e.pubKey, 'base64url');
      if (e.nonce) e.nonce = Buffer.from(e.nonce, 'hex');
      if (e.data) e.data = Buffer.from(e.data, 'hex'); // Parse data from hex
      if (e.dateTime) e.dateTime = new Date(e.dateTime);
      if (e.sequenceCounter) e.sequenceCounter = BigInt(e.sequenceCounter);
      if (e.markEvery) e.markEvery = BigInt(e.markEvery);
    } else {
      // Binary format handling (if needed)
      // Implement parsing logic for binary format if data is included
      if (e.data) {
        // Example: Convert Buffer back to string or appropriate format
        e.data = e.data.toString(); // Adjust as needed
      }
    }
    return e;
  }

  // holy shit, human readable time is actually a base (as in a radix). Look at the conversion! It's exactly the same. :)
    function formatHumanReadableTime(ns) {
      if ( ns === 0n ) return 'no time at all';
      const units = [
        { label: 'years', value: 31104000000000000n },
        { label: 'months', value: 2592000000000000n },
        { label: 'weeks', value: 604800000000000n },
        { label: 'days', value: 86400000000000n },
        { label: 'hours', value: 3600000000000n },
        { label: 'minutes', value: 60000000000n },
        { label: 'seconds', value: 1000000000n },
        { label: 'milliseconds', value: 1000000n },
        { label: 'microseconds', value: 1000n },
        { label: 'nanoseconds', value: 1n }
      ];

      let remainingTime = ns;
      let result = [];

      for (const { label, value } of units) {
        if (remainingTime >= value) {
          const amount = remainingTime / value;
          remainingTime = remainingTime % value;
          result.push(`${amount} ${label}`);
        }
      }

      if ( result.length > 1 ) {
        const last = result.pop();
        return result.join(', ') + ' and ' + last;
      } else return result[0];
    }

  // Hash function wrappers
  async function rainstormHashWrapper(input) {
    return rainstormHash(256, 0, input);
  }

  async function sha256HashWrapper(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  // Interval parsing and difficulty estimation
  function parseIntervalToNanoseconds(interval) {
    const unitMultipliers = {
      'ns': 1n,
      'microsecond': 1000n,
      'microseconds': 1000n,
      'ms': 1000000n,
      'second': 1000000000n,
      'seconds': 1000000000n,
      'minute': 60000000000n,
      'minutes': 60000000000n,
      'hour': 3600000000000n,
      'hours': 3600000000000n,
      'day': 86400000000000n,
      'days': 86400000000000n,
      'week': 604800000000000n,
      'weeks': 604800000000000n,
      'month': 2592000000000000n,
      'months': 2592000000000000n,
      'year': 31104000000000000n,
      'years': 31104000000000000n,
    };

    const [value, unit] = interval.trim().match(/\s+/) ? interval.split(/\s+/) : [parseFloat(interval), interval.replace(/[\d\.]/g, '')];
    DEBUG && console.log({value, unit});
    const unitLower = unit.toLowerCase();
    const valueBigNum = BigInt(Math.round(parseFloat(value)));

    if (valueBigNum == 0n) {
      console.warn(argv, process.argv);
      throw new Error(`Cannot work with zero interval: ${value} (${interval})`);
    }

    if (!unitMultipliers[unitLower]) {
      throw new Error(`Invalid interval unit: ${unit}`);
    }

    const result = valueBigNum * unitMultipliers[unitLower];
    DEBUG && console.log({ result, valueBigNum, unitLower });
    return result;
  }

  function formatTime(timeInNanoseconds) {
    const units = [
      { label: 'ns', value: 1n },
      { label: 'microseconds', value: 1000n },
      { label: 'ms', value: 1000000n },
      { label: 'seconds', value: 1000000000n },
      { label: 'minutes', value: 60000000000n },
      { label: 'hours', value: 3600000000000n },
      { label: 'days', value: 86400000000000n },
      { label: 'months', value: 2592000000000000n },
      { label: 'years', value: 31104000000000000n },
    ];

    for (let i = units.length - 1; i >= 0; i--) {
      if (timeInNanoseconds >= units[i].value) {
        return `${(Number(timeInNanoseconds) / Number(units[i].value)).toFixed(3)} ${units[i].label}`;
      }
    }
    return `${timeInNanoseconds} ns`;
  }

  async function* readEntries(file, format) {
    handler = new BinaryHandler(BH_OPTS);
    if (format === 'json') {
      const stream = fs.createReadStream(file, { encoding: 'utf-8' });
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk;
        let boundary = buffer.indexOf('\n');

        while (boundary !== -1) {
          let entry;
          if ( ENCRYPT ) {
            const encrypted = Buffer.from(buffer.slice(0, boundary), 'base64');
            const decrypted = handler.rsaDecrypt(argv.vendorPrivateKey, encrypted).toString();
            entry = JSON.parse(decrypted);
          } else {
            entry = JSON.parse(buffer.slice(0, boundary));
          }
          yield entry;
          buffer = buffer.slice(boundary + 1);
          boundary = buffer.indexOf('\n');
        }
      }
    } else {
      await handler.setPrivateKey(argv.vendorPrivateKey);
      handler.openFile(file);
      handler.readMagic('TIME');
      let entry;

      while (!handler.isEOF()) {
        if ( ENCRYPT ) {
          entry = await handler.hpojo().last.value;
        } else {
          entry = await handler.pojo().last.value;
        }
        yield entry;
      }

      handler.closeFile();
    }
  }

  /**
   * Adds data to the data queue.
   * @param {any} data - The data to be included in the next log entry.
   */
  function addData(data) {
    // Serialize data as JSON and convert to Buffer
    const dataJSON = JSON.stringify(data);
    const dataBuffer = Buffer.from(dataJSON);
    dataQueue.push(dataBuffer);
  }

  // Timechain file operations
    async function startTimechainFile(argv) {
      const marks = argv.marks || Infinity;  // For demonstration, using a smaller number than a billion
      const initialKey = argv.firstBlock ? Buffer.from(argv.firstBlock) : crypto.randomBytes(32);
      const difficulty = await getDifficulty(argv);
      handler = new BinaryHandler(BH_OPTS);
      if ( ENCRYPT ) {
        await handler.setPublicKey(argv.vendorPublicKey);
      }
      handler.openFile(argv.outFile, {append:true});
      if (argv.format == 'binary') {
        if ( handler.cursor == 0 ) {
          handler.writeMagic('TIME');
        }
      }
      const { totalTime, totalIterations } = await generateProofOfTime(initialKey, difficulty, marks, signInterval, argv.proofType, argv.markEvery);
      handler.closeFile();

      console.log(`Timechain record written to ${argv.outFile}`);

      if ( argv.proofType == 'nonce' ) {
        const estimatedTimes = estimateTimes(difficulty, marks, totalTime, totalIterations);
        if ( estimatedTimes ) {
          fs.writeFileSync(timeEstimatesFile(argv.proofType), JSON.stringify(estimatedTimes, null, 2));
        }
      } else if ( argv.proofType == 'iteration' ) {
        const estimatedTimes = estimateTimesForIteration(totalTime, totalIterations);
        if ( estimatedTimes ) {
          fs.writeFileSync(timeEstimatesFile(argv.proofType), JSON.stringify(estimatedTimes, null, 2));
        }
      }
    }

    async function verifyTimechainFile(argv) {
      Proofs = [];
      const { isValid, timeProved } = await verifyProofOfTime(readEntries(argv.inFile, argv.format), argv.proofType);
      console.log(`Proof of Time is ${isValid ? 'valid' : 'invalid'}`);
      if ( isValid ) {
        console.log(`Time proved: ${
            formatHumanReadableTime(timeProved)
          } (${
            Proofs.every(proof => proof == 'iteration') ? 
            'strong guarantee: iteration-based proof' 
            : 
            'weak guarantee: nonce-based proof'
          })`
        );
      }
      return { isValid, timeProved };
    }

  // Difficulty selection based on interval
    async function selectDifficultyBasedOnInterval(interval) {
      if (fs.existsSync(timeEstimatesFile(argv.proofType))) {
        const estimates = JSON.parse(fs.readFileSync(timeEstimatesFile(argv.proofType), 'utf-8'));
        return findClosestDifficulty(interval, estimates);
      } else if ( argv.proofType == 'nonce' ) {
        const marks = 10n;
        const initialKey = crypto.randomBytes(32);
        const difficulty = 4;
        const oFormat = argv.format;
        const oProof = argv.proofType;
        Estimate = [];
        argv.format = 'estimate'; // don't write anything to a file

        const { totalTime, totalIterations } = await generateProofOfTime(initialKey, difficulty, marks, signInterval, 'nonce');
        DEBUG && console.log({totalTime, totalIterations});
        const estimatedTimes = estimateTimes(difficulty, marks, totalTime, totalIterations);
        fs.writeFileSync(timeEstimatesFile(argv.proofType), JSON.stringify(estimatedTimes, null, 2));

        argv.format = oFormat; // restore original format
        argv.proofType = oProof;

        console.log(`Benchmark completed for ${hashName} hash and estimated times saved.`);
        console.log('Estimated times for difficulties 4 through 12:', estimatedTimes);
        return findClosestDifficulty(interval, estimatedTimes);
      } else {
        throw new TypeError(`Difficulty cannot be used with non-"nonce" proof types`);
      }
    }

    async function selectMarkEveryBasedOnInterval(interval) {
      if (fs.existsSync(timeEstimatesFile(argv.proofType))) {
        const estimates = JSON.parse(fs.readFileSync(timeEstimatesFile(argv.proofType), 'utf-8'));
        return findClosestMarkEvery(interval, estimates);
      } else if ( argv.proofType == 'iteration' ) {
        const marks = 10n;
        const initialKey = crypto.randomBytes(32);
        const difficulty = 4;
        const oFormat = argv.format;
        Estimate = [];
        argv.format = 'estimate'; // don't write anything to a file
        const oProof = argv.proofType;

        const { totalTime, totalIterations } = await generateProofOfTime(initialKey, difficulty, marks, signInterval, 'iteration', 20000n);
        DEBUG && console.log({totalTime, totalIterations});
        const estimatedTimes = estimateTimes(difficulty, marks, totalTime, totalIterations);
        fs.writeFileSync(timeEstimatesFile(argv.proofType), JSON.stringify(estimatedTimes, null, 2));

        argv.format = oFormat; // restore originals
        argv.proofType = oProof;

        console.log(`Benchmark completed for ${hashName} hash and estimated times saved.`);
        console.log('Estimated times for difficulties 4 through 12:', estimatedTimes);
        return findClosestMarkEvery(interval, estimatedTimes);
      } else {
        throw new TypeError(`Mark every cannot be used with non-"iteration" proof types`);
      }
    }

    async function getDifficulty(argv) {
      // Check if the interval option is provided
      let difficulty;
      if (argv.interval && argv.proofType == 'nonce') {
        const interval = parseIntervalToNanoseconds(argv.interval);
        const estimate = await selectDifficultyBasedOnInterval(interval);
        difficulty = estimate.difficulty;
        console.log(`Selected difficulty: ${difficulty} for interval: ${argv.interval} (${difficulty} is approximately ${estimate.estimatedTime})`);
      } else if (argv.interval && argv.proofType == 'iteration') {
        const interval = parseIntervalToNanoseconds(argv.interval);
        const estimate = await selectMarkEveryBasedOnInterval(interval);
        difficulty = estimate.markEvery;
        if ( difficulty == undefined ) {
          throw new Error(`Trouble with getting mark every for iteration proof`);
        }
        argv.markEvery = difficulty;
        console.log(`Selected mark every: ${difficulty} for interval: ${argv.interval} (${difficulty} iterations is approximately ${argv.interval})`);
      } else if (argv.difficulty && Number.isInteger(parseInt(argv.difficulty))) {
        difficulty = parseInt(argv.difficulty);
      } else if (argv.markEvery && argv.proofType == 'iteration') {
        difficulty = parseInt(argv.markEvery);
      } else {
        throw new Error(`Specify an interval or difficulty`);
      }
      return difficulty;
    }

    function findClosestDifficulty(interval, estimates) {
      estimates.forEach(e => {
        e.estimatedNSTime = parseIntervalToNanoseconds(e.estimatedTime);
        e.estimatedIterations = parseFloat(e.estimatedIterations);
        e.difficulty = parseFloat(e.difficulty);
      });
      let closest = estimates[0];
      let closestRatio = Infinity;
      for (const estimate of estimates) {
        const ratio = estimate.estimatedNSTime > interval ? Number(estimate.estimatedNSTime) / Number(interval) : Number(interval) / Number(estimate.estimatedNSTime);
        if (ratio < closestRatio) {
          DEBUG && console.log('estimate', estimate, 'closer to interval', interval, 'than estimate', closest);
          closest = estimate;
          closestRatio = ratio;
        }
      }
      return closest;
    }

    function findClosestMarkEvery(interval, estimates) {
      estimates.forEach(e => {
        e.estimatedNSTime = parseIntervalToNanoseconds(e.estimatedTime);
        e.estimatedIterations = parseFloat(e.estimatedIterations);
        e.difficulty = parseFloat(e.difficulty);
      });
      let closest = estimates[0];
      let closestRatio = Infinity;
      for (const estimate of estimates) {
        const ratio = estimate.estimatedNSTime > interval ? Number(estimate.estimatedNSTime) / Number(interval) : Number(interval) / Number(estimate.estimatedNSTime);
        if (ratio < closestRatio) {
          DEBUG && console.log('estimate', estimate, 'closer to interval', interval, 'than estimate', closest);
          closest = estimate;
          closestRatio = ratio;
        }
      }
      const ratio = Number(interval)/Number(closest.estimatedNSTime);
      const markEvery = ratio * Number(closest.estimatedIterations);
      closest.markEvery = BigInt(Math.max(1, Math.round(markEvery)));
      return closest;
    }

    function estimateTimes(baselineDifficulty, marks, totalTime, totalIterations) {
      if ( totalTime > MAX_SAFE_NUM || totalIterations > MAX_SAFE_NUM ) return false;
      baselineDifficulty = BigInt(baselineDifficulty);
      marks = BigInt(marks);
      const times = [];
      for (let diff = 1n; diff <= 12n; diff++) {
        let estimatedTime;
        let estimatedIterations;
        if (diff < baselineDifficulty) {
          estimatedTime = Number(totalTime / marks) / Number(16n ** (baselineDifficulty - diff));
          estimatedIterations = Number(totalIterations / BigInt(marks)) / Number(16n ** (baselineDifficulty - diff));
        } else if (diff > baselineDifficulty) {
          estimatedTime = Number(16n ** (diff - baselineDifficulty)) * Number(totalTime / marks);
          estimatedIterations = Number(16n ** (diff - baselineDifficulty)) * Number(totalIterations / BigInt(marks));
        } else {
          estimatedTime = Number(totalTime / marks);
          estimatedIterations = Number(totalIterations / marks);
        }
        times.push({ difficulty: diff.toString(), estimatedTime: formatTime(estimatedTime), estimatedIterations: estimatedIterations.toString() });
      }
      return times;
    }

    function estimateTimesForIteration(totalTime, totalIterations) {
      if ( totalTime > MAX_SAFE_NUM || totalIterations > MAX_SAFE_NUM ) return false;
      const timePerIteration = BigInt(Math.round(Number(totalTime)/Number(totalIterations)));
      let cost = 16n;
      const times = [];
      for (let diff = 1n; diff <= 12n; diff++) {
        const estimatedTime = timePerIteration * cost;
        const estimatedIterations = cost;
        times.push({ difficulty: diff.toString(), estimatedTime: formatTime(estimatedTime), estimatedIterations: estimatedIterations.toString() });
        cost *= 16n;
      }
      return times;
    }

// parallel
  /**
   * verifyIterationProofOfTimeParallel
   * Reads all iteration-based entries into an array, then uses a pool of workers
   * to verify each pair of consecutive records in parallel.
   *
   * If any record fails, the entire chain is deemed invalid.
   */
  export async function verifyIterationProofOfTimeParallel(entries, { entry = null, timeProved = 0n } = {}) {
    const numCPUs = os.cpus().length;
    let isValidChain = true;
    let totalTimeProved = timeProved;
    let pubKey;
    let hashName;
    let markEvery;

    // We'll accumulate iteration-based records
    const records = [];

    if ( entry ) {
      records.push(entry);
    }

    while(true) {
      const ne = (await entries.next());
      if (ne.done) break;
      const e = unformatEntry(ne.value);
      if ( e.proofType != "iteration" ) return verifyNonceProofOfTime(entries, { entry: e, timeProved });
      records.push(unformatEntry(ne.value));
    }

    // 2. Prepare "jobs". Each job verifies the link between records[i] and records[i+1].
    const jobs = [];
    for (let i = 0; i < records.length - 1; i++) {
      if ( records[i].pubKey ) {
        pubKey = Buffer.from(records[i].pubKey, 'base64url');
      }
      if ( records[i].hashName ) {
        hashName = records[i].hashName.toLocaleLowerCase();
      }
      if ( records[i].markEvery ) {
        markEvery = records[i].markEvery.toString();
      }
      if (argv.clientPublicKey && !pubKey.equals(argv.clientPublicKey)) {
        DEBUG && console.log(`Client public key is not equal to record`, pubKey, argv.clientPublicKey);
        return { isValid: false };
      }
      if ( records[i].hashValue && ! records[i+1].pubKey ) {
        jobs.push({
          pubKey,
          current: records[i],
          next: records[i+1],
        });
      }
    }

    // We'll track how many active workers
    let activeWorkers = 0;
    let jobIndex = 0;
    let rejected = false;

    // A wrapper promise so we can resolve when done
    return new Promise((resolve, reject) => {
      const spawnWorker = () => {
        if (rejected) return;
        if (jobIndex >= jobs.length) {
          // All jobs are assigned; if no workers left running, we are done
          if (activeWorkers === 0) {
            resolve({ isValid: isValidChain, timeProved: totalTimeProved });
          }
          return;
        }

        const job = jobs[jobIndex++];
        activeWorkers++;

        const workerData = {
          entry: {
            proofType: job.current.proofType,
            hashName: job.current.hashName,
            hashValue: job.current.hashValue,
            signature: job.current.signature,
            iterationTime: job.current.iterationTime,
            sequenceCounter: job.current.sequenceCounter,
            dateTime: job.current.dateTime,
            data: job.current.data
          },
          hashName,
          markEvery,
          clientPublicKey: job?.pubKey?.toString?.('base64url'),
          nextHashValue: job.next.hashValue
        };

        const worker = new Worker(path.resolve(__dirname(), 'tc_parallel_verify_worker.js'), {
          workerData
        });

        worker.on('message', (res) => {
          activeWorkers--;
          if (!res.valid) {
            isValidChain = false;
            rejected = true;
            // Terminate all workers in progress
            worker.terminate();
            // In a bigger system, track them all & terminate
            if ( res.error ) {
              console.warn(res.error);
            }
            return reject(new Error(`Invalid proof: ${res.reason}`));
          } else {
            // Mark success, add iterationTime to total
            totalTimeProved += BigInt(job.next.iterationTime);
            // Spawn next worker
            spawnWorker();
            // If no more jobs and no active workers, we are done
            if (jobIndex >= jobs.length && activeWorkers === 0) {
              resolve({ isValid: isValidChain, timeProved: totalTimeProved });
            }
          }
        });

        worker.on('error', (err) => {
          activeWorkers--;
          rejected = true;
          isValidChain = false;
          return reject(err);
        });

        worker.on('exit', (code) => {
          if (code !== 0 && !rejected) {
            rejected = true;
            isValidChain = false;
            return reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      };

      // Start up to numCPUs workers in parallel
      const limit = Math.min(numCPUs, jobs.length);
      process.stderr.write(`Using ${limit} parallel workers.\n`);
      for (let i = 0; i < limit; i++) {
        spawnWorker();
      }
    });
  }

// Exports functions for library use
export { generateProofOfTime, verifyProofOfTime, estimateTimes, addData };

