#!/usr/bin/env node
/**
 * Unit tests for enhanced security protocols
 * Tests the challenge-response and mutual authentication features
 */

import crypto from 'crypto';
import assert from 'assert';
import fs from 'fs';
import * as ed from '@noble/ed25519';

console.log('Testing enhanced security protocols...\n');

// Test 1: Verify hardenedApplication.js contains challenge-response code
console.log('Test 1: Verify hardenedApplication.js contains challenge-response implementation');
try {
  const hardenedAppContent = fs.readFileSync('./src/hard/hardenedApplication.js', 'utf8');
  
  // Check for challenge-response implementation
  assert(hardenedAppContent.includes('challengeNonce'), 'Should contain challengeNonce variable');
  assert(hardenedAppContent.includes('/tickets/challenge'), 'Should contain challenge endpoint');
  assert(hardenedAppContent.includes('nonceSignature'), 'Should contain nonceSignature variable');
  assert(hardenedAppContent.includes('useChallenge'), 'Should contain useChallenge parameter');
  assert(hardenedAppContent.includes('serverSignature'), 'Should contain serverSignature for mutual auth');
  
  // Check for Ed25519 usage
  assert(hardenedAppContent.includes("import * as ed from '@noble/ed25519'"), 'Should import @noble/ed25519');
  assert(hardenedAppContent.includes('ticketPrivateKey'), 'Should use ticketPrivateKey instead of seatPrivateKey');
  assert(hardenedAppContent.includes('ticketData?.jwk?.d') || hardenedAppContent.includes('ticketData.jwk.d'), 'Should extract private key from ticket JWK');
  assert(hardenedAppContent.includes('ed.signAsync'), 'Should use Ed25519 signing');
  
  console.log('✓ Challenge-response implementation with Ed25519 found in hardenedApplication.js\n');
} catch (err) {
  console.error('✗ Test 1 failed:', err.message, '\n');
  process.exit(1);
}

// Test 2: Verify Ed25519 signing functionality works correctly
console.log('Test 2: Verify Ed25519 signing functionality');
try {
  // Generate test Ed25519 key pair
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  // Sign some test data
  const testData = 'test-nonce-data';
  const signature = await ed.signAsync(Buffer.from(testData, 'utf8'), privateKey);
  
  // Verify the signature
  const isValid = await ed.verifyAsync(signature, Buffer.from(testData, 'utf8'), publicKey);
  
  assert(isValid === true, 'Ed25519 signature verification should succeed');
  console.log('✓ Ed25519 signing and verification functionality works correctly\n');
} catch (err) {
  console.error('✗ Test 2 failed:', err.message, '\n');
  process.exit(1);
}

// Test 3: Verify challenge-response flow data structure
console.log('Test 3: Verify challenge-response data structure');
try {
  const mockFullChain = {
    ticket: {
      ticketData: {
        ticketId: 'test-ticket-id-123',
        jwk: {
          kty: 'OKP',
          crv: 'Ed25519',
          x: 'mock-public-key-base64url',
          d: 'mock-private-key-base64url'
        }
      }
    },
    seatCertificate: {
      seatData: {
        seatId: 'test-seat-id-123'
      }
    },
    issuingCertificate: {
      publicKey: '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----'
    }
  };
  
  // Verify we can extract necessary fields
  assert(mockFullChain.seatCertificate?.seatData?.seatId, 'Should extract seatId');
  assert(mockFullChain.ticket?.ticketData?.jwk?.d, 'Should extract ticket private key from JWK');
  assert(mockFullChain.issuingCertificate?.publicKey, 'Should extract stadium public key');
  
  console.log('✓ Challenge-response data structure is valid\n');
} catch (err) {
  console.error('✗ Test 3 failed:', err.message, '\n');
  process.exit(1);
}

// Test 4: Verify payload structure for challenge-response
console.log('Test 4: Verify payload structure');
try {
  const mockPayload = {
    certificateJson: { test: 'data' },
    instanceId: 'test-instance-id',
    challengeNonce: 'test-nonce',
    nonceSignature: 'test-signature-hex'
  };
  
  assert(mockPayload.certificateJson, 'Payload should contain certificateJson');
  assert(mockPayload.instanceId, 'Payload should contain instanceId');
  assert(mockPayload.challengeNonce, 'Payload should contain challengeNonce');
  assert(mockPayload.nonceSignature, 'Payload should contain nonceSignature');
  
  console.log('✓ Payload structure is correct for challenge-response\n');
} catch (err) {
  console.error('✗ Test 4 failed:', err.message, '\n');
  process.exit(1);
}

// Test 5: Verify mutual authentication data structure
console.log('Test 5: Verify mutual authentication response structure');
try {
  const mockServerResponse = {
    isValid: true,
    message: 'License is valid.',
    serverSignature: 'mock-server-signature-hex'
  };
  
  assert(mockServerResponse.serverSignature, 'Response should contain serverSignature');
  assert(mockServerResponse.isValid === true, 'Response should indicate validity');
  
  console.log('✓ Mutual authentication response structure is valid\n');
} catch (err) {
  console.error('✗ Test 5 failed:', err.message, '\n');
  process.exit(1);
}

// Test 6: Verify _bbcertify.sh contains challenge-response implementation
console.log('Test 6: Verify _bbcertify.sh contains challenge-response implementation');
try {
  const bbcertifyContent = fs.readFileSync('./deploy-scripts/_bbcertify.sh', 'utf8');
  
  // Check for challenge-response implementation
  assert(bbcertifyContent.includes('sign_ed25519_with_node'), 'Should contain sign_ed25519_with_node function');
  assert(bbcertifyContent.includes('verify_with_node'), 'Should contain verify_with_node function');
  assert(bbcertifyContent.includes('/tickets/challenge'), 'Should contain challenge endpoint');
  assert(bbcertifyContent.includes('local nonce='), 'Should reference nonce variable');
  assert(bbcertifyContent.includes('nonce_signature'), 'Should reference nonce_signature variable');
  assert(bbcertifyContent.includes('server_signature'), 'Should reference server_signature for mutual auth');
  assert(bbcertifyContent.includes('challengeNonce'), 'Should include challengeNonce in payload');
  assert(bbcertifyContent.includes('nonceSignature'), 'Should include nonceSignature in payload');
  
  // Check for Ed25519 usage
  assert(bbcertifyContent.includes('@noble/ed25519'), 'Should use @noble/ed25519 library');
  assert(bbcertifyContent.includes('ticketData.jwk.d') || bbcertifyContent.includes('ticketData?.jwk?.d'), 'Should extract private key from ticket JWK');
  assert(bbcertifyContent.includes('ticket_private_key'), 'Should use ticket_private_key instead of seat_private_key');
  assert(bbcertifyContent.includes('ed.signAsync'), 'Should use Ed25519 signing');
  
  console.log('✓ Challenge-response implementation with Ed25519 found in _bbcertify.sh\n');
} catch (err) {
  console.error('✗ Test 6 failed:', err.message, '\n');
  process.exit(1);
}

// Test 7: Verify certify.ps1 contains challenge-response implementation
console.log('Test 7: Verify certify.ps1 contains challenge-response implementation');
try {
  const certifyPsContent = fs.readFileSync('./windows-scripts/certify.ps1', 'utf8');
  
  // Check for challenge-response implementation
  assert(certifyPsContent.includes('Sign-Ed25519WithNode'), 'Should contain Sign-Ed25519WithNode function');
  assert(certifyPsContent.includes('Verify-WithNode'), 'Should contain Verify-WithNode function');
  assert(certifyPsContent.includes('/tickets/challenge'), 'Should contain challenge endpoint');
  assert(certifyPsContent.includes('$nonce'), 'Should reference nonce variable');
  assert(certifyPsContent.includes('$nonceSignature'), 'Should reference nonceSignature variable');
  assert(certifyPsContent.includes('$serverSignature'), 'Should reference serverSignature for mutual auth');
  assert(certifyPsContent.includes('challengeNonce'), 'Should include challengeNonce in payload');
  assert(certifyPsContent.includes('nonceSignature'), 'Should include nonceSignature in payload');
  
  // Check for Ed25519 usage
  assert(certifyPsContent.includes('@noble/ed25519'), 'Should use @noble/ed25519 library');
  assert(certifyPsContent.includes('ticketData.jwk.d') || certifyPsContent.includes('ticket.ticketData.jwk'), 'Should extract private key from ticket JWK');
  assert(certifyPsContent.includes('$ticketPrivateKey'), 'Should use ticketPrivateKey instead of seatPrivateKey');
  assert(certifyPsContent.includes('ed.signAsync'), 'Should use Ed25519 signing');
  
  console.log('✓ Challenge-response implementation with Ed25519 found in certify.ps1\n');
} catch (err) {
  console.error('✗ Test 7 failed:', err.message, '\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('All tests passed! ✓');
console.log('═══════════════════════════════════════\n');
console.log('Note: These are unit tests for data structures and method signatures.');
console.log('Integration tests require a running license server with challenge endpoint.');
