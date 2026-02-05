/**
 * Cursor AI: End-to-End Video Reward Audit
 * Scope: Backend reward logic, Postgres DB, Frontend reward consumption
 * Safety: READ-ONLY DB queries, no writes
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// === CONFIGURATION ===
const PG_CONFIG = {
    host: 'dpg-d3vqqb95pdvs73ba8b70-a.oregon-postgres.render.com',
    port: 5432,
    user: 'viewapp_postgres_4rlf_user',
    password: 'kSGkSRibc6kBvHNxZMFen4KYfMgZwIvP',
    database: 'viewapp_postgres_4rlf',
    ssl: {
      rejectUnauthorized: false
    }
  };
  

// Path to project source code
const PROJECT_ROOT = path.resolve(__dirname, '..'); // adjust if needed

// Files/dirs to scan for reward logic
const BACKEND_CONTROLLERS = [
  'backend/src/controllers/videoController.js',
  'backend/src/controllers/viewerController.js',
  'backend/src/controllers/walletController.js',
  'backend/src/controllers/paymentController.js'
];

const BACKEND_ROUTES = [
  'backend/src/routes/videos.js',
  'backend/src/routes/viewerRoutes.js',
  'backend/src/routes/wallet.js'
];

const FRONTEND_COMPONENTS = [
  'AllAdsTabs.jsx',
  'VideoPage.jsx',
  'SectionVideos.jsx',
  'TikTokVideoPlayer.jsx'
];

// === HELPER FUNCTIONS ===
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

// Simple scan: checks for wallet/transaction mutations
function scanRewardLogic(fileContent) {
  const patterns = [
    /Wallet\.addBalance/,
    /Wallet\.deductBalance/,
    /Transaction\.create/,
    /CompanyWallet\.addCompanyFee/,
    /CompanyWallet\.addViewerReward/,
    /PurchasedPackage\.deductViewCost/
  ];

  const matches = patterns.filter((pattern) => pattern.test(fileContent));
  return matches.length > 0 ? matches : [];
}

// === POSTGRES AUDIT QUERIES ===
const DB_QUERIES = {
  rewardSumCheck: `
    SELECT id, viewer_reward_micro, company_share_micro, charged_micro
    FROM view_events
    WHERE is_completed = true
      AND (viewer_reward_micro + company_share_micro) <> charged_micro
    LIMIT 100;
  `,
  reward24hCheck: `
    SELECT user_id, ad_id, COUNT(*) AS completed_views
    FROM view_events
    WHERE is_completed = true
      AND completed_at >= NOW() - INTERVAL '24 HOURS'
    GROUP BY user_id, ad_id
    HAVING COUNT(*) > 1
    LIMIT 100;
  `,
  packageBudgetCheck: `
    SELECT id, remaining_micro
    FROM purchased_packages
    WHERE remaining_micro < 0
    LIMIT 100;
  `,
  walletTransactionOrphans: `
    SELECT t.id AS tx_id, t.from_wallet_id, t.to_wallet_id
    FROM transactions t
    LEFT JOIN wallets w_from ON t.from_wallet_id = w_from.id
    LEFT JOIN wallets w_to ON t.to_wallet_id = w_to.id
    WHERE (t.from_wallet_id IS NOT NULL AND w_from.id IS NULL)
       OR (t.to_wallet_id IS NOT NULL AND w_to.id IS NULL)
    LIMIT 100;
  `,
  companyWalletMismatch: `
    SELECT c.id AS company_wallet_id,
           c.balance_micro,
           c.total_fees_collected_micro,
           c.total_rewards_paid_micro,
           (COALESCE(c.total_fees_collected_micro,0) + COALESCE(c.total_rewards_paid_micro,0)) AS expected_balance
    FROM company_wallets c
    WHERE c.balance_micro <> (COALESCE(c.total_fees_collected_micro,0) + COALESCE(c.total_rewards_paid_micro,0))
    LIMIT 100;
  `
};

// === MAIN WORKFLOW ===
(async function main() {
  const auditReport = {
    codeScan: { backend: {}, frontend: {} },
    dbAudit: {},
    summary: {}
  };

  // --- Backend Scan ---
  BACKEND_CONTROLLERS.forEach((file) => {
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = readFileSafe(fullPath);
    auditReport.codeScan.backend[file] = content ? scanRewardLogic(content) : ['file missing'];
  });

  BACKEND_ROUTES.forEach((file) => {
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = readFileSafe(fullPath);
    auditReport.codeScan.backend[file] = content ? scanRewardLogic(content) : ['file missing'];
  });

  // --- Frontend Scan ---
  FRONTEND_COMPONENTS.forEach((file) => {
    const fullPath = path.join(PROJECT_ROOT, 'frontend/src/components', file);
    const content = readFileSafe(fullPath);
    // Check if frontend tries to mutate wallet or compute reward locally
    const frontendPatterns = [/wallet/, /reward/, /balance/];
    const matches = frontendPatterns.filter((p) => content && p.test(content));
    auditReport.codeScan.frontend[file] = matches.length ? matches : [];
  });

  // --- Postgres Audit ---
  const client = new Client(PG_CONFIG);
  await client.connect();

  for (const [checkName, query] of Object.entries(DB_QUERIES)) {
    try {
      const res = await client.query(query);
      auditReport.dbAudit[checkName] = res.rows.length ? res.rows : [];
    } catch (err) {
      auditReport.dbAudit[checkName] = { error: err.message };
    }
  }

  await client.end();

  // --- Summary ---
  auditReport.summary = {
    backendIssues: Object.values(auditReport.codeScan.backend).flat().filter(Boolean),
    frontendIssues: Object.values(auditReport.codeScan.frontend).flat().filter(Boolean),
    dbIssues: Object.values(auditReport.dbAudit).flat().filter(Boolean)
  };

  // --- Save JSON report ---
  const reportPath = path.join(PROJECT_ROOT, 'video_reward_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

  console.log(`✅ Video Reward Audit Completed. Report saved to ${reportPath}`);
})();
