import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';

const leagueController = {
  // GET /api/users
  getUsers: async (req, res) => {
    try {
      const result = await db.query(
        'SELECT id, username, email, rating FROM player_accounts'
      );
      successResponse(res, 'Users retrieved', result.rows);
    } catch (err) {
      console.error('❌ Get users error:', err);
      errorResponse(res, 'Failed to fetch users', 500);
    }
  },

  // GET /api/standings
  getStandings: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          id,
          username,
          team,
          rating,
          wins,
          losses,
          draws,
          goals_for,
          goals_against,
          (wins + losses + draws) as matches_played,
          (wins * 3 + draws) as points,
          (goals_for - goals_against) as goal_difference
        FROM player_accounts
        ORDER BY points DESC, goal_difference DESC, goals_for DESC
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
        goal_difference: parseInt(player.goal_difference)
      }));
      
      successResponse(res, 'Standings retrieved', standings);
    } catch (err) {
      console.error('❌ Standings error:', err);
      errorResponse(res, 'Failed to load standings', 500);
    }
  },

  // POST /api/fixtures/generate (admin)
  generateFixtures: async (req, res) => {
    try {
      const usersResult = await db.query('SELECT id FROM player_accounts ORDER BY id');
      const users = usersResult.rows;

      if (users.length < 2) {
        return errorResponse(res, 'Need at least 2 players to generate fixtures', 400);
      }

      // Round-robin algorithm
      const fixtures = [];
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          fixtures.push([users[i].id, users[j].id]);
        }
      }

      // Insert fixtures
      const insertPromises = fixtures.map(([player1_id, player2_id]) => {
        return db.query(
          'INSERT INTO fixtures (player1_id, player2_id, status) VALUES ($1, $2, $3)',
          [player1_id, player2_id, 'pending']
        );
      });

      await Promise.all(insertPromises);

      // Notify all players
      for (const user of users) {
        await createNotification({
          user_id: user.id,
          title: 'Fixtures Generated',
          message: 'New league fixtures have been generated. Check your matches!',
          type: 'match'
        });
      }

      successResponse(res, 'Fixtures generated successfully', {
        total_fixtures: fixtures.length
      });
    } catch (error) {
      console.error('❌ Generate fixtures error:', error);
      errorResponse(res, 'Failed to generate fixtures', 500);
    }
  },

  // GET /api/fixtures
  getFixtures: async (req, res) => {
    try {
      const { status } = req.query;

      const result = await db.query(
        `
        SELECT 
          f.*,
          p1.username AS player1_name,
          p1.team AS player1_team,
          p2.username AS player2_name,
          p2.team AS player2_team
        FROM fixtures f
        JOIN player_accounts p1 ON p1.id = f.player1_id
        JOIN player_accounts p2 ON p2.id = f.player2_id
        WHERE ($1::text IS NULL OR f.status = $1)
        ORDER BY f.match_date DESC
        LIMIT 50
        `,
        [status || null]
      );

      successResponse(res, 'Fixtures retrieved', result.rows);
    } catch (err) {
      console.error('❌ Fixtures error:', err);
      errorResponse(res, 'Failed to load fixtures', 500);
    }
  },

  // POST /api/results/submit
  submitResult: async (req, res) => {
    try {
      const { fixture_id, player1_score, player2_score } = req.body;

      if (!fixture_id || player1_score === undefined || player2_score === undefined) {
        return errorResponse(res, 'Fixture ID and scores are required', 400);
      }

      // Get fixture
      const fixtureResult = await db.query(
        'SELECT * FROM fixtures WHERE id = $1',
        [fixture_id]
      );

      if (fixtureResult.rows.length === 0) {
        return errorResponse(res, 'Fixture not found', 404);
      }

      const fixture = fixtureResult.rows[0];

      if (fixture.status === 'completed') {
        return errorResponse(res, 'Result already submitted', 400);
      }

      // Determine winner
      let winner_id = null;
      if (player1_score > player2_score) {
        winner_id = fixture.player1_id;
      } else if (player2_score > player1_score) {
        winner_id = fixture.player2_id;
      }

      // Update fixture
      await db.query(
        `UPDATE fixtures 
         SET player1_score = $1, player2_score = $2, winner_id = $3, status = 'completed'
         WHERE id = $4`,
        [player1_score, player2_score, winner_id, fixture_id]
      );

      // Create result record
      await db.query(
        `INSERT INTO results (fixture_id, player1_score, player2_score, winner_id, submitted_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [fixture_id, player1_score, player2_score, winner_id, req.user.id]
      );

      // Update player stats
      if (winner_id) {
        await db.query('UPDATE player_accounts SET wins = wins + 1 WHERE id = $1', [winner_id]);
        const loser_id = winner_id === fixture.player1_id ? fixture.player2_id : fixture.player1_id;
        await db.query('UPDATE player_accounts SET losses = losses + 1 WHERE id = $1', [loser_id]);
      } else {
        // Draw
        await db.query('UPDATE player_accounts SET draws = draws + 1 WHERE id = $1', [fixture.player1_id]);
        await db.query('UPDATE player_accounts SET draws = draws + 1 WHERE id = $1', [fixture.player2_id]);
      }

      // Update goals
      await db.query(
        'UPDATE player_accounts SET goals_for = goals_for + $1, goals_against = goals_against + $2 WHERE id = $3',
        [player1_score, player2_score, fixture.player1_id]
      );
      await db.query(
        'UPDATE player_accounts SET goals_for = goals_for + $1, goals_against = goals_against + $2 WHERE id = $3',
        [player2_score, player1_score, fixture.player2_id]
      );

      // Notify players
      await createNotification({
        user_id: fixture.player1_id,
        title: 'Match Completed',
        message: `Your match vs ${fixture.player2_name} ended ${player1_score}-${player2_score}`,
        type: 'match'
      });
      await createNotification({
        user_id: fixture.player2_id,
        title: 'Match Completed',
        message: `Your match vs ${fixture.player1_name} ended ${player2_score}-${player1_score}`,
        type: 'match'
      });

      successResponse(res, 'Result submitted successfully', {
        winner_id
      });
    } catch (error) {
      console.error('❌ Submit result error:', error);
      errorResponse(res, 'Failed to submit result', 500);
    }
  }
};

export default leagueController;
