import os from 'os';

export const chrome_port = process.argv[2] || 5002;
export const app_port = process.argv[3] || 8002;
export const cookie = process.argv[4] || 'xxxcookie';
export const username = process.argv[5] || process.env.USER || os.userInfo().username || 'cris';
export const token = process.argv[6] || 'token2';
export const start_mode = process.argv[7];
