module.exports = (app, supabaseAdmin) => {
  /**
   * POST /api/initialize
   * Optional: seed default players
   */
  app.post('/api/initialize', async (req, res) => {
    try {
      const DEFAULT_PLAYERS = [
        { id: 1, name: 'alwaysresistance', team: 'Kenya', photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', strength: 3138, team_color: '#000000', default_photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg' },
        { id: 2, name: 'lildrip035', team: 'Chelsea', photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg', strength: 3100, team_color: '#034694', default_photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg' },
        { id: 3, name: 'Sergent white', team: 'Chelsea', photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', strength: 3042, team_color: '#034694', default_photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg' },
        { id: 4, name: 'skangaKe254', team: 'Liverpool', photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', strength: 2700, team_color: '#c8102e', default_photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg' },
        { id: 5, name: 'Drexas', team: 'Everton', photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', strength: 2792, team_color: '#003399', default_photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg' },
        { id: 6, name: 'Collo leevan', team: 'Manchester United', photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', strength: 2448, team_color: '#da291c', default_photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg' },
        { id: 7, name: 'captainkenn', team: 'West Ham', photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', strength: 3110, team_color: '#7c2c3b', default_photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg' },
        { id: 8, name: 'Bora kesho', team: 'Man U', photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg', strength: 3177, team_color: '#DA291C', default_photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg' }
      ];

      // Optional: Clear existing players
      await supabaseAdmin.from('players').delete().neq('id', 0);

      // Insert default players
      const { data, error } = await supabaseAdmin.from('players').insert(DEFAULT_PLAYERS);
      if (error) throw error;

      res.json({
        success: true,
        message: 'Supabase initialized with default players',
        players_inserted: data.length
      });

    } catch (error) {
      console.error('❌ Initialize failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
