import {sleep} from './helpers.js';

export default async function run({memberCount, messageCount}) {
  const EXPECTED_MESSAGE_COUNT = memberCount + messageCount;
  const EXPECTED_ROOM_NOTE_COUNT = 2*memberCount + 2;

  console.log('Running render tests');

  const foundMessages = document.querySelectorAll('li.message').length;
  const foundRoomNotes = document.querySelectorAll('li.room-note').length;

  console.assert(foundMessages == EXPECTED_MESSAGE_COUNT, `Expected ${EXPECTED_MESSAGE_COUNT} messages, but found ${foundMessages} rendered.`);
  console.assert(foundRoomNotes == EXPECTED_ROOM_NOTE_COUNT, `Expected ${EXPECTED_ROOM_NOTE_COUNT} room notes, but ${foundRoomNotes} rendered.`);

  console.log('Completed render tests');

  return foundMessages == EXPECTED_MESSAGE_COUNT && foundRoomNotes == EXPECTED_ROOM_NOTE_COUNT;
}
