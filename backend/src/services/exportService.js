import db from '../config/db.js';

// Generate league table as data for frontend rendering
export const getLeagueTableData = async () => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.team,
        u.rating,
        COUNT(f.id) as matches_played,
        COALESCE(SUM(
          CASE 
            WHEN f.winner_id = u.id THEN 3
            WHEN f.player1_score IS NOT NULL AND f.player2_score IS NOT NULL AND f.player1_score = f.player2_score THEN 1
            ELSE 0
          END
        ), 0) as points,
        COALESCE(SUM(CASE WHEN f.winner_id = u.id THEN 1 ELSE 0 END), 0) as wins,
        COALESCE(SUM(CASE WHEN f.player1_score IS NOT NULL AND f.player2_score IS NOT NULL AND f.player1_score = f.player2_score THEN 1 ELSE 0 END), 0) as draws,
        COALESCE(SUM(CASE WHEN f.player1_score IS NOT NULL AND f.player2_score IS NOT NULL AND f.winner_id != u.id THEN 1 ELSE 0 END), 0) as losses,
        COALESCE(SUM(
          CASE 
            WHEN f.player1_id = u.id THEN f.player1_score
            WHEN f.player2_id = u.id THEN f.player2_score
            ELSE 0
          END
        ), 0) as goals_for,
        COALESCE(SUM(
          CASE 
            WHEN f.player1_id = u.id THEN f.player2_score
            WHEN f.player2_id = u.id THEN f.player1_score
            ELSE 0
          END
        ), 0) as goals_against
      FROM player_accounts u
      LEFT JOIN fixtures f ON (f.player1_id = u.id OR f.player2_id = u.id) 
        AND f.status = 'completed'
        AND f.tournament_id IS NULL
      GROUP BY u.id, u.username, u.team, u.rating
      ORDER BY points DESC, (goals_for - goals_against) DESC, goals_for DESC
    `);

    const standings = result.rows.map((player, index) => ({
      position: index + 1,
      id: player.id,
      username: player.username,
      team: player.team,
      rating: parseInt(player.rating),
      matches_played: parseInt(player.matches_played),
      points: parseInt(player.points),
      wins: parseInt(player.wins),
      draws: parseInt(player.draws),
      losses: parseInt(player.losses),
      goals_for: parseInt(player.goals_for),
      goals_against: parseInt(player.goals_against),
      goal_difference: parseInt(player.goals_for) - parseInt(player.goals_against)
    }));

    return standings;
  } catch (error) {
    console.error('❌ Error getting league table data:', error);
    throw error;
  }
};

// Generate fixtures data for frontend rendering
export const getFixturesData = async (limit = 20) => {
  try {
    const result = await db.query(`
      SELECT 
        f.id,
        f.match_date,
        f.status,
        f.player1_score,
        f.player2_score,
        f.tournament_id,
        p1.username as player1_name,
        p1.team as player1_team,
        p2.username as player2_name,
        p2.team as player2_team,
        t.name as tournament_name
      FROM fixtures f
      LEFT JOIN player_accounts p1 ON f.player1_id = p1.id
      LEFT JOIN player_accounts p2 ON f.player2_id = p2.id
      LEFT JOIN tournaments t ON f.tournament_id = t.id
      ORDER BY f.match_date DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(fixture => ({
      ...fixture,
      match_date: new Date(fixture.match_date).toLocaleString()
    }));
  } catch (error) {
    console.error('❌ Error getting fixtures data:', error);
    throw error;
  }
};
