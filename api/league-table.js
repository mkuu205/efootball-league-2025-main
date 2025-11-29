module.exports = (app, supabaseAdmin) => {
  // Get league table
  app.get('/api/league-table', async (req, res) => {
    try {
      const { data: players, error: playerError } = await supabaseAdmin.from('players').select('*');
      if (playerError) throw playerError;

      const { data: results, error: resultsError } = await supabaseAdmin.from('results').select('*');
      if (resultsError) throw resultsError;

      const table = players.map(p => ({
        player: p.name,
        team: p.team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
      }));

      results.forEach(match => {
        const home = table.find(p => p.player === match.home_player);
        const away = table.find(p => p.player === match.away_player);
        if (!home || !away) return;

        home.played++; away.played++;
        home.gf += match.home_score; home.ga += match.away_score;
        away.gf += match.away_score; away.ga += match.home_score;
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;

        if (match.home_score > match.away_score) { home.won++; away.lost++; home.points += 3; }
        else if (match.home_score < match.away_score) { away.won++; home.lost++; away.points += 3; }
        else { home.drawn++; away.drawn++; home.points += 1; away.points += 1; }
      });

      table.sort((a, b) => b.points - a.points || b.gd - a.gd);

      res.json({ success: true, league_table: table });
    } catch (error) {
      console.error('❌ League table computation failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};
