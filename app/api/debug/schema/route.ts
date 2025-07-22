import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  try {
    // Test database connection and schema
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL not configured');
    }
    
    const client = postgres(process.env.POSTGRES_URL);
    
    // Try to query the Document table to see what columns exist
    const result = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Document' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    await client.end();
    
    return NextResponse.json({
      success: true,
      columns: result,
      message: "Database schema check completed"
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Database schema check failed"
    }, { status: 500 });
  }
}
