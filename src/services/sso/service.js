// 1) Imports, constants then state
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { Strategy as SamlStrategy } from '@node-saml/passport-saml'; // Updated to secure fork

dotenv.config();

const exec = promisify(execCallback);

const app = express();
const PORT = process.env.PORTAL_PORT || 3000;
const DB_PATH = path.join(process.cwd(), 'users.db');
const ENV_PATH = path.join(process.cwd(), '.env');
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const SAML_ENTRY_POINT = process.env.SAML_ENTRY_POINT;
const SAML_IDP_CERT = process.env.SAML_IDP_CERT; // New: Required for SAML
const SAML_CALLBACK = `http://localhost:${PORT}/auth/saml/callback`; // Updated for local testing
const ISSUER = 'browserbox-portal';
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const BASE_PORT = 8080;
const PLATFORM = process.platform;
const BOOTSTRAP_ADMIN = process.env.BOOTSTRAP_ADMIN || 'admin@example.com';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';

// State: Session and DB init, plus env validation
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests—try again later.' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'portal-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, sameSite: 'strict' } // Secure false for local HTTP testing
}));

app.use(passport.initialize());
app.use(passport.session());

// UX style constants
const STYLE = `
  body { background-color: #7FFFD4; font-family: Arial, sans-serif; color: #333; }
  a, button { background-color: #1E90FF; color: white; padding: 8px 16px; text-decoration: none; border: none; cursor: pointer; }
  a:hover, button:hover { opacity: 0.8; }
  form { margin: 20px; }
  ul { list-style: none; }
`;

// 2) Logic (top-level function calls)
validateEnv();

await new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (sso_id TEXT PRIMARY KEY, system_user TEXT, assigned_port INTEGER)', (err) => {
      if (err) return reject(err);
    });
    db.run('CREATE TABLE IF NOT EXISTS approvals (sso_id TEXT PRIMARY KEY, status TEXT DEFAULT "pending")', (err) => {
      if (err) return reject(err);
    });
    db.run('CREATE TABLE IF NOT EXISTS admins (sso_id TEXT PRIMARY KEY)', (err) => {
      if (err) return reject(err);
      db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
        if (row.count === 0) {
          db.run('INSERT INTO admins (sso_id) VALUES (?)', [BOOTSTRAP_ADMIN]);
        }
        resolve();
      });
    });
  });
});

// Configure Passport strategies
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `/auth/google/callback`
}, verifyCallback));

passport.use(new MicrosoftStrategy({
  clientID: MICROSOFT_CLIENT_ID,
  clientSecret: MICROSOFT_CLIENT_SECRET,
  callbackURL: `/auth/microsoft/callback`,
  scope: ['openid', 'profile', 'email']
}, verifyCallback));

if (SAML_ENTRY_POINT && SAML_ENTRY_POINT !== 'dummy' && SAML_IDP_CERT) { // Conditional init to avoid error with dummies
  passport.use(new SamlStrategy({
    entryPoint: SAML_ENTRY_POINT,
    issuer: ISSUER,
    callbackUrl: SAML_CALLBACK,
    cert: SAML_IDP_CERT // Added required cert
  }, verifyCallback));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  db.get('SELECT * FROM users WHERE sso_id = ?', [id], (err, row) => done(err, row));
});

// Routes
app.get('/', (req, res) => res.send(`<style>${STYLE}</style>BrowserBox Portal: <a href="/login">Login</a>`));
app.get('/login', (req, res) => {
  let html = `<style>${STYLE}</style>
    <a href="/auth/google">Google SSO</a><br>
    <a href="/auth/microsoft">Microsoft SSO</a><br>`;
  if (SAML_ENTRY_POINT && SAML_ENTRY_POINT !== 'dummy') {
    html += `<a href="/auth/saml">Okta/Azure SSO</a>`;
  }
  res.send(html);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), handleProvision);

app.get('/auth/microsoft', passport.authenticate('microsoft'));
app.get('/auth/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/login' }), handleProvision);

if (SAML_ENTRY_POINT && SAML_ENTRY_POINT !== 'dummy') {
  app.get('/auth/saml', passport.authenticate('saml'));
  app.post('/auth/saml/callback', passport.authenticate('saml', { failureRedirect: '/login' }), handleProvision);
}

app.get('/admin', requireAuth, isAdmin, handleAdminList);
app.post('/admin/approve', requireAuth, isAdmin, handleAdminApprove);
app.post('/admin/deny', requireAuth, isAdmin, handleAdminDeny);
app.get('/admin/config', requireAuth, isAdmin, handleAdminConfig);
app.post('/admin/config', requireAuth, isAdmin, handleAdminConfigSave);

app.listen(PORT, () => console.log(`Portal running on port ${PORT}`));

// 3) Functions, then Helper functions
function validateEnv() {
  const required = {
    GOOGLE_CLIENT_ID: 'Register at https://console.cloud.google.com/apis/credentials and add your OAuth Client ID. See Google docs: https://developers.google.com/identity/protocols/oauth2. If issues persist, check IdP logs—common with Entra misconfigs.',
    GOOGLE_CLIENT_SECRET: 'Add the matching secret from Google Cloud Console. If issues persist, check IdP logs—common with Entra misconfigs.',
    MICROSOFT_CLIENT_ID: 'Register at https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade and add your App ID. Entra tips: https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/tutorial-manage-certificates-for-federated-single-sign-on. If issues persist, check IdP logs—common with Entra misconfigs.',
    MICROSOFT_CLIENT_SECRET: 'Add the client secret from Azure. If issues persist, check IdP logs—common with Entra misconfigs.',
    BOOTSTRAP_ADMIN: 'Set your initial admin email in .env. If issues persist, check IdP logs—common with Entra misconfigs.',
    JWT_SECRET: 'Generate a strong secret for JWT fallback (e.g., via openssl rand -hex 32). If issues persist, check IdP logs—common with Entra misconfigs.'
  };
  if (SAML_ENTRY_POINT && SAML_ENTRY_POINT !== 'dummy') {
    required.SAML_ENTRY_POINT = 'For Okta/Entra, get from your IdP dashboard (e.g., https://your-okta.com/app/sso/saml/metadata). Okta guide: https://developer.okta.com/docs/guides/build-sso-integration/saml2/main/. If issues persist, check IdP logs—common with Entra misconfigs.';
    required.SAML_IDP_CERT = 'The Identity Provider certificate (public key) from your SAML IdP metadata. Required for signature validation. Get from IdP dashboard or metadata XML.';
  }
  let errors = [];
  Object.entries(required).forEach(([key, fix]) => {
    if (!process.env[key]) errors.push(`Missing ${key} in .env. Fix: ${fix}`);
  });
  if (errors.length) {
    console.error('Env validation failed:\n' + errors.join('\n'));
    process.exit(1);
  }
}

async function verifyCallback(accessToken, refreshToken, profile, done) {
  const userId = profile.emails[0].value;
  try {
    db.get('SELECT * FROM approvals WHERE sso_id = ?', [userId], (err, approval) => {
      if (err) return done(err);
      if (!approval) {
        db.run('INSERT OR IGNORE INTO approvals (sso_id) VALUES (?)', [userId]);
      }
    });
    db.get('SELECT * FROM users WHERE sso_id = ?', [userId], (err, row) => {
      if (err) return done(err);
      if (row) return done(null, row);

      db.get('SELECT status FROM approvals WHERE sso_id = ?', [userId], async (err, approval) => {
        if (err) return done(err);
        if (approval?.status !== 'approved') return done(null, false, { message: 'Pending approval—contact your admin to whitelist your email.' });

        const systemUser = userId.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        try {
          await createSystemUser(systemUser);
          const assignedPort = await getAvailablePort();
          db.run('INSERT INTO users (sso_id, system_user, assigned_port) VALUES (?, ?, ?)', [userId, systemUser, assignedPort], (err) => {
            done(err, { id: userId, system_user: systemUser, assigned_port: assignedPort });
          });
        } catch (error) {
          done(new Error(`User creation failed: ${error.message}. Check system perms or try a different username. If IdP-related, verify .env against provider docs.`));
        }
      });
    });
  } catch (error) {
    done(new Error(`Verification error: ${error.message}. Ensure IdP config in .env matches your provider setup—common with SAML mismatches. See provider docs for troubleshooting.`));
  }
}

async function handleProvision(req, res) {
  const user = req.user;
  const userId = user.id;
  try {
    const { stdout: statusOutput } = await exec(`bbx status | grep ${user.system_user}` || '');
    db.get('SELECT status FROM approvals WHERE sso_id = ?', [userId], async (err, approval) => {
      if (err) throw err;
      if (approval?.status !== 'approved') {
        return res.send('<style>' + STYLE + '</style>Access pending admin approval. Contact your admin to approve your email in /admin.');
      }
      if (!statusOutput.includes('running')) {
        await exec(`sudo bbx run-as ${user.system_user} ${user.assigned_port}`);
      }
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
      const link = await getMagicLink(user);
      res.redirect(`${link}?auth_token=${token}`);
    });
  } catch (error) {
    res.send('<style>' + STYLE + '</style>Error provisioning: ' + error.message + '. Check logs or ensure bbx CLI is installed and sudo works. If SSO-related, double-check IdP setup.');
  }
}

async function getMagicLink(user) {
  const { stdout } = await exec(`bbx logs | grep "login link" | tail -1`);
  return stdout.trim() || `http://${HOSTNAME}:${user.assigned_port}/`;
}

async function createSystemUser(username) {
  let command;
  if (PLATFORM === 'linux' || PLATFORM === 'darwin') {
    command = `sudo useradd -m ${username}`;
  } else if (PLATFORM === 'win32') {
    command = `net user ${username} /add`;
  } else {
    throw new Error(`Unsupported platform: ${PLATFORM}. Add support for your OS or run manually.`);
  }
  await exec(command);
}

async function getAvailablePort() {
  return new Promise((resolve) => {
    db.get('SELECT MAX(assigned_port) as maxPort FROM users', (err, row) => {
      if (err) throw err;
      resolve((row.maxPort || BASE_PORT) + 1);
    });
  });
}

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.id };
      return next();
    } catch (err) {
      return res.send('<style>' + STYLE + '</style>Invalid token. Login again.');
    }
  }
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  db.get('SELECT * FROM admins WHERE sso_id = ?', [req.user.id], (err, row) => {
    if (err || !row) return res.send('<style>' + STYLE + '</style>Admin access only. Ask an admin to add your email to the admins table.');
    next();
  });
}

async function handleAdminList(req, res) {
  db.all('SELECT * FROM approvals', (err, rows) => {
    if (err) return res.send('<style>' + STYLE + '</style>Error loading approvals: ' + err.message + '. Check DB perms.');
    let html = '<style>' + STYLE + '</style><h1>Admin Whitelist</h1><ul>';
    rows.forEach(row => {
      html += `<li>${row.sso_id} (${row.status}) 
        <form action="/admin/approve" method="post" style="display:inline;"><input type="hidden" name="sso_id" value="${row.sso_id}"><button>Approve</button></form>
        <form action="/admin/deny" method="post" style="display:inline;"><input type="hidden" name="sso_id" value="${row.sso_id}"><button>Deny</button></form></li>`;
    });
    html += '</ul><a href="/admin/config">Configure SSO</a>';
    res.send(html);
  });
}

async function handleAdminApprove(req, res) {
  const ssoId = req.body.sso_id;
  db.run('UPDATE approvals SET status = "approved" WHERE sso_id = ?', [ssoId], (err) => {
    if (err) return res.send('<style>' + STYLE + '</style>Error approving: ' + err.message + '. Try DB query manually.');
    res.redirect('/admin');
  });
}

async function handleAdminDeny(req, res) {
  const ssoId = req.body.sso_id;
  db.run('UPDATE approvals SET status = "denied" WHERE sso_id = ?', [ssoId], (err) => {
    if (err) return res.send('<style>' + STYLE + '</style>Error denying: ' + err.message + '. Try DB query manually.');
    res.redirect('/admin');
  });
}

function handleAdminConfig(req, res) {
  res.send('<style>' + STYLE + '</style>' + `
    <h1>SSO Config</h1>
    <form action="/admin/config" method="post">
      Google Client ID: <input name="GOOGLE_CLIENT_ID" placeholder="${GOOGLE_CLIENT_ID ? 'Set' : ''}"><br>
      Google Secret: <input name="GOOGLE_CLIENT_SECRET" placeholder="${GOOGLE_CLIENT_SECRET ? 'Set' : ''}"><br>
      Microsoft Client ID: <input name="MICROSOFT_CLIENT_ID" placeholder="${MICROSOFT_CLIENT_ID ? 'Set' : ''}"><br>
      Microsoft Secret: <input name="MICROSOFT_CLIENT_SECRET" placeholder="${MICROSOFT_CLIENT_SECRET ? 'Set' : ''}"><br>
      SAML Entry Point: <input name="SAML_ENTRY_POINT" placeholder="${SAML_ENTRY_POINT ? 'Set' : ''}"><br>
      SAML IDP Cert: <input name="SAML_IDP_CERT" placeholder="${SAML_IDP_CERT ? 'Set' : ''}"><br> <!-- New input -->
      JWT Secret: <input name="JWT_SECRET" placeholder="${JWT_SECRET ? 'Set' : ''}"><br>
      <button>Save & Restart</button>
    </form>
  `);
}

async function handleAdminConfigSave(req, res) {
  const updates = [];
  Object.entries(req.body).forEach(([key, value]) => {
    if (value) {
      process.env[key] = value;
      updates.push(`${key}=${value}`);
    }
  });
  if (updates.length) {
    fs.appendFileSync(ENV_PATH, `\n${updates.join('\n')}`);
  }
  res.send('<style>' + STYLE + '</style>Config saved. Restarting server—use PM2 to reload.');
  setTimeout(() => process.exit(0), 1000);
}
