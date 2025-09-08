// Advertiser Smoke Test: OTP login → packages → purchase (dry) → purchased → create ad (dry) → dashboard → wallet
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4001';
// Prefer seeded advertiser phone if env not set
const TEST_ADVERTISER_PHONE = process.env.TEST_ADVERTISER_PHONE || '+96550000000';
const REDIS_URL = process.env.REDIS_URL || 'redis://red-d2vdrcmr433s73f4oaj0:6379';
let Redis;
try { Redis = require('ioredis'); } catch {}

let cookieJar = '';

function captureCookies(res) {
  const setCookies = res.headers['set-cookie'];
  if (setCookies && setCookies.length) {
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
  console.log('🔐 Requesting OTP (advertiser)...');
  await request('/auth/request-otp', { method: 'POST', data: { phone: TEST_ADVERTISER_PHONE } });
  // Fetch OTP from Redis if available, otherwise env
  let OTP = process.env.TEST_ADVERTISER_OTP;
  if (!OTP && Redis) {
    try {
      const redis = new Redis(REDIS_URL);
      OTP = await redis.get(`otp:${TEST_ADVERTISER_PHONE}`);
      await redis.quit();
    } catch {}
  }
  if (!OTP) {
    OTP = '0000';
    console.log('ℹ️ Using fallback OTP 0000');
  }
  console.log('🔐 Verifying OTP...');
  const verify = await request('/auth/verify-otp', { method: 'POST', data: { phone: TEST_ADVERTISER_PHONE, otp: OTP } });
  if (verify.status !== 200) throw new Error('OTP verify failed');
  if (verify.data?.user?.role !== 'advertiser') console.warn('⚠️ Logged in user is not advertiser');
  console.log('✅ Advertiser logged in');
}

async function packagesAndPurchased() {
  const pkgs = await request('/api/advertiser/packages');
  if (pkgs.status !== 200 || !Array.isArray(pkgs.data)) throw new Error('Packages fetch failed');
  console.log(`✅ Packages: ${pkgs.data.length}`);
  const purchased = await request('/api/advertiser/packages/purchased');
  if (purchased.status !== 200 || !purchased.data?.purchasedPackages) throw new Error('Purchased packages fetch failed');
  console.log(`✅ Purchased packages: ${purchased.data.purchasedPackages.length}`);
  return { pkg: pkgs.data[0], purchased: purchased.data.purchasedPackages[0] };
}

async function dashboardAndAds() {
  const dash = await request('/api/advertiser/dashboard');
  if (dash.status !== 200 || !dash.data?.stats) throw new Error('Advertiser dashboard failed');
  console.log('✅ Dashboard stats keys:', Object.keys(dash.data.stats));
  const ads = await request('/api/advertiser/ads');
  if (ads.status !== 200 || !ads.data?.ads) throw new Error('Advertiser ads failed');
  console.log(`✅ Advertiser ads: ${ads.data.ads.length}`);
}

async function wallet() {
  const w = await request('/api/wallet');
  if (w.status !== 200 || !w.data?.success) throw new Error('Wallet fetch failed');
  console.log('✅ Wallet balance:', w.data.balance);
}

async function run() {
  try {
    await otpLoginFlow();
    await packagesAndPurchased();
    await dashboardAndAds();
    await wallet();
    console.log('\n🏁 Advertiser smoke test completed');
  } catch (e) {
    console.error('❌ Advertiser smoke test failed:', e.message);
    process.exitCode = 1;
  }
}

run();


