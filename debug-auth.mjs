// Debug script to check user authentication
import { getUser } from './lib/db/queries.js';
import { compare } from 'bcrypt-ts';

async function debugAuth() {
  const email = 'testbot@example.com';
  const password = 'testbot123';
  
  console.log('🔍 Debugging authentication for:', email);
  
  try {
    // Check if user exists
    const users = await getUser(email.toLowerCase());
    console.log('👥 Found users:', users.length);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 User details:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Has password:', !!user.password);
      console.log('   Password length:', user.password?.length || 0);
      
      if (user.password) {
        // Test password comparison
        const isValidPassword = await compare(password, user.password);
        console.log('🔑 Password comparison result:', isValidPassword);
        
        // Also test with different cases
        const testPasswords = [
          'testbot123',
          'Testbot123',
          'TESTBOT123'
        ];
        
        for (const testPass of testPasswords) {
          const result = await compare(testPass, user.password);
          console.log(`   Testing "${testPass}":`, result);
        }
      }
    } else {
      console.log('❌ No user found with email:', email);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAuth().catch(console.error);
