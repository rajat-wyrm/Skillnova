const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
function setupCronJobs() {
  cron.schedule('0 * * * *', async ()=>{
    try {
      const cutoff = new Date(Date.now() - 24*60*60*1000);
      const { rows } = await pool.query(
        "SELECT image_path FROM proof_submissions WHERE status='VERIFIED' AND verified_at < $1 AND image_path IS NOT NULL", [cutoff]
      );
      for(const row of rows) {
        const fp = path.join(__dirname,'..','..',row.image_path);
        if(fs.existsSync(fp)) fs.unlinkSync(fp);
      }
      await pool.query("UPDATE proof_submissions SET image_path=NULL WHERE status='VERIFIED' AND verified_at < $1", [cutoff]);
    } catch(err) { console.error('Proof cleanup error', err); }
  });
}
module.exports = { setupCronJobs };
