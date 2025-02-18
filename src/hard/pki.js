// pki.js

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as ed from '@noble/ed25519';
import * as rain from '@dosyago/rainsum';
import { log } from './utils.js';
import {
  ROOT_CONFIG_DIR,
  MASTER_CONFIG_DIR,
  STADIUMS_CONFIG_DIR,
  SEATS_DIR,
  TICKET_DIR,
  TICKET_HOLDER_DIR,
  LICENSE_SERVER_URL,
  LICENSE_KEY,
  DISTRIBUTION_SERVER_URL,
  CERTIFICATE_PATH,
  API_VERSION,
} from './config.js';

export class PKI {
  constructor({ db = null, passphrase = '', isServer = false } = {}) {
      this.db = db;
      this.passphrase = passphrase;
      this.isServer = isServer;

      this.rootPrivateKey = null;
      this.rootPublicKey = null;
  }

  /**
   * If server, load from DB. If client, fetch from /keys/root
   */
  async loadRootKeys() {
    if (this.isServer) {
      // Query DB row from root_keys
      const row = await this.db.get(`SELECT * FROM root_keys WHERE id='root'`);
      if (!row) throw new Error('No root key row in DB');
      if (row.is_locked === 1) throw new Error('Root key is locked in DB.');

      const decrypted = await decryptKey(row.encrypted_private_key, this.passphrase);
      this.rootPrivateKey = decrypted.toString('utf8');
      this.rootPublicKey = row.public_key;
      log('PKI', 'Loaded root keys from DB (server mode).');
    } else {
      // Client mode: fetch from root server
      const resp = await fetch(`${process.env.ROOT_SERVER_URL}/keys/root`);
      if (!resp.ok) {
        throw new Error(`Failed to fetch root key: ${resp.statusText}`);
      }
      const { key } = await resp.json();
      this.rootPublicKey = key;
      // Typically no private key for client
      log('PKI', 'Loaded root public key via HTTP (client mode).');
    }
  }

  /**
   * Provide a public key by type: 'root', 'stadium', or maybe 'master' if you use that concept
   * If server => direct DB. If client => fetch from endpoints.
   */
  async providePublicKey(type, stadiumId = null) {
    if (this.isServer) {
      return this.#providePublicKeyFromDb(type, stadiumId);
    } else {
      return this.#providePublicKeyFromEndpoint(type, stadiumId);
    }
  }

  async #providePublicKeyFromDb(type, stadiumId) {
    if (!this.db) throw new Error('No DB handle in server mode.');
    switch (type) {
      case 'root': {
        const row = await this.db.get(`SELECT public_key FROM root_keys WHERE id='root'`);
        if (!row) throw new Error('No root key row found in DB');
        return row.public_key;
      }
      case 'stadium': {
        if (!stadiumId) throw new Error('stadiumId required');
        const row = await this.db.get(`
          SELECT public_key
          FROM stadiums
          WHERE stadium_id=? AND is_active=1
        `, [stadiumId]);
        if (!row) throw new Error(`No stadium or inactive: ${stadiumId}`);
        return row.public_key;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  async #providePublicKeyFromEndpoint(type, stadiumId) {
    // Client mode: call the appropriate server endpoint
    switch (type) {
      case 'root': {
        const url = `${process.env.ROOT_SERVER_URL}/keys/root`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch root key: ${resp.statusText}`);
        const { key } = await resp.json();
        return key;
      }
      case 'stadium': {
        if (!stadiumId) throw new Error('stadiumId required for stadium key');
        const url = `${process.env.STADIUM_SERVER_URL}/keys/stadium/${stadiumId}`;
        const resp = await fetchWithLicenseKey(url);
        if (!resp.ok) throw new Error(`Failed to fetch stadium key: ${resp.statusText}`);
        const { key } = await resp.json();
        return key;
      }
      default:
        throw new Error(`Unknown public key type in client mode: ${type}`);
    }
  }


  async loadRootKeysFromDb() {
    if (!this.db) {
      throw new Error('No DB provided to PKI; cannot load root keys.');
    }
    const row = await this.db.get(`SELECT * FROM root_keys WHERE id = 'root'`);
    if (!row) {
      throw new Error('No root key row found in DB.');
    }
    if (row.is_locked === 1) {
      throw new Error('Root key is locked. Cannot load.');
    }

    // Decrypt the private key
    const decryptedPem = await decryptKey(row.encrypted_private_key, this.passphrase);
    if (!decryptedPem) {
      throw new Error('Failed to decrypt root private key (bad passphrase?).');
    }

    // Store in memory
    this.rootPrivateKey = decryptedPem.toString('utf8');
    this.rootPublicKey = row.public_key;
    log('PKI', 'Root private key loaded from DB successfully.');
  }

  async createSeat(stadiumId) { // CHANGED: Add userId parameter
    if (typeof stadiumId !== 'string' || stadiumId.trim() === '') {
      throw new Error('Invalid stadium ID provided.');
    }

    if (!this.rootPrivateKey) {
      throw new Error('Root private key not loaded. Cannot generate seat.');
    }

    // Generate seat keys
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
    });

    const seatId = crypto.randomBytes(16).toString('hex');

    // CHANGED: Fetch stadium from DB instead of filesystem
    // console.error('check 1');
    const {stadium: stadiumRow} = await fetchWithLicenseKey(`${DISTRIBUTION_SERVER_URL}/${API_VERSION}/stadiums/${stadiumId}`).then(r => r.json());
    if (!stadiumRow) {
      throw new Error(`Stadium ${stadiumId} not found or inactive in database.`);
    }

    // CHANGED: Fetch master certificate from filesystem (unchanged for now)
    const masterCertificate = JSON.parse(
      fs.readFileSync(path.join(MASTER_CONFIG_DIR, 'certificate.json'), 'utf-8')
    );

    const seatData = {
      seatId,
      stadiumId,
      stadiumPublicKey: stadiumRow.public_key,
      masterPublicKey: masterCertificate.publicKey,
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
    };

    // Sign with root private key
    const rootSignature = this.signData(seatData, this.rootPrivateKey);

    // CHANGED: Sign with stadium private key from DB
    const stadiumPrivateKey = stadiumRow.private_key;
    const stadiumSignature = this.signData(seatData, stadiumPrivateKey);

    // only add privateKey here as otherwise sigs will be off as verifiers cannot guarantee they have seat private key (as this is controlled)
    seatData.privateKey = privateKey.export({ type: 'pkcs1', format: 'pem' });

    const seatCertificate = { seatData, rootSignature, stadiumSignature };

    // Save seat keys locally if needed
    const seatDir = path.join(SEATS_DIR, seatId);
    if (!fs.existsSync(seatDir)) {
      fs.mkdirSync(seatDir, { recursive: true });
    }
    fs.writeFileSync(path.join(seatDir, 'private.pem'), privateKey.export({ type: 'pkcs1', format: 'pem' }));
    fs.writeFileSync(path.join(seatDir, 'public.pem'), seatData.publicKey);

    if (!this.db) {
      throw new Error('DB not available in PKI. Cannot store seat.');
    }

    await this.db.run(
      `INSERT INTO seats (
         seat_id, stadium_id, stadium_public_key, master_public_key, seat_public_key, seat_private_key,
         root_signature, stadium_signature
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        seatId,
        stadiumId,
        seatData.stadiumPublicKey,
        seatData.masterPublicKey,
        seatData.publicKey,
        seatData.privateKey,
        rootSignature,
        stadiumSignature,
      ]
    );

    return seatCertificate;
  }

  async issueTicket(seatId, timeSlot, deviceId, issuerType = 'master') {
    if (!this.db) {
      throw new Error('DB not available in PKI. Cannot store ticket.');
    }

    if (!this.rootPublicKey) {
      const rootKeyEndpoint = '/keys/root';
      const rootServerUrl = DISTRIBUTION_SERVER_URL;
      this.rootPublicKey = await this.fetchPublicKey(rootServerUrl, rootKeyEndpoint);
    }

    const seatRow = await this.db.get(`SELECT * FROM seats WHERE seat_id = ?`, [seatId]);
    if (!seatRow) {
      throw new Error(`Seat ${seatId} not found in database.`);
    }

    let issuerCertificate, issuerPrivateKey, issuerId;

    const stadiumRow = await this.db.get(
      `SELECT public_key, private_key, certificate FROM stadiums WHERE stadium_id = ? AND is_active = 1`,
      [seatRow.stadium_id]
    );
    if (!stadiumRow) {
      throw new Error(`Stadium ${seatRow.stadium_id} not found or inactive in database.`);
    }

    issuerCertificate = JSON.parse(stadiumRow.certificate);
    issuerPrivateKey = stadiumRow.private_key;
    issuerId = seatRow.stadium_id;

    // Generate Ed25519 keys for the ticket
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);

    const jwk = {
      kty: 'OKP',
      crv: 'Ed25519',
      x: Buffer.from(publicKey).toString('base64url'),
      d: Buffer.from(privateKey).toString('base64url'),
    };

    const ticketId = crypto.randomBytes(16).toString('hex');
    const ticketData = {
      ticketId,
      seatId,
      timeSlot,
      deviceId,
      issuer: issuerId,
      publicKey: Buffer.from(publicKey).toString('base64url'),
      jwk,
    };

    const issuerSignature = this.signData(ticketData, issuerPrivateKey);

    // Sign with seat private key
    const seatPrivateKey = seatRow.seat_private_key;
    const seatSignature = this.signData(ticketData, seatPrivateKey);

    const ticket = { ticketData, issuerSignature, seatSignature };

    const fullChain = {
      rootCertificate: this.rootPublicKey,
      seatCertificate: {
        seatData: {
          seatId: seatRow.seat_id,
          stadiumId: seatRow.stadium_id,
          stadiumPublicKey: seatRow.stadium_public_key,
          masterPublicKey: seatRow.master_public_key,
          publicKey: seatRow.seat_public_key
        },
        rootSignature: seatRow.root_signature,
        stadiumSignature: seatRow.stadium_signature,
      },
      issuingCertificate: issuerCertificate,
      ticket,
    };

    await this.db.run(
      `INSERT INTO tickets (ticket_id, seat_id, time_slot, device_id, issuer, public_key, full_chain_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        seatId,
        timeSlot,
        deviceId,
        issuerId,
        Buffer.from(publicKey).toString('base64url'),
        JSON.stringify(fullChain)
      ]
    );

    return fullChain;
  }

  async validateTicket(fullChain) {
    try {
      const { seatCertificate, issuingCertificate, ticket } = fullChain;
      const seatData = seatCertificate.seatData;

      if (!this.rootPublicKey) {
        const rootKeyEndpoint = '/keys/root';
        const rootServerUrl = DISTRIBUTION_SERVER_URL;
        this.rootPublicKey = await this.fetchPublicKey(rootServerUrl, rootKeyEndpoint);
      }

      const seatValidRoot = this.validateSignature(seatData, seatCertificate.rootSignature, this.rootPublicKey);
      if (!seatValidRoot) {
        log('PKI', 'Seat certificate failed root signature validation. This could be because the seat was created with a different root key than is current.');
        return false;
      }

      // CHANGED: Fetch stadium from DB for validation
      const { stadium: stadiumRow } = await fetchWithLicenseKey(`${DISTRIBUTION_SERVER_URL}/${API_VERSION}/stadiums/${seatData.stadiumId}`).then(r => r.json());
      if (!stadiumRow) {
        log('PKI', `No stadium found in DB for ${seatData.stadiumId}.`);
        return false;
      }

      const stadiumCertificate = JSON.parse(stadiumRow.certificate);
      const stadiumCertData = { stadiumId: stadiumCertificate.stadiumId, publicKey: stadiumCertificate.publicKey };

      const stadiumCertValid = this.validateSignature(stadiumCertData, stadiumCertificate.signature, this.rootPublicKey);
      if (!stadiumCertValid) {
        log('PKI', 'Stadium certificate validation failed.');
        return false;
      }

      const stadiumPublicKey = stadiumCertificate.publicKey;

      const seatValidStadium = this.validateSignature(seatData, seatCertificate.stadiumSignature, stadiumPublicKey);
      if (!seatValidStadium) {
        log('PKI', 'Seat certificate failed stadium signature validation.');
        return false;
      }

      log('PKI', 'Seat certificate is valid (both root and stadium signatures checked).');

      const { ticketData, issuerSignature, seatSignature } = ticket;
      const { issuer } = ticketData;

      let issuerPublicKey;
      if (issuer === 'master') {
        issuerPublicKey = seatData.masterPublicKey;
      } else {
        // If issuer is a stadium, we already have stadiumPublicKey from DB
        issuerPublicKey = stadiumPublicKey;
      }

      const ticketIssuerValid = this.validateSignature(ticketData, issuerSignature, issuerPublicKey);
      if (!ticketIssuerValid) {
        log('PKI', 'Ticket issuer signature validation failed.');
        return false;
      }

      const seatPublicKey = seatData.publicKey;
      const ticketSeatValid = this.validateSignature(ticketData, seatSignature, seatPublicKey);
      if (!ticketSeatValid) {
        log('PKI', 'Ticket seat signature validation failed.');
        return false;
      }

      log('PKI', 'Ticket is valid (both issuer and seat signatures checked).');
      log('PKI', 'Full chain of trust validated successfully.');
      return true;
    } catch (error) {
      log('PKI', `Error validating chain: ${error.message}`);
      return false;
    }
  }

  async fetchPublicKey(serverUrl, endpoint) {
    const url = `${serverUrl}${endpoint}`;
    log('PKI', `Fetching public key from ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch public key: ${response.statusText}`);
      }
      const { key } = await response.json();
      return key;
    } catch (error) {
      console.warn(error);
      log('PKI', `Error fetching public key: ${error.message}`);
      throw new Error(`Unable to retrieve key from ${url}`);
    }
  }

  getCertificate(cPath) {
    return JSON.parse(fs.readFileSync(path.join(cPath || CERTIFICATE_PATH)).toString('utf8'));
  }

  getTicketDirectory(ticketId) {
    return path.join(TICKET_DIR);
  }

  getTicketPrivateKeyPath() {
    const cert = this.getCertificate();
    const ticketId = cert.ticket.ticketData.ticketId;
    const ticketDir = this.getTicketDirectory(ticketId);
    const ticketPrivateKeyPath = path.join(ticketDir, 'ed25519.jwk');
    return ticketPrivateKeyPath;
  }

  canonicalStringify(obj) {
    if (Array.isArray(obj)) {
      return '[' + obj.map(this.canonicalStringify.bind(this)).join(',') + ']';
    } else if (typeof obj === 'object' && obj !== null) {
      return '{' +
        Object.keys(obj)
          .sort()
          .map((key) => `"${key}":${this.canonicalStringify(obj[key])}`)
          .join(',') +
        '}';
    } else {
      return JSON.stringify(obj);
    }
  }

  generateRootConfig() {
    try {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
      });

      if (!fs.existsSync(ROOT_CONFIG_DIR)) {
        fs.mkdirSync(ROOT_CONFIG_DIR, { recursive: true });
      }

      fs.writeFileSync(
        path.join(ROOT_CONFIG_DIR, 'private.pem'),
        privateKey.export({ type: 'pkcs1', format: 'pem' })
      );
      fs.writeFileSync(
        path.join(ROOT_CONFIG_DIR, 'public.pem'),
        publicKey.export({ type: 'spki', format: 'pem' })
      );

      log('PKI', 'Root configuration generated.');
      this.rootPrivateKey = privateKey.export({ type: 'pkcs1', format: 'pem' });
      this.rootPublicKey = publicKey.export({ type: 'spki', format: 'pem' });
    } catch (error) {
      log('PKI', `Error generating root configuration: ${error.message}`);
    }
  }

  generateMasterConfig() {
    try {
      if (!this.rootPrivateKey) {
        throw new Error('Root private key not loaded. Cannot generate master configuration.');
      }

      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
      });

      if (!fs.existsSync(MASTER_CONFIG_DIR)) {
        fs.mkdirSync(MASTER_CONFIG_DIR, { recursive: true });
      }

      const masterCertificateData = {
        masterId: crypto.randomBytes(16).toString('hex'),
        publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
      };

      const signature = this.signData(masterCertificateData, this.rootPrivateKey);
      const masterCertificate = { ...masterCertificateData, signature };

      fs.writeFileSync(
        path.join(MASTER_CONFIG_DIR, 'private.pem'),
        privateKey.export({ type: 'pkcs1', format: 'pem' })
      );
      fs.writeFileSync(
        path.join(MASTER_CONFIG_DIR, 'public.pem'),
        masterCertificateData.publicKey
      );
      fs.writeFileSync(
        path.join(MASTER_CONFIG_DIR, 'certificate.json'),
        JSON.stringify(masterCertificate, null, 2)
      );

      log('PKI', 'Master configuration generated and signed by root.');
    } catch (error) {
      log('PKI', `Error generating master configuration: ${error.message}`);
    }
  }

  generateStadiumConfig(stadiumId) {
    try {
      if (typeof stadiumId !== 'string' || stadiumId.trim() === '') {
        throw new Error('Invalid stadium ID provided.');
      }

      if (!this.rootPrivateKey) {
        throw new Error('Root private key not loaded. Cannot generate stadium configuration.');
      }

      const stadiumConfigDir = path.join(STADIUMS_CONFIG_DIR, stadiumId);

      if (!fs.existsSync(stadiumConfigDir)) {
        fs.mkdirSync(stadiumConfigDir, { recursive: true });
      }

      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
      });

      const stadiumCertificateData = {
        stadiumId,
        publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
      };

      const signature = this.signData(stadiumCertificateData, this.rootPrivateKey);
      const stadiumCertificate = { ...stadiumCertificateData, signature };
      const pk = privateKey.export({ type: 'pkcs1', format: 'pem' });

      fs.writeFileSync(
        path.join(stadiumConfigDir, 'private.pem'),
        pk
      );
      fs.writeFileSync(
        path.join(stadiumConfigDir, 'public.pem'),
        stadiumCertificateData.publicKey
      );
      fs.writeFileSync(
        path.join(stadiumConfigDir, 'certificate.json'),
        JSON.stringify(stadiumCertificate, null, 2)
      );

      log('PKI', `Stadium configuration for ${stadiumId} generated and signed by root.`);
      return { certificate: stadiumCertificate, publicKey: stadiumCertificate.publicKey, privateKey: pk };
    } catch (error) {
      log('PKI', `Error generating stadium configuration: ${error.message}`);
    }
  }

  signData(data, privateKey) {
    const canonicalData = this.canonicalStringify(data);
    const sign = crypto.createSign('SHA256');
    sign.update(canonicalData);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }

  saveTicket(fullChain) {
    const ticketId = fullChain.ticket.ticketData.ticketId;
    const jwk = fullChain.ticket.ticketData.jwk;
    const ticketDir = this.getTicketDirectory(ticketId);
    if (!fs.existsSync(ticketDir)) {
      fs.mkdirSync(ticketDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(ticketDir, 'ticket.json'),
      JSON.stringify(fullChain, null, 2)
    );
    fs.writeFileSync(
      path.join(ticketDir, 'ed25519.jwk'),
      JSON.stringify(jwk),
    );
  }

  validateSignature(data, signature, publicKey) {
    const canonicalData = this.canonicalStringify(data);
    const verify = crypto.createVerify('SHA256');
    verify.update(canonicalData);
    verify.end();
    return verify.verify(publicKey, Buffer.from(signature, 'hex'));
  }
}

async function fetchWithLicenseKey(url, options = {}) {
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${LICENSE_KEY}`;

  const response = await fetch(url, options);
  return response;
}

// Encrypt a key using rain
export async function encryptKey(keyData, passphrase) {
  return rain.blockEncryptBuffer(
    Buffer.from(keyData), 
    Buffer.from(passphrase),
    'rainstorm',
    'scatter',
    512,
    9,
    9,
    0n,
    Buffer.from('amulet'),
    256,
    false,
    false
  );
}

// Decrypt a key using rain
export async function decryptKey(encryptedData, passphrase) {
  return rain.blockDecryptBuffer(
    Buffer.from(encryptedData),
    Buffer.from(passphrase)
  );
}


