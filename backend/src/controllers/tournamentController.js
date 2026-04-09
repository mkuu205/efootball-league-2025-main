import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';

const tournamentController = {
  // POST /api/tournaments/create (admin)
  createTournament: async (req, res) => {
    try {
      const { name, description, entry_fee, max_players } = req.body;

      if (!name) {
        return errorResponse(res, 'Tournament name is required', 400);
      }

      const result = await db.query(
        `INSERT INTO tournaments (name, description, entry_fee, max_players, status, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, description || '', entry_fee || 0, max_players || 0, 'pending', req.user.id]
      );

      // Notify all users about new tournament
      await createNotification({
        user_id: req.user.id,
        title: 'Tournament Created',
        message: `New tournament "${name}" has been created!`,
        type: 'tournament'
      });

      successResponse(res, 'Tournament created successfully', result.rows[0], 201);
    } catch (error) {
      console.error('❌ Create tournament error:', error);
      errorResponse(res, 'Failed to create tournament', 500);
    }
  },

  // GET /api/tournaments
  getTournaments: async (req, res) => {
    try {
      const result = await db.query(
        'SELECT * FROM tournaments ORDER BY created_at DESC'
      );

      successResponse(res, 'Tournaments retrieved', result.rows);
    } catch (error) {
      console.error('❌ Get tournaments error:', error);
      errorResponse(res, 'Failed to get tournaments', 500);
    }
  },

  // GET /api/tournaments/:id
  getTournament: async (req, res) => {
    try {
      const { id } = req.params;

      const tournamentResult = await db.query(
        'SELECT * FROM tournaments WHERE id = $1',
        [id]
      );

      if (tournamentResult.rows.length === 0) {
        return errorResponse(res, 'Tournament not found', 404);
      }

      // Get participants
      const participantsResult = await db.query(
        `SELECT p.id, p.username, p.team, p.rating, tp.payment_status, tp.joined_at
         FROM tournament_participants tp
         JOIN player_accounts p ON tp.player_id = p.id
         WHERE tp.tournament_id = $1
         ORDER BY tp.joined_at ASC`,
        [id]
      );

      successResponse(res, 'Tournament retrieved', {
        ...tournamentResult.rows[0],
        participants: participantsResult.rows
      });
    } catch (error) {
      console.error('❌ Get tournament error:', error);
      errorResponse(res, 'Failed to get tournament', 500);
    }
  },

  // POST /api/tournaments/:id/join
  joinTournament: async (req, res) => {
    try {
      const { id } = req.params;
      const playerId = req.user.id;

      // Get tournament
      const tournamentResult = await db.query(
        'SELECT * FROM tournaments WHERE id = $1',
        [id]
      );

      if (tournamentResult.rows.length === 0) {
        return errorResponse(res, 'Tournament not found', 404);
      }

      const tournament = tournamentResult.rows[0];

      if (tournament.status !== 'pending') {
        return errorResponse(res, 'Tournament is not open for registration', 400);
      }

      // Check if already joined
      const existingParticipant = await db.query(
        'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND player_id = $2',
        [id, playerId]
      );

      if (existingParticipant.rows.length > 0) {
        return errorResponse(res, 'Already joined this tournament', 400);
      }

      // Check max players
      if (tournament.max_players > 0) {
        const countResult = await db.query(
          'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1',
          [id]
        );

        if (parseInt(countResult.rows[0].count) >= tournament.max_players) {
          return errorResponse(res, 'Tournament is full', 400);
        }
      }

      // If free tournament, join directly
      if (parseFloat(tournament.entry_fee) === 0) {
        await db.query(
          'INSERT INTO tournament_participants (tournament_id, player_id, payment_status) VALUES ($1, $2, $3)',
          [id, playerId, 'not_required']
        );

        await createNotification({
          user_id: playerId,
          title: 'Tournament Joined',
          message: `You have successfully joined ${tournament.name}!`,
          type: 'tournament'
        });

        return successResponse(res, 'Joined tournament successfully', {
          tournament_id: id,
          payment_required: false
        });
      }

      // If paid tournament, return tournament info for payment
      successResponse(res, 'Payment required to join', {
        tournament_id: id,
        tournament_name: tournament.name,
        entry_fee: tournament.entry_fee,
        payment_required: true
      });
    } catch (error) {
      console.error('❌ Join tournament error:', error);
      errorResponse(res, 'Failed to join tournament', 500);
    }
  }
};

export default tournamentController;
