import { appendFileSync } from 'fs';
// DEBUG 
export const DEBUG = process.env.JAGUAR_DEBUG === 'true' || false;
const EXTRA_LOG = false;
const LOG_FILE = 'cdp.log';

    // one liners
      export const sleep = ms => new Promise(res => setTimeout(res, ms));

      // logging 
        export function newLog(...stuff) {
          appendFileSync('new.log', JSON.stringify(stuff, null, 2));
        }

        export function focusLog(...stuff) {
          DEBUG && appendFileSync('focus.log', JSON.stringify(stuff, null, 2));
        }

        export function rowsLog(rows) {
          DEBUG && appendFileSync('rows.txt', JSON.stringify([...rows.entries()], null, 2));
        }

        export function logBBMessage(msg) {
          DEBUG && appendFileSync('bbmesg.log', JSON.stringify(msg) + '\n');
        }

        export function logClicks(...stuff) {
          appendFileSync('clicks.log', stuff.join(' ') + '\n');
        }

        export function logMessage(direction, message, terminal) {
          if ( ! DEBUG ) return;
          const timestamp = new Date().toISOString();
          const logEntry = JSON.stringify({ timestamp, direction, message }, null, 2) + '\n';
          try {
            appendFileSync(LOG_FILE, logEntry);
            EXTRA_LOG && terminal.magenta(`[${timestamp}] ${direction}: `);
            EXTRA_LOG && terminal(JSON.stringify(message, null, 2) + '\n');
          } catch (error) {
            DEBUG && console.error(`Failed to write to log file: ${error.message}`);
          }
        }

        export function debugLog(...message) {
          if ( ! DEBUG ) return;
          message = message.join(' ');
          try {
            appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
          } catch (error) {
            console.error(`Failed to write to debug log: ${error.message}`);
          }
        }
