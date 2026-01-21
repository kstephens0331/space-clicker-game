import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      deviceId,
      energy,
      totalEnergy,
      bodyEnergy,
      bodyUpgrades,
      currentGalaxyIndex,
      currentBodyIndex,
      unlockedBodies,
      unlockedGalaxies
    } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    const query = `
      INSERT INTO players (
        device_id, energy, total_energy, body_energy, body_upgrades,
        current_galaxy_index, current_body_index, unlocked_bodies, unlocked_galaxies, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (device_id)
      DO UPDATE SET
        energy = EXCLUDED.energy,
        total_energy = EXCLUDED.total_energy,
        body_energy = EXCLUDED.body_energy,
        body_upgrades = EXCLUDED.body_upgrades,
        current_galaxy_index = EXCLUDED.current_galaxy_index,
        current_body_index = EXCLUDED.current_body_index,
        unlocked_bodies = EXCLUDED.unlocked_bodies,
        unlocked_galaxies = EXCLUDED.unlocked_galaxies,
        updated_at = NOW()
      RETURNING id, updated_at
    `;

    const values = [
      deviceId,
      energy || 0,
      totalEnergy || 0,
      JSON.stringify(bodyEnergy || {}),
      JSON.stringify(bodyUpgrades || {}),
      currentGalaxyIndex || 0,
      currentBodyIndex || 0,
      unlockedBodies || ['sun'],
      unlockedGalaxies || ['solar_system']
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
      updatedAt: result.rows[0].updated_at
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
