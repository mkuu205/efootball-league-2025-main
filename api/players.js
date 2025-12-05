module.exports = (app, supabaseAdmin) => {
  // GET /api/players
  app.get('/api/players', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('players').select('*').order('id', { ascending: true });
      if (error) throw error;
      res.json({ success: true, players: data });
    } catch (error) {
      console.error('❌ Fetch players failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/players
  app.post('/api/players', async (req, res) => {
    try {
      const player = req.body;
      if (!player.name || !player.team) {
        return res.status(400).json({ success: false, message: 'Player name and team are required' });
      }

      const { data, error } = await supabaseAdmin.from('players').insert([player]);
      if (error) throw error;

      res.json({ success: true, player: data[0] });
    } catch (error) {
      console.error('❌ Add player failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
