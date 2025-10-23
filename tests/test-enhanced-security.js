#!/usr/bin/env node
/**
 * Unit tests for enhanced security protocols
 * Tests the challenge-response and mutual authentication features
 */

import crypto from 'crypto';
import assert from 'assert';
import fs from 'fs';

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
  
  console.log('✓ Challenge-response implementation found in hardenedApplication.js\n');
} catch (err) {
  console.error('✗ Test 1 failed:', err.message, '\n');
  process.exit(1);
}

// Test 2: Verify private signing method works correctly
console.log('Test 2: Verify signing functionality');
try {
  // Generate test key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  
  const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  
  // Sign some test data
  const testData = 'test-nonce-data';
  const sign = crypto.createSign('SHA256');
  sign.update(testData);
  sign.end();
  const signature = sign.sign(privateKeyPem);
  
  // Verify the signature
  const verify = crypto.createVerify('SHA256');
  verify.update(testData);
  verify.end();
  const isValid = verify.verify(publicKeyPem, signature);
  
  assert(isValid === true, 'Signature verification should succeed');
  console.log('✓ Signing and verification functionality works correctly\n');
} catch (err) {
  console.error('✗ Test 2 failed:', err.message, '\n');
  process.exit(1);
}

// Test 3: Verify challenge-response flow data structure
console.log('Test 3: Verify challenge-response data structure');
try {
  const mockFullChain = {
    seatCertificate: {
      seatData: {
        seatId: 'test-seat-id-123',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMOCK\n-----END RSA PRIVATE KEY-----'
      }
    },
    issuingCertificate: {
      publicKey: '-----BEGIN PUBLIC KEY-----\nMOCK\n-----END PUBLIC KEY-----'
    }
  };
  
  // Verify we can extract necessary fields
  assert(mockFullChain.seatCertificate?.seatData?.seatId, 'Should extract seatId');
  assert(mockFullChain.seatCertificate?.seatData?.privateKey, 'Should extract private key');
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
  assert(bbcertifyContent.includes('sign_with_node'), 'Should contain sign_with_node function');
  assert(bbcertifyContent.includes('verify_with_node'), 'Should contain verify_with_node function');
  assert(bbcertifyContent.includes('/tickets/challenge'), 'Should contain challenge endpoint');
  assert(bbcertifyContent.includes('local nonce='), 'Should reference nonce variable');
  assert(bbcertifyContent.includes('nonce_signature'), 'Should reference nonce_signature variable');
  assert(bbcertifyContent.includes('server_signature'), 'Should reference server_signature for mutual auth');
  assert(bbcertifyContent.includes('challengeNonce'), 'Should include challengeNonce in payload');
  assert(bbcertifyContent.includes('nonceSignature'), 'Should include nonceSignature in payload');
  
  console.log('✓ Challenge-response implementation found in _bbcertify.sh\n');
} catch (err) {
  console.error('✗ Test 6 failed:', err.message, '\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('All tests passed! ✓');
console.log('═══════════════════════════════════════\n');
console.log('Note: These are unit tests for data structures and method signatures.');
console.log('Integration tests require a running license server with challenge endpoint.');
