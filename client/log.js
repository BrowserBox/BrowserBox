// DEBUG 
export const DEBUG = process.env.JAGUAR_DEBUG === 'true' || false;
const LOG_FILE = 'cdp.log';

      // logging 
        export function logMessage(direction, message) {
          if ( ! DEBUG ) return;
          const timestamp = new Date().toISOString();
          const logEntry = JSON.stringify({ timestamp, direction, message }, null, 2) + '\n';
          try {
            appendFileSync(LOG_FILE, logEntry);
            terminal.magenta(`[${timestamp}] ${direction}: `);
            terminal(JSON.stringify(message, null, 2) + '\n');
          } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`);
          }
        }

        export function debugLog(message) {
          if ( ! DEBUG ) return;
          try {
            appendFileSync('debug-coords.log', `${new Date().toISOString()} - ${message}\n`);
          } catch (error) {
            console.error(`Failed to write to debug log: ${error.message}`);
          }
        }
