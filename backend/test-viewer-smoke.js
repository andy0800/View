// Viewer Smoke Test: OTP login → session → sections/videos → start/complete view → wallet
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4001';
// Prefer seeded viewer phone if env not set
const TEST_VIEWER_PHONE = process.env.TEST_VIEWER_PHONE || '+96560000000';
const REDIS_URL = process.env.REDIS_URL || 'redis://red-d2vdrcmr433s73f4oaj0:6379';
let Redis;
try { Redis = require('ioredis'); } catch {}

let cookieJar = '';

function captureCookies(res) {
  const setCookies = res.headers['set-cookie'];
  if (setCookies && setCookies.length) {
    // Keep latest cookie set
    cookieJar = setCookies.map(c => c.split(';')[0]).join('; ');
  }
}

async function request(path, { method = 'GET', data, headers = {}, raw = false } = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(BASE_URL + path);
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieJar,
        ...headers
      },
      timeout: 10000
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);

    const req = http.request(options, (res) => {
      captureCookies(res);
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (raw) return resolve({ status: res.statusCode, data });
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

async function otpLoginFlow() {
  console.log('🔐 Requesting OTP...');
  await request('/auth/request-otp', { method: 'POST', data: { phone: TEST_VIEWER_PHONE } });
  // Fetch OTP from Redis if available, otherwise fall back to env
  let OTP = process.env.TEST_VIEWER_OTP;
  if (!OTP && Redis) {
    try {
      const redis = new Redis(REDIS_URL);
      OTP = await redis.get(`otp:${TEST_VIEWER_PHONE}`);
      await redis.quit();
    } catch {}
  }
  // Fallback to common test OTPs if not in Redis or env
  if (!OTP) {
    OTP = '0000';
    console.log('ℹ️ Using fallback OTP 0000');
  }
  console.log('🔐 Verifying OTP...');
  const verify = await request('/auth/verify-otp', { method: 'POST', data: { phone: TEST_VIEWER_PHONE, otp: OTP } });
  if (verify.status !== 200) throw new Error('OTP verify failed');
  console.log('✅ Viewer logged in');
}

async function sessionCheck() {
  const sess = await request('/auth/session');
  if (sess.status !== 200 || !sess.data?.user) throw new Error('Session check failed');
  console.log('✅ Session OK:', sess.data.user.id);
}

async function sectionsAndVideos() {
  const sections = await request('/api/viewer/sections');
  if (sections.status !== 200 || !Array.isArray(sections.data)) throw new Error('Sections fetch failed');
  console.log(`✅ Sections: ${sections.data.length}`);

  // Pick a section if available
  const section = sections.data[0];
  if (!section) return null;
  const vids = await request(`/api/viewer/sections/${section.key}/videos`);
  if (vids.status !== 200 || !vids.data?.videos) throw new Error('Section videos fetch failed');
  console.log(`✅ Videos in ${section.key}: ${vids.data.videos.length}`);
  const first = vids.data.videos[0] || null;
  if (first) console.log('🎬 First video id:', first.id);
  return first;
}

async function startAndCompleteView(video) {
  if (!video) return;
  const start = await request(`/api/viewer/ads/${video.id}/start`, { method: 'POST' });
  if (start.status !== 200 || !start.data?.viewEvent?.proofToken) {
    console.log('⚠️ Start response status:', start.status);
    console.log('⚠️ Start response data:', start.data);
    throw new Error('Start view failed');
  }
  const proofToken = start.data.viewEvent.proofToken;
  const required = start.data.viewEvent.requiredDuration || 10000;
  console.log('⏱️ Required ms:', required);

  // Simulate watch time (>=95%)
  const watchedMs = Math.ceil(required * 0.96);
  const complete = await request(`/api/viewer/ads/${video.id}/complete`, {
    method: 'POST',
    data: { adId: video.id, proofToken, watchedDurationMs: watchedMs }
  });
  if (complete.status !== 200 || !complete.data?.success) {
    console.log('⚠️ Complete response status:', complete.status);
    console.log('⚠️ Complete response data:', complete.data);
    throw new Error('Complete view failed');
  }
  console.log('✅ View completed. Reward:', complete.data.reward);
}

async function walletCheck() {
  const wallet = await request('/api/wallet');
  if (wallet.status !== 200 || !wallet.data?.success) throw new Error('Wallet fetch failed');
  console.log('✅ Wallet balance:', wallet.data.balance);
}

async function run() {
  try {
    await otpLoginFlow();
    await sessionCheck();
    const firstVideo = await sectionsAndVideos();
    await startAndCompleteView(firstVideo);
    await walletCheck();
    console.log('\n🏁 Viewer smoke test completed');
  } catch (e) {
    console.error('❌ Viewer smoke test failed:', e.message);
    process.exitCode = 1;
  }
}

run();


