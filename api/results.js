module.exports = (app, supabaseAdmin) => {
  // Get all results
  app.get('/api/results', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('results').select('*').order('date', { ascending: true });
      if (error) throw error;
      res.json({ success: true, results: data });
    } catch (error) {
      console.error('❌ Fetch results failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Add a match result
  app.post('/api/results', async (req, res) => {
    try {
      const result = req.body;
      if (!result.match_id || result.home_score === undefined || result.away_score === undefined) {
        return res.status(400).json({ success: false, message: 'match_id, home_score, and away_score are required' });
      }

      const { data, error } = await supabaseAdmin.from('results').insert([result]);
      if (error) throw error;

      res.json({ success: true, result: data[0] });
    } catch (error) {
      console.error('❌ Add result failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
