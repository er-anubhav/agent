import { NextRequest } from 'next/server';
import { createUser } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({
        error: 'Email and password are required'
      }, { status: 400 });
    }

    console.log(`🔧 Creating user: ${email}`);

    try {
      await createUser(email, password);
      console.log(`✅ User created successfully: ${email}`);
      
      return Response.json({
        success: true,
        message: `User ${email} created successfully`
      });
    } catch (error) {
      console.error('❌ Error creating user:', error);
      return Response.json({
        error: 'Failed to create user - user might already exist'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Request error:', error);
    return Response.json({
      error: 'Invalid request'
    }, { status: 400 });
  }
}
