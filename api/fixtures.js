module.exports = (app, supabaseAdmin) => {
  // Get all fixtures
  app.get('/api/fixtures', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('fixtures').select('*').order('date', { ascending: true });
      if (error) throw error;
      res.json({ success: true, fixtures: data });
    } catch (error) {
      console.error('❌ Fetch fixtures failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Add a fixture
  app.post('/api/fixtures', async (req, res) => {
    try {
      const fixture = req.body;
      if (!fixture.home_team || !fixture.away_team || !fixture.date) {
        return res.status(400).json({ success: false, message: 'home_team, away_team, and date are required' });
      }

      const { data, error } = await supabaseAdmin.from('fixtures').insert([fixture]);
      if (error) throw error;

      res.json({ success: true, fixture: data[0] });
    } catch (error) {
      console.error('❌ Add fixture failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
