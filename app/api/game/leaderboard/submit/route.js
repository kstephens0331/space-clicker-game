import { NextResponse } from 'next/server';
import pool, { getWeekNumber } from '@/lib/db';

export async function POST(request) {
  try {
    const { deviceId, galaxyId, bodyId, energy, week } = await request.json();

    if (!deviceId || !galaxyId || !bodyId) {
      return NextResponse.json({ error: 'Device ID, Galaxy ID, and Body ID required' }, { status: 400 });
    }

    const weekNumber = week || getWeekNumber();

    const query = `
      INSERT INTO weekly_leaderboard (device_id, galaxy_id, body_id, week_number, energy, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (device_id, galaxy_id, body_id, week_number)
      DO UPDATE SET
        energy = GREATEST(weekly_leaderboard.energy, EXCLUDED.energy),
        updated_at = NOW()
      RETURNING id, energy
    `;

    const result = await pool.query(query, [deviceId, galaxyId, bodyId, weekNumber, energy || 0]);

    return NextResponse.json({
      success: true,
      energy: result.rows[0].energy
    });
  } catch (error) {
    console.error('Score submit error:', error);
    return NextResponse.json({ error: 'Submit failed' }, { status: 500 });
  }
}
