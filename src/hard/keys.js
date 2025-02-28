#!/usr/bin/env node

// imports
  import { fileURLToPath } from 'url';
  import { basename, resolve, dirname } from 'path';
  import crypto from 'crypto';
  import fs from 'fs';
  import { Buffer } from 'buffer';
  import sshpk from 'sshpk';
  import * as ed from '@noble/ed25519';

// Meta properties
  const __scriptname = process.argv[1];
  const __filename = fileURLToPath(import.meta.url);
  const __thisfile = __filename;
  const __dirname = dirname(__filename);
  const __cli = __scriptname == __filename;
  const __imported = !__cli;

// constants
  const DEBUG = process.env.KEY_PARSER_DEBUG || false;

  const ParseFuncs = [
    buf => crypto.createPrivateKey({ key: buf, format: 'pem' }),
    buf => crypto.createPublicKey({ key: buf, format: 'pem' }),
    buf => crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' }),
    buf => crypto.createPublicKey({ key: buf, format: 'der', type: 'spki' }),
    buf => crypto.createPrivateKey({ key: buf, format: 'jwk' }),
    buf => crypto.createPublicKey({ key: buf, format: 'jwk' }),
    buf => crypto.createPrivateKey({ key: JSON.parse(buf.toString('utf8')), format: 'jwk' }),
    buf => crypto.createPublicKey({ key: JSON.parse(buf.toString('utf8')), format: 'jwk' }),
    buf => sshpk.parseKey(buf, 'auto'),
    buf => sshpk.parsePrivateKey(buf, 'auto'),
  ];

// main function
  export async function parseKey(filePath) {
    filePath = resolve(filePath);
    const keyData = fs.readFileSync(filePath);
    if (keyData.toString('utf8').trim().length == 0) return { empty: true };

    let keyObject;
    for (const parse of ParseFuncs) {
      try {
        keyObject = await parse(keyData);
        DEBUG && console.info(`Parsing key ${filePath} succeeded with `, parse.toString());
        break;
      } catch (e) {
        DEBUG && console.warn(`Parsing key ${filePath} failed with `, parse.toString());

        const keyString = keyData.toString();
        if (keyString.includes("BEGIN") || keyString.includes("END")) {
          const lines = keyString.split('\n');
          const keyStringWithoutBeginEnd = lines.slice(1, -1).join('\n');
          const keyStringSingleLine = lines.slice(1, -1).join('');

          const altBuffers = [
            Buffer.from(keyStringWithoutBeginEnd),
            Buffer.from(keyStringSingleLine, 'base64')
          ];

          for (const altBuf of altBuffers) {
            try {
              keyObject = await parse(altBuf);
              DEBUG && console.info(`Alternate parsing of ${filePath} succeeded with `, parse.toString());
              break;
            } catch (altE) {
              DEBUG && console.warn(`Alternate parsing of ${filePath} failed with `, parse.toString());
              continue;
            }
          }

          if (keyObject) break;
        }

        if (!keyObject && (filePath.endsWith('.der') || keyString.includes('RSA PRIVATE KEY'))) {
          try {
            keyObject = crypto.createPrivateKey({ key: keyData, format: 'der', type: 'pkcs1' });
            DEBUG && console.info(`Parsing RSA private key ${filePath} as DER format with pkcs1 succeeded.`);
            break;
          } catch (rsaDerE) {
            DEBUG && console.warn(`Parsing RSA private key ${filePath} as DER format with pkcs1 failed.`);
          }
        }

        continue;
      }
    }

    let convertedKeys;
    if (keyObject) {
      try {
        convertedKeys = await convertKeyToSupportedFormat(keyObject);
      } catch (e) {
        DEBUG && console.error(`Converting key ${filePath} to supported format failed:`, e);
      }
    }

    return {
      keyObject,
      type: convertedKeys ? convertedKeys.type : null,
      privateKey: convertedKeys ? convertedKeys.privateKey : null,
      publicKey: convertedKeys ? convertedKeys.publicKey : null,
    };
  }

// helper
  async function convertKeyToSupportedFormat(keyObject) {
    let privateKey, publicKey, type;
    if (keyObject instanceof sshpk.PrivateKey) {
      if (keyObject.type === 'rsa') {
        type = 'rsa';
        const pem = keyObject.toString('pem');
        privateKey = crypto.createPrivateKey(pem);
        publicKey = crypto.createPublicKey(privateKey);
      } else if (keyObject.type == 'ed25519') {
        type = 'ed25519';
        privateKey = Buffer.from(keyObject.part.k.data);
        publicKey = Buffer.from(keyObject.part.A.data);
      }
    } else if (keyObject instanceof sshpk.Key) {
      if (keyObject.type === 'ed25519') {
        type = 'ed25519';
        if (keyObject.source) {
          privateKey = Buffer.from(keyObject.source.part.k.data);
          publicKey = Buffer.from(keyObject.source.part.A.data);
        } else {
          publicKey = Buffer.from(keyObject.part.A.data);
        }
      } else if (keyObject.type === 'rsa') {
        type = 'rsa';
        if (keyObject.source && keyObject.source instanceof sshpk.PrivateKey) {
          const priv_pem = keyObject.source.toString('pem');
          privateKey = crypto.createPrivateKey(priv_pem);
        }
        const pem = keyObject.toString('pem');
        publicKey = crypto.createPublicKey(pem);
      }
    } else if (keyObject instanceof crypto.KeyObject) {
      if (keyObject.asymmetricKeyType === 'ed25519') {
        type = 'ed25519';
        if (keyObject.type == 'private') {
          const jwk = keyObject.export({ format: 'jwk' });
          privateKey = Buffer.from(jwk.d, 'base64');
          publicKey = crypto.createPublicKey(keyObject);
        } else {
          publicKey = keyObject;
        }
        const pjwk = publicKey.export({ format: 'jwk' });
        publicKey = Buffer.from(pjwk.x, 'base64');
      } else if (keyObject.asymmetricKeyType === 'rsa') {
        type = 'rsa';
        if (keyObject.type == 'private') {
          privateKey = keyObject;
          publicKey = crypto.createPublicKey(keyObject);
        } else {
          publicKey = keyObject;
        }
      }
    } else {
      console.log('unknown key type');
    }
    return { privateKey, publicKey, type };
  }

// cryptographic tools
  // Ed25519 signatures
    export async function sign(data, privKey) {
      if ( ! data || ! privKey || data.length == 0 || privKey.length == 0) {
        console.error(`Invalid parameters for ed25519 signing`, {data, privKey}); 
        throw new TypeError(`Invalid parameters for ed25519 signing`); 
      }
      DEBUG && console.log('sign data', data, 'pub key', await ed.getPublicKeyAsync(privKey));
      const signData = Buffer.from(data);
      const signature = await ed.signAsync(signData, privKey);
      return signature;
    }

    export async function verify(data, signature, pubKey) {
      if ( ! data || ! pubKey || data.length == 0 || pubKey.length == 0 || ! signature || signature.length == 0) {
        console.error(`Invalid parameters for ed25519 verifying`, {data, pubKey, signature}); 
        throw new TypeError(`Invalid parameters for ed25519 verifying`); 
      }
      DEBUG && console.log('verify data', data, 'pub key', pubKey);
      const signData = Buffer.from(data);
      const isValidSignature = await ed.verifyAsync(signature, signData, pubKey);
      return isValidSignature;
    }

  // RSA cryptology
    export function encryptRSA(data, pubKey) {
      const encryptedData = crypto.publicEncrypt(pubKey, Buffer.from(data));
      return encryptedData;
    }

    export function decryptRSA(encryptedData, privKey) {
      const decryptedData = crypto.privateDecrypt(privKey, encryptedData);
      return decryptedData;
    }

// Expose API for import
  export default {
    parseKey,
    sign,
    verify,
    encryptRSA,
    decryptRSA,
  };

// CLI usage
  if (__cli) {
    (async () => {
      if ( process.argv.length < 3 ) {
        console.log(`Usage: ${basename(__thisfile)} <rsa_key_file|ed25519_key_file>`);
        process.exit(1);
      }
      const filePath = resolve(process.argv[2]);
      const { keyObject, type, privateKey, publicKey } = await parseKey(filePath);
      if (type) {
        console.log(`${type.toLocaleUpperCase()} Private Key:`, privateKey ? privateKey : `Not provided`);
        console.log(`${type.toLocaleUpperCase()} Public Key:`, publicKey);
        if ( privateKey ) {
          if ( keyObject && privateKey instanceof crypto.KeyObject ) {
            console.log(privateKey.export({
              type: 'pkcs8',
              format: 'pem'
            }));
          } else {
            if ( Buffer.isBuffer(privateKey) && type == 'ed25519' ) {
              const pkcs8Key = Buffer.concat([
                Buffer.from('302e020100300506032b657004220420', 'hex'), // PKCS#8 header for Ed25519
                privateKey
              ]);

              // Create a KeyObject from the PKCS#8 formatted key
              const keyObject = crypto.createPrivateKey({
                key: pkcs8Key,
                format: 'der', // DER encoding
                type: 'pkcs8', // PKCS#8 key type
              });
              console.log(keyObject.export({
                type: 'pkcs8',
                format: 'pem'
              }));
            } else {
              console.log(keyObject.export({
                type: 'pkcs8',
                format: 'pem'
              }));
            }
          }
        }
      }
      process.exit(keyObject ? 0 : 1);
    })();
  }

