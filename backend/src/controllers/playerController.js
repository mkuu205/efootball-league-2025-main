import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

const playerController = {
  // GET /api/player/profile
  getProfile: async (req, res) => {
    try {
      const result = await db.query(
        'SELECT id, username, email, role, team, logo_url, rating, wins, losses, draws, goals_for, goals_against, last_seen, created_at FROM player_accounts WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Player not found', 404);
      }

      successResponse(res, 'Profile retrieved', result.rows[0]);
    } catch (error) {
      console.error('❌ Get profile error:', error);
      errorResponse(res, 'Failed to get profile', 500);
    }
  },

  // GET /api/player/stats
  getStats: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT 
          rating,
          wins,
          losses,
          draws,
          goals_for,
          goals_against,
          (wins + losses + draws) as total_matches,
          CASE 
            WHEN (wins + losses + draws) > 0 
            THEN ROUND((wins::decimal / (wins + losses + draws)) * 100, 2)
            ELSE 0 
          END as win_rate
        FROM player_accounts 
        WHERE id = $1`,
        [req.user.id]
      );

      successResponse(res, 'Stats retrieved', result.rows[0]);
    } catch (error) {
      console.error('❌ Get stats error:', error);
      errorResponse(res, 'Failed to get stats', 500);
    }
  },

  // GET /api/player/matches
  getMatches: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT 
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
          t.name as tournament_name,
          CASE 
            WHEN f.winner_id = $1 THEN 'won'
            WHEN f.winner_id IS NOT NULL THEN 'lost'
            WHEN f.status = 'completed' THEN 'draw'
            ELSE 'pending'
          END as result
        FROM fixtures f
        LEFT JOIN player_accounts p1 ON f.player1_id = p1.id
        LEFT JOIN player_accounts p2 ON f.player2_id = p2.id
        LEFT JOIN tournaments t ON f.tournament_id = t.id
        WHERE f.player1_id = $1 OR f.player2_id = $1
        ORDER BY f.match_date DESC
        LIMIT 20`,
        [req.user.id]
      );

      successResponse(res, 'Matches retrieved', result.rows);
    } catch (error) {
      console.error('❌ Get matches error:', error);
      errorResponse(res, 'Failed to get matches', 500);
    }
  },

  // GET /api/player/receipts
  getReceipts: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT pt.*, t.name as tournament_name
         FROM payment_transactions pt
         LEFT JOIN tournaments t ON pt.tournament_id = t.id
         WHERE pt.player_id = $1
         ORDER BY pt.created_at DESC`,
        [req.user.id]
      );

      successResponse(res, 'Receipts retrieved', result.rows);
    } catch (error) {
      console.error('❌ Get receipts error:', error);
      errorResponse(res, 'Failed to get receipts', 500);
    }
  },

  // GET /api/player/tournaments
  getTournaments: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT t.*, tp.payment_status, tp.joined_at
         FROM tournaments t
         JOIN tournament_participants tp ON t.id = tp.tournament_id
         WHERE tp.player_id = $1
         ORDER BY tp.joined_at DESC`,
        [req.user.id]
      );

      successResponse(res, 'Tournaments retrieved', result.rows);
    } catch (error) {
      console.error('❌ Get tournaments error:', error);
      errorResponse(res, 'Failed to get tournaments', 500);
    }
  }
};

export default playerController;
