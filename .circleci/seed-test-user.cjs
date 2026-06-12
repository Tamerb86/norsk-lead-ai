// Seeds the user the integration tests assume exists (id = 1).
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(
    `INSERT INTO users (id, "openId", name, email, role)
     VALUES (1, 'test-user', 'Test User', 'test@example.com', 'user')
     ON CONFLICT (id) DO NOTHING`
  );
  await pool.query(`SELECT setval('users_id_seq', 100)`);
  await pool.end();
  console.log("Seeded test user id=1");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
