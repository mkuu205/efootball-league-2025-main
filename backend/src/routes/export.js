import express from 'express';
import * as exportService from '../services/exportService.js';

const router = express.Router();

// GET /api/export/league-table
router.get('/league-table', async (req, res) => {
  try {
    const data = await exportService.getLeagueTableData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get league table data' });
  }
});

// GET /api/export/fixtures
router.get('/fixtures', async (req, res) => {
  try {
    const data = await exportService.getFixturesData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get fixtures data' });
  }
});

export default router;
