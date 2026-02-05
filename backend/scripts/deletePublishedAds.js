'use strict';

const { Client } = require('pg');

// Production DB connection (Render)
const config = {
	host: 'dpg-d3vqqb95pdvs73ba8b70-a.oregon-postgres.render.com',
	user: 'viewapp_postgres_4rlf_user',
	database: 'viewapp_postgres_4rlf',
	password: 'kSGkSRibc6kBvHNxZMFen4KYfMgZwIvP',
	ssl: { rejectUnauthorized: false }
};

async function run() {
	const client = new Client(config);
	try {
		await client.connect();
		console.log('✅ Connected to Postgres');

        // Use a transaction to ensure atomicity
		await client.query('BEGIN');

		// Collect candidate ads (published = visible to viewers)
		await client.query(`
			CREATE TEMP TABLE tmp_published_ads AS
			SELECT id FROM ads
			WHERE is_active = TRUE
			  AND verification_status = 'approved'
			  AND status IN ('active','approved');
		`);

		const { rows: countRows } = await client.query(`SELECT COUNT(*)::int AS n FROM tmp_published_ads`);
		const total = countRows[0]?.n || 0;
		console.log(`🔍 Found ${total} published ads to remove`);

		if (total === 0) {
			await client.query('ROLLBACK');
			console.log('ℹ️ Nothing to delete. Exiting.');
			return;
		}

		// Delete dependent rows first (order matters on some schemas)
		const deletions = [
			{ table: 'view_events', sql: `DELETE FROM view_events WHERE ad_id IN (SELECT id FROM tmp_published_ads)` },
			{ table: 'comments', sql: `DELETE FROM comments WHERE ad_id IN (SELECT id FROM tmp_published_ads)` },
			{ table: 'ad_appeals', sql: `DELETE FROM ad_appeals WHERE ad_id IN (SELECT id FROM tmp_published_ads)` },
			{ table: 'ad_verification_history', sql: `DELETE FROM ad_verification_history WHERE ad_id IN (SELECT id FROM tmp_published_ads)` },
		];

		for (const step of deletions) {
			const res = await client.query(step.sql);
			console.log(`🗑️  Deleted ${res.rowCount} rows from ${step.table}`);
		}

		// Finally delete ads
		const delAds = await client.query(`DELETE FROM ads WHERE id IN (SELECT id FROM tmp_published_ads)`);
		console.log(`🗑️  Deleted ${delAds.rowCount} rows from ads`);

		await client.query('COMMIT');
		console.log('✅ Deletion committed');
	} catch (err) {
		console.error('❌ Error during deletion:', err);
		try { await client.query('ROLLBACK'); } catch (_) {}
		process.exitCode = 1;
	} finally {
		try { await client.end(); } catch (_) {}
	}
}

run();


