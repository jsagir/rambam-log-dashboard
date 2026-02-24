import { NextResponse } from 'next/server';

export async function GET() {
  // Import the dashboard data directly
  const dashboardModule = await import('../../simple-dashboard/page');

  // Extract INTERACTIONS count via regex since they're constants
  const pageSource = dashboardModule.default.toString();

  // Simple regex to count interaction objects
  const idMatches = pageSource.match(/id:\s*\d+/g) || [];
  const count = idMatches.length;

  // Also check for Feb 24
  const hasFeb24 = pageSource.includes('Feb 24');

  return NextResponse.json({
    interactionCount: count,
    hasFeb24Data: hasFeb24,
    timestamp: new Date().toISOString(),
    message: count === 186 ? 'All data present' : 'Data mismatch detected'
  });
}
