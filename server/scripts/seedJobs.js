// server/scripts/seedJobs.js
// Bulk-insert gigs defined in seedJobs.json
// -------------------------------------------------------
// 1. Ensure your backend is running locally on PORT 5000.
// 2. Make sure an employer (or admin) user exists and replace
//    EMAIL and PASS below with valid credentials.
// -------------------------------------------------------
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.SEED_BASE_URL || 'https://gigworkerfinder-production.up.railway.app/api';
const EMAIL = process.env.SEED_EMAIL || 'employer@example.com'; // TODO: replace
const PASS  = process.env.SEED_PASS  || 'password123';           // TODO: replace

const jsonPath = path.join(__dirname, 'seedJobs.json');
if (!fs.existsSync(jsonPath)) {
  console.error('❌ seedJobs.json not found. Make sure it exists in server/scripts.');
  process.exit(1);
}

(async () => {
  try {
    // 1) Log in to obtain JWT token
    console.log('🔐 Logging in as', EMAIL);
    let token;
    try {
      // Attempt login first
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: EMAIL,
        password: PASS,
      });
      token = loginRes.data.token;
    } catch (loginErr) {
      // If invalid credentials, try to register as a fresh employer
      if (loginErr.response && loginErr.response.status === 400) {
        console.log('🆕 No existing user – creating new employer account...');
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
          firstName: 'Seed',
          lastName: 'Employer',
          email: EMAIL,
          password: PASS,
          role: 'employer'
        });
        token = registerRes.data.token;
      } else {
        throw loginErr;
      }
    }
    if (!token) throw new Error('Failed to obtain token via login or registration');

    const gigs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📦 Seeding ${gigs.length} gigs ...`);

    const headers = { Authorization: `Bearer ${token}` };
    const batchSize = 5;

    for (let i = 0; i < gigs.length; i += batchSize) {
      const batch = gigs.slice(i, i + batchSize);
      await Promise.all(
        batch.map(g =>
          axios.post(`${BASE_URL}/jobs`, g, { headers })
            .catch(err => {
              console.error('❌ Failed to insert', g.title, err.response?.data || err.message);
            })
        )
      );
      console.log(`   → Inserted ${Math.min(i + batchSize, gigs.length)}/${gigs.length}`);
    }

    console.log('✅ All done');
    process.exit(0);
  } catch (err) {
    console.error('💥 Seeding failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();
