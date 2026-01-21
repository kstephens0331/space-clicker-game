import { NextResponse } from 'next/server';
import pool, { getWeekNumber } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const galaxyId = searchParams.get('galaxy') || 'solar_system';
    const bodyId = searchParams.get('body') || 'sun';
    const week = parseInt(searchParams.get('week')) || getWeekNumber();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const query = `
      SELECT
        device_id as "deviceId",
        energy,
        updated_at as "lastActive"
      FROM weekly_leaderboard
      WHERE galaxy_id = $1 AND body_id = $2 AND week_number = $3
      ORDER BY energy DESC
      LIMIT $4
    `;

    const result = await pool.query(query, [galaxyId, bodyId, week, limit]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      playerId: row.deviceId.slice(0, 8) + '...',
      totalEnergy: parseInt(row.energy),
      lastActive: row.lastActive
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Leaderboard fetch failed' }, { status: 500 });
  }
}
