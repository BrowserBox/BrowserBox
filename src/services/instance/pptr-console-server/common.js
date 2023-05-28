import os from 'os';
import path from 'path';

const REPLACE = [
  process.cwd(),
  path.resolve(os.homedir(), 'vf'),
];

export const MAX_RUN_TIME_MS = 10001; // 10 seconds and change ;P ;) xx hehe
export function patchError(err) {
  const now = `/${(+new Date).toString(32)}`;
  const entries = err.stack.split(/\s*\n+/g);
  const safeEntries = entries.map(e => {
    for( const r of REPLACE ) {
      e = e.replace(r, now);
    }
    return e;
  });
  err.stack = safeEntries.join('\n');
  return err;
}
