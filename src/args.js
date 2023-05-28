import os from 'os';

export const app_port = parseInt(process.env.APP_PORT) || 8002;
export const chrome_port = parseInt(process.env.CHROME_PORT) || (app_port - 3000);
export const cookie = process.env.COOKIE_VALUE || 'xxxcookie';
export const username = process.env.USER || os.userInfo().username || 'cris';
export const token = process.env.LOGIN_TOKEN || 'token2';
export const start_mode = process.env.START_MODE;
