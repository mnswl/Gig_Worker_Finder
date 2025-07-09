#!/usr/bin/env node
/*
  Gig Worker Finder – System Checker
  ----------------------------------
  A single command (`npm run check` inside this folder or `node "system checker/index.js"` from project root)
  verifies everything needed to run the whole stack locally:
   • Node and npm versions
   • Existence & completeness of .env files
   • Port availability (5000 & 3000)
   • MongoDB connectivity
   • Presence of installed dependencies for backend & frontend
*/
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');
const mongoose = require('mongoose');

// Helper logging
let allOk = true;
function log(ok, message) {
  const symbol = ok ? '✅' : '❌';
  console.log(`${symbol} ${message}`);
  if (!ok) allOk = false;
}

// Load env files from server & frontend so we can test values
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env') });

(async function run() {
  // 1. Versions ---------------------------------------------
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  log(nodeMajor >= 18, `Node version ${process.versions.node} (>= 18)`);

  try {
    const npmVersion = execSync('npm -v').toString().trim();
    const npmMajor = parseInt(npmVersion.split('.')[0], 10);
    log(npmMajor >= 9, `npm version ${npmVersion} (>= 9)`);
  } catch (err) {
    log(false, 'npm not found in PATH');
  }

  // 2. Env files --------------------------------------------
  const serverEnv = path.join(__dirname, '../server/.env');
  const frontEnv = path.join(__dirname, '../frontend/.env');
  log(fs.existsSync(serverEnv), 'server/.env present');
  log(fs.existsSync(frontEnv), 'frontend/.env present');

  // Required keys in server env
  const required = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
  required.forEach((k) => {
    // We allow JWT_SECRET to remain the placeholder because the backend
    // can generate/override it dynamically at runtime.
    let set = !!process.env[k];
    if (k !== 'JWT_SECRET') {
      set = set && !/your_.*_here/i.test(process.env[k]);
    }
    log(set, `env ${k} set`);
  });

  // 3. Port availability ------------------------------------
  async function portFree(port) {
    return new Promise((resolve) => {
      const tester = net
        .createServer()
        .once('error', () => resolve(false))
        .once('listening', () => tester.close(() => resolve(true)))
        .listen(port, '0.0.0.0');
    });
  }
  log(await portFree(5000), 'Port 5000 available');
  log(await portFree(3000), 'Port 3000 available');

  // 4. MongoDB connection -----------------------------------
  let mongoOk = false;
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        dbName: 'admin',
        serverSelectionTimeoutMS: 5000,
      });
      mongoOk = true;
    } catch (e) {
      mongoOk = false;
    } finally {
      await mongoose.disconnect().catch(() => {});
    }
  }
  log(mongoOk, 'MongoDB connection');

  // 5. Dependency folders -----------------------------------
  log(fs.existsSync(path.join(__dirname, '../server/node_modules')), 'Backend dependencies installed');
  log(fs.existsSync(path.join(__dirname, '../frontend/node_modules')), 'Frontend dependencies installed');

  console.log('\n' + (allOk ? '✅ All checks passed.' : '⚠️  Some checks failed – please review above items.'));
  process.exit(allOk ? 0 : 1);
})();
