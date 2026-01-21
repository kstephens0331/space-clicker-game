-- Space Clicker Game - Galactic Edition
-- Database Schema for PostgreSQL

-- Main players table (stores full game state)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) UNIQUE NOT NULL,
  energy BIGINT DEFAULT 0,
  total_energy BIGINT DEFAULT 0,
  body_energy JSONB DEFAULT '{}',
  body_upgrades JSONB DEFAULT '{}',
  current_galaxy_index INT DEFAULT 0,
  current_body_index INT DEFAULT 0,
  unlocked_bodies TEXT[] DEFAULT ARRAY['sun'],
  unlocked_galaxies TEXT[] DEFAULT ARRAY['solar_system'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly leaderboard table (galaxy & body specific, resets weekly)
CREATE TABLE weekly_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL,
  galaxy_id VARCHAR(50) NOT NULL,
  body_id VARCHAR(50) NOT NULL,
  week_number INT NOT NULL,
  energy BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, galaxy_id, body_id, week_number)
);

-- Indexes for performance
CREATE INDEX idx_players_device_id ON players(device_id);
CREATE INDEX idx_leaderboard_galaxy_body_week ON weekly_leaderboard(galaxy_id, body_id, week_number, energy DESC);
CREATE INDEX idx_leaderboard_device ON weekly_leaderboard(device_id);

-- Auto-update trigger for players
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Cleanup old leaderboard entries (run weekly via cron)
-- DELETE FROM weekly_leaderboard WHERE week_number < (EXTRACT(WEEK FROM NOW()) - 4);
