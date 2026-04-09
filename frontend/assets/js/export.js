// Image Export System for eFootball League 2026
window.imageExporter = {
  // Export league table as PNG
  exportLeagueTable: async () => {
    try {
      const response = await api.get('/api/export/league-table');
      const standings = response.data;

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 1200;
      canvas.height = 200 + (standings.length * 50);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#0ea5e9';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('eFootball League 2026 - Standings', 40, 60);

      // Headers
      const headers = ['#', 'Player', 'Team', 'MP', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
      const colWidths = [40, 200, 150, 60, 60, 60, 60, 60, 60, 80, 80];
      let x = 40;
      const headerY = 110;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 85, canvas.width - 40, 35);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 16px Arial';
      
      headers.forEach((header, i) => {
        ctx.fillText(header, x, headerY);
        x += colWidths[i];
      });

      // Data rows
      ctx.font = '14px Arial';
      standings.forEach((player, index) => {
        const y = 145 + (index * 50);
        x = 40;

        // Alternate row background
        if (index % 2 === 0) {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
          ctx.fillRect(20, y - 20, canvas.width - 40, 50);
        }

        const row = [
          player.position.toString(),
          player.username,
          player.team || 'N/A',
          player.matches_played.toString(),
          player.wins.toString(),
          player.draws.toString(),
          player.losses.toString(),
          player.goals_for.toString(),
          player.goals_against.toString(),
          player.goal_difference.toString(),
          player.points.toString()
        ];

        row.forEach((value, i) => {
          ctx.fillStyle = i === 10 ? '#0ea5e9' : '#94a3b8';
          if (i === 0) ctx.fillStyle = '#f1f5f9';
          ctx.fillText(value, x, y);
          x += colWidths[i];
        });
      });

      // Download
      const link = document.createElement('a');
      link.download = `league-table-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('League table exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export league table');
    }
  },

  // Export fixtures as PNG
  exportFixtures: async () => {
    try {
      const response = await api.get('/api/export/fixtures');
      const fixtures = response.data;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 1200;
      canvas.height = 200 + (fixtures.length * 60);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#0ea5e9';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('eFootball League 2026 - Fixtures', 40, 60);

      // Headers
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 85, canvas.width - 40, 35);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Date', 40, 110);
      ctx.fillText('Home', 250, 110);
      ctx.fillText('Score', 600, 110);
      ctx.fillText('Away', 750, 110);
      ctx.fillText('Status', 1050, 110);

      // Data
      ctx.font = '14px Arial';
      fixtures.forEach((fixture, index) => {
        const y = 145 + (index * 60);

        if (index % 2 === 0) {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
          ctx.fillRect(20, y - 20, canvas.width - 40, 60);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(fixture.match_date, 40, y);
        ctx.fillText(`${fixture.player1_name}`, 250, y);
        
        if (fixture.status === 'completed') {
          ctx.fillStyle = '#10b981';
          ctx.fillText(`${fixture.player1_score} - ${fixture.player2_score}`, 600, y);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.fillText('vs', 600, y);
        }
        
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${fixture.player2_name}`, 750, y);
        
        ctx.fillStyle = fixture.status === 'completed' ? '#10b981' : '#f59e0b';
        ctx.fillText(fixture.status.toUpperCase(), 1050, y);
      });

      // Download
      const link = document.createElement('a');
      link.download = `fixtures-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Fixtures exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export fixtures');
    }
  }
};
