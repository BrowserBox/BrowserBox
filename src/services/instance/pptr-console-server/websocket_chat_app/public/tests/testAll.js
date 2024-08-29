import runLoadTest from './loadTest.js';
import runMessageTest from './messageTest.js';
import runRenderTest from './renderTest.js';

const MESSAGES = 100;
const MEMBERS = 50;

testAll();

async function testAll() {
  const results = {};
  console.group('Running all tests...');
  results.messageTest = await runMessageTest(MESSAGES);
  results.loadTest = await runLoadTest(MEMBERS);
  results.renderTest = await runRenderTest({messageCount:MESSAGES, memberCount:MEMBERS});
  console.groupEnd();
  console.log('Completed all tests!');
  const pass = Object.values(results).every(x => x);
  if ( ! pass ) {
    alert(JSON.stringify({fail:{results}},null,2));
    console.warn(JSON.stringify({fail:{results}},null,2));
  } else {
    console.info(`Passes all tests`);
  }
}


