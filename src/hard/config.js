// config.js

import path from 'path';
import os from 'os';
import crypto from 'crypto';
import child_process from 'child_process';
import { getServerDomainFromCert } from './utils.js';

export const API_VERSION = 'v1';
export const DEBUG = false;
export const HOME_DIR = os.homedir();
export const DIST_DIR = path.resolve('dist', 'BrowserBox');
export const APP_DIR = path.resolve('app');
export const LIB_DIR = path.resolve('lib');
export const LOGS_DIR = path.resolve('logs');
export const SSL_CERTS_DIR = path.join(HOME_DIR, 'sslcerts');
export const ROOT_CONFIG_DIR = path.join(HOME_DIR, '.config', 'ticket-system', 'root');
export const MASTER_CONFIG_DIR = path.join(HOME_DIR, '.config', 'ticket-system', 'master');
export const STADIUMS_CONFIG_DIR = path.join(HOME_DIR, '.config', 'ticket-system', 'stadiums');
export const SEATS_DIR = path.join(HOME_DIR, '.config', 'ticket-system', 'seats');
export const TICKET_HOLDER_DIR = path.join(HOME_DIR, '.config', 'ticket-system', 'ticket_holder');
export const TICKET_DIR = path.join(HOME_DIR, '.config', 'dosyago', 'bbpro', 'tickets');
export const STADIUM_NAME = 'stadiumA';
export const DOMAIN_NAME = process.env.AMULET_DEV ? getServerDomainFromCert(path.join(SSL_CERTS_DIR, 'fullchain.pem')) : 'license.dosaygo.com';
export const DISTRIBUTION_SERVER_PORT = 3001;
export const LICENSE_SERVER_PORT = 3002;
export const LICENSE_KEY = process.env.LICENSE_KEY;
export const DISTRIBUTION_SERVER_URL = DOMAIN_NAME == 'localhost' ? `https://localhost:${DISTRIBUTION_SERVER_PORT}` : `https://license.dosaygo.com`;
export const LICENSE_SERVER_URL = DOMAIN_NAME == 'localhost' ? `https://localhost:${LICENSE_SERVER_PORT}` : `https://master.dosaygo.com`;
export const INSTANCE_ID = process.env.INSTANCE_ID || crypto.randomUUID();
export const ROOT_PRIVATE_KEY_PATH = path.join(ROOT_CONFIG_DIR, 'private.pem');
export const ROOT_PUBLIC_KEY_PATH = path.join(ROOT_CONFIG_DIR, 'public.pem');
export const APP_PUBLIC_KEY_PATH = path.join(DIST_DIR, 'public.pem');
export const APP_SIGNATURE_PATH = path.join(DIST_DIR, 'app.signature');
export const CERTIFICATES_PATH = path.join(TICKET_DIR, 'tickets.json');
export const CERTIFICATE_PATH = path.join(TICKET_DIR, 'ticket.json');
export const NODE_EXTRA_CA_CERTS = path.join(SSL_CERTS_DIR, 'rootCA.pem');
// test values
export const APP_SOURCE = path.join(LIB_DIR, 'application.js');
export const APP_DEST = path.join(DIST_DIR, 'hello_world.js');

