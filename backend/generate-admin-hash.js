// Script to generate bcrypt hash for admin password
import bcrypt from 'bcryptjs';

const password = 'kish24';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Bcrypt Hash:', hash);
  console.log('\nUse this SQL to insert:');
  console.log(`INSERT INTO admin_auth (email, password) VALUES ('admin.kishtech.co.ke', '${hash}') ON CONFLICT (email) DO NOTHING;`);
});
