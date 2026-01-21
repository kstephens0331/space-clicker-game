import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { deviceId } = await params;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    const query = `
      SELECT
        device_id as "deviceId",
        energy,
        total_energy as "totalEnergy",
        body_energy as "bodyEnergy",
        body_upgrades as "bodyUpgrades",
        current_galaxy_index as "currentGalaxyIndex",
        current_body_index as "currentBodyIndex",
        unlocked_bodies as "unlockedBodies",
        unlocked_galaxies as "unlockedGalaxies",
        updated_at as "updatedAt"
      FROM players
      WHERE device_id = $1
    `;

    const result = await pool.query(query, [deviceId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Load error:', error);
    return NextResponse.json({ error: 'Load failed' }, { status: 500 });
  }
}
