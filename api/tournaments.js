// Tournament Management API

let supabase = null;

// Initialize with supabase client from server
function initTournaments(supabaseClient) {
    supabase = supabaseClient;
}

// Get all tournaments
async function getTournaments(req, res) {
    try {
        const { status } = req.query;
        
        let query = supabase
            .from('tournaments')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        // If table doesn't exist, return empty array
        if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                console.log('Tournaments table does not exist yet. Run the SQL setup.');
                return res.json({ success: true, tournaments: [], table_missing: true });
            }
            throw error;
        }
        
        res.json({ success: true, tournaments: data || [] });
    } catch (err) {
        console.error('Error fetching tournaments:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Get single tournament with participants
async function getTournament(req, res) {
    try {
        const { id } = req.params;
        
        const { data: tournament, error: tError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single();
        
        if (tError) throw tError;
        
        // Get participants - simplified query
        const { data: participants, error: partErr } = await supabase
            .from('tournament_participants')
            .select('*')
            .eq('tournament_id', id);
        
        if (partErr) console.error('Participants error:', partErr);
        
        // Get player details for participants
        const participantsWithPlayers = [];
        if (participants && participants.length > 0) {
            for (const p of participants) {
                let playerData = null;
                if (p.player_id) {
                    const { data: player } = await supabase
                        .from('players')
                        .select('id, name, team, photo')
                        .eq('id', p.player_id)
                        .single();
                    playerData = player;
                }
                participantsWithPlayers.push({ ...p, player: playerData });
            }
        }
        
        // Get fixtures - simplified query
        const { data: fixtures, error: fixErr } = await supabase
            .from('tournament_fixtures')
            .select('*')
            .eq('tournament_id', id)
            .order('round')
            .order('match_number');
        
        if (fixErr) console.error('Fixtures error:', fixErr);
        
        // Get player details for fixtures
        const fixturesWithPlayers = [];
        if (fixtures && fixtures.length > 0) {
            // Get all players at once
            const { data: allPlayers } = await supabase.from('players').select('id, name, team, photo');
            const playersMap = {};
            (allPlayers || []).forEach(p => playersMap[p.id] = p);
            
            for (const f of fixtures) {
                fixturesWithPlayers.push({
                    ...f,
                    home_player: playersMap[f.home_player_id] || null,
                    away_player: playersMap[f.away_player_id] || null
                });
            }
        }
        
        // Get standings - simplified query
        const { data: standings, error: standErr } = await supabase
            .from('tournament_standings')
            .select('*')
            .eq('tournament_id', id)
            .order('points', { ascending: false })
            .order('goal_difference', { ascending: false });
        
        if (standErr) console.error('Standings error:', standErr);
        
        // Get player details for standings
        const standingsWithPlayers = [];
        if (standings && standings.length > 0) {
            const { data: allPlayers } = await supabase.from('players').select('id, name, team, photo');
            const playersMap = {};
            (allPlayers || []).forEach(p => playersMap[p.id] = p);
            
            for (const s of standings) {
                standingsWithPlayers.push({
                    ...s,
                    player: playersMap[s.player_id] || null
                });
            }
        }
        
        res.json({ 
            success: true, 
            tournament,
            participants: participantsWithPlayers,
            fixtures: fixturesWithPlayers,
            standings: standingsWithPlayers
        });
    } catch (err) {
        console.error('Error fetching tournament:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Create tournament (Admin)
async function createTournament(req, res) {
    try {
        const { 
            name, description, entry_fee, prize_pool, 
            max_players, min_players, format, 
            start_date, end_date, registration_deadline, rules 
        } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Tournament name is required' });
        }
        
        const { data, error } = await supabase
            .from('tournaments')
            .insert({
                name,
                description,
                entry_fee: entry_fee || 0,
                prize_pool: prize_pool || 0,
                max_players: max_players || 16,
                min_players: min_players || 4,
                format: format || 'league',
                start_date,
                end_date,
                registration_deadline,
                rules,
                status: 'registration_open',
                created_by: 'admin'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, tournament: data });
    } catch (err) {
        console.error('Error creating tournament:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Update tournament (Admin)
async function updateTournament(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('tournaments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, tournament: data });
    } catch (err) {
        console.error('Error updating tournament:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Delete tournament (Admin)
async function deleteTournament(req, res) {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('tournaments')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Tournament deleted' });
    } catch (err) {
        console.error('Error deleting tournament:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Join tournament (Player) - after payment
async function joinTournament(req, res) {
    try {
        const { tournament_id, player_account_id, payment_id } = req.body;
        
        // Get tournament
        const { data: tournament, error: tError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournament_id)
            .single();
        
        if (tError || !tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }
        
        // Check if registration is open
        if (tournament.status !== 'registration_open') {
            return res.status(400).json({ success: false, message: 'Registration is closed for this tournament' });
        }
        
        // Check max players
        const { count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament_id);
        
        if (count >= tournament.max_players) {
            return res.status(400).json({ success: false, message: 'Tournament is full' });
        }
        
        // Get account details
        const { data: account } = await supabase
            .from('player_accounts')
            .select('*, player_id')
            .eq('id', player_account_id)
            .single();
        
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        
        let playerId = account.player_id;
        
        // If no player record exists, create one
        if (!playerId) {
            const { data: newPlayer, error: playerError } = await supabase
                .from('players')
                .insert({
                    name: account.name || account.username,
                    team: account.preferred_team || 'TBD',
                    photo: account.photo_url,
                    player_account_id: player_account_id
                })
                .select()
                .single();
            
            if (playerError) {
                console.error('Error creating player:', playerError);
            } else {
                playerId = newPlayer.id;
                
                // Update account with player_id
                await supabase
                    .from('player_accounts')
                    .update({ player_id: playerId })
                    .eq('id', player_account_id);
            }
        }
        
        // Check if already joined
        const { data: existing } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', tournament_id)
            .eq('player_account_id', player_account_id)
            .single();
        
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already registered for this tournament' });
        }
        
        // Add participant
        const { data, error } = await supabase
            .from('tournament_participants')
            .insert({
                tournament_id,
                player_account_id,
                player_id: playerId,
                payment_id,
                status: 'confirmed'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Update player account status to active
        await supabase
            .from('player_accounts')
            .update({ status: 'active' })
            .eq('id', player_account_id);
        
        // For league format, generate fixtures against all existing participants
        if (tournament.format === 'league' && playerId) {
            console.log(`Generating fixtures for new player ${playerId} in tournament ${tournament_id}`);
            
            // Get all existing participants (excluding the new one)
            const { data: existingParticipants } = await supabase
                .from('tournament_participants')
                .select('player_id')
                .eq('tournament_id', tournament_id)
                .neq('player_id', playerId);
            
            if (existingParticipants && existingParticipants.length > 0) {
                // Get current max match number
                const { data: lastFixture } = await supabase
                    .from('tournament_fixtures')
                    .select('match_number')
                    .eq('tournament_id', tournament_id)
                    .order('match_number', { ascending: false })
                    .limit(1)
                    .single();
                
                let matchNumber = (lastFixture?.match_number || 0) + 1;
                const today = new Date();
                
                // Create fixtures against all existing players
                const newFixtures = existingParticipants.map((p, i) => {
                    const fixtureDate = new Date(today);
                    fixtureDate.setDate(fixtureDate.getDate() + Math.floor(i / 2) + 1);
                    
                    return {
                        tournament_id,
                        round: 1,
                        match_number: matchNumber++,
                        home_player_id: playerId,
                        away_player_id: p.player_id,
                        scheduled_date: fixtureDate.toISOString().split('T')[0],
                        played: false
                    };
                });
                
                if (newFixtures.length > 0) {
                    const { error: fixError } = await supabase
                        .from('tournament_fixtures')
                        .insert(newFixtures);
                    
                    if (fixError) {
                        console.error('Error creating fixtures:', fixError);
                    } else {
                        console.log(`Created ${newFixtures.length} fixtures for new player`);
                    }
                }
            }
            
            // Add player to standings
            const { error: standError } = await supabase
                .from('tournament_standings')
                .insert({
                    tournament_id,
                    player_id: playerId,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goals_for: 0,
                    goals_against: 0,
                    goal_difference: 0,
                    points: 0
                });
            
            if (standError) {
                console.error('Error adding to standings:', standError);
            } else {
                console.log('Added player to standings');
            }
        }
        
        console.log(`✅ Player ${account.name} joined tournament ${tournament.name}`);
        
        res.json({ success: true, participant: data, message: 'Successfully joined tournament!' });
    } catch (err) {
        console.error('Error joining tournament:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Generate fixtures for tournament (Admin)
async function generateFixtures(req, res) {
    try {
        const { id } = req.params;
        
        // Get tournament
        const { data: tournament } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single();
        
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }
        
        // Get participants
        const { data: participants } = await supabase
            .from('tournament_participants')
            .select('player_id')
            .eq('tournament_id', id)
            .eq('status', 'confirmed');
        
        if (!participants || participants.length < tournament.min_players) {
            return res.status(400).json({ 
                success: false, 
                message: `Need at least ${tournament.min_players} players to generate fixtures` 
            });
        }
        
        const playerIds = participants.map(p => p.player_id).filter(Boolean);
        
        // Delete existing fixtures
        await supabase
            .from('tournament_fixtures')
            .delete()
            .eq('tournament_id', id);
        
        // Delete existing standings
        await supabase
            .from('tournament_standings')
            .delete()
            .eq('tournament_id', id);
        
        let fixtures = [];
        
        if (tournament.format === 'league') {
            fixtures = generateLeagueFixtures(id, playerIds, tournament.start_date);
        } else if (tournament.format === 'knockout') {
            fixtures = generateKnockoutFixtures(id, playerIds, tournament.start_date);
        }
        
        // Insert fixtures
        if (fixtures.length > 0) {
            const { error: fError } = await supabase
                .from('tournament_fixtures')
                .insert(fixtures);
            
            if (fError) throw fError;
        }
        
        // Initialize standings for league format
        if (tournament.format === 'league') {
            const standings = playerIds.map(playerId => ({
                tournament_id: id,
                player_id: playerId,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                goal_difference: 0,
                points: 0
            }));
            
            await supabase.from('tournament_standings').insert(standings);
        }
        
        // Update tournament status
        await supabase
            .from('tournaments')
            .update({ status: 'in_progress' })
            .eq('id', id);
        
        res.json({ success: true, fixtures_count: fixtures.length });
    } catch (err) {
        console.error('Error generating fixtures:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Generate round-robin fixtures
function generateLeagueFixtures(tournamentId, playerIds, startDate) {
    const fixtures = [];
    const n = playerIds.length;
    let matchNumber = 1;
    let currentDate = startDate ? new Date(startDate) : new Date();
    
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            fixtures.push({
                tournament_id: tournamentId,
                round: 1,
                match_number: matchNumber++,
                home_player_id: playerIds[i],
                away_player_id: playerIds[j],
                scheduled_date: currentDate.toISOString().split('T')[0],
                played: false
            });
            
            if (matchNumber % 2 === 0) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }
    
    return fixtures;
}

// Generate knockout fixtures
function generateKnockoutFixtures(tournamentId, playerIds, startDate) {
    const fixtures = [];
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    let currentDate = startDate ? new Date(startDate) : new Date();
    
    let matchNumber = 1;
    for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
            fixtures.push({
                tournament_id: tournamentId,
                round: 1,
                match_number: matchNumber++,
                home_player_id: shuffled[i],
                away_player_id: shuffled[i + 1],
                scheduled_date: currentDate.toISOString().split('T')[0],
                played: false
            });
        }
    }
    
    return fixtures;
}

// Record match result
async function recordResult(req, res) {
    try {
        const { fixture_id, home_score, away_score } = req.body;
        
        const { data: fixture } = await supabase
            .from('tournament_fixtures')
            .select('*')
            .eq('id', fixture_id)
            .single();
        
        if (!fixture) {
            return res.status(404).json({ success: false, message: 'Fixture not found' });
        }
        
        let winnerId = null;
        if (home_score > away_score) winnerId = fixture.home_player_id;
        else if (away_score > home_score) winnerId = fixture.away_player_id;
        
        const { error: fError } = await supabase
            .from('tournament_fixtures')
            .update({
                home_score,
                away_score,
                winner_id: winnerId,
                played: true,
                played_at: new Date().toISOString()
            })
            .eq('id', fixture_id);
        
        if (fError) throw fError;
        
        const { data: tournament } = await supabase
            .from('tournaments')
            .select('format')
            .eq('id', fixture.tournament_id)
            .single();
        
        if (tournament?.format === 'league') {
            await updateStandings(fixture.tournament_id, fixture.home_player_id, fixture.away_player_id, home_score, away_score);
        }
        
        res.json({ success: true, message: 'Result recorded' });
    } catch (err) {
        console.error('Error recording result:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Update standings after a match
async function updateStandings(tournamentId, homePlayerId, awayPlayerId, homeScore, awayScore) {
    const homeWin = homeScore > awayScore;
    const awayWin = awayScore > homeScore;
    const draw = homeScore === awayScore;
    
    const { data: homeStanding } = await supabase
        .from('tournament_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', homePlayerId)
        .single();
    
    if (homeStanding) {
        await supabase
            .from('tournament_standings')
            .update({
                played: homeStanding.played + 1,
                wins: homeStanding.wins + (homeWin ? 1 : 0),
                draws: homeStanding.draws + (draw ? 1 : 0),
                losses: homeStanding.losses + (awayWin ? 1 : 0),
                goals_for: homeStanding.goals_for + homeScore,
                goals_against: homeStanding.goals_against + awayScore,
                goal_difference: homeStanding.goal_difference + (homeScore - awayScore),
                points: homeStanding.points + (homeWin ? 3 : draw ? 1 : 0)
            })
            .eq('id', homeStanding.id);
    }
    
    const { data: awayStanding } = await supabase
        .from('tournament_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', awayPlayerId)
        .single();
    
    if (awayStanding) {
        await supabase
            .from('tournament_standings')
            .update({
                played: awayStanding.played + 1,
                wins: awayStanding.wins + (awayWin ? 1 : 0),
                draws: awayStanding.draws + (draw ? 1 : 0),
                losses: awayStanding.losses + (homeWin ? 1 : 0),
                goals_for: awayStanding.goals_for + awayScore,
                goals_against: awayStanding.goals_against + homeScore,
                goal_difference: awayStanding.goal_difference + (awayScore - homeScore),
                points: awayStanding.points + (awayWin ? 3 : draw ? 1 : 0)
            })
            .eq('id', awayStanding.id);
    }
}

// Initialize EFL 2025 Tournament with existing players and fixtures
async function initializeMainTournament(req, res) {
    try {
        const { data: existing } = await supabase
            .from('tournaments')
            .select('id')
            .eq('name', 'EFL 2025 Tournament')
            .single();
        
        if (existing) {
            return res.json({ 
                success: true, 
                message: 'EFL 2025 Tournament already exists',
                tournament_id: existing.id,
                already_exists: true
            });
        }
        
        // Get players from the players table
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*');
        
        console.log('Players found:', players?.length || 0, playersError ? `Error: ${playersError.message}` : '');
        
        if (!players || players.length === 0) {
            return res.status(400).json({ success: false, message: 'No players found in players table' });
        }
        
        // Get fixtures
        const { data: fixtures, error: fixturesError } = await supabase
            .from('fixtures')
            .select('*');
        
        console.log('Fixtures found:', fixtures?.length || 0, fixturesError ? `Error: ${fixturesError.message}` : '');
        
        // Get results
        const { data: results, error: resultsError } = await supabase
            .from('results')
            .select('*');
        
        console.log('Results found:', results?.length || 0, resultsError ? `Error: ${resultsError.message}` : '');
        
        // Create tournament
        const { data: tournament, error: tError } = await supabase
            .from('tournaments')
            .insert({
                name: 'EFL 2025 Tournament',
                description: 'The main eFootball League 2025 season tournament',
                entry_fee: 0,
                prize_pool: 0,
                max_players: 50,
                min_players: 2,
                format: 'league',
                status: 'in_progress',
                start_date: new Date().toISOString().split('T')[0],
                created_by: 'system'
            })
            .select()
            .single();
        
        if (tError) {
            console.error('Error creating tournament:', tError);
            throw tError;
        }
        
        const tournamentId = tournament.id;
        console.log('Tournament created with ID:', tournamentId);
        
        // Add participants
        const participants = players.map(p => ({
            tournament_id: tournamentId,
            player_id: p.id,
            player_account_id: p.player_account_id || null,
            status: 'confirmed',
            joined_at: new Date().toISOString()
        }));
        
        const { error: partError } = await supabase.from('tournament_participants').insert(participants);
        if (partError) {
            console.error('Error adding participants:', partError);
        } else {
            console.log('Added', participants.length, 'participants');
        }
        
        // Add fixtures
        if (fixtures && fixtures.length > 0) {
            const tournamentFixtures = fixtures.map((f, i) => ({
                tournament_id: tournamentId,
                round: 1,
                match_number: i + 1,
                home_player_id: f.home_player_id,
                away_player_id: f.away_player_id,
                scheduled_date: f.date,
                scheduled_time: f.time,
                played: f.played || false
            }));
            
            const { error: fixError } = await supabase.from('tournament_fixtures').insert(tournamentFixtures);
            if (fixError) {
                console.error('Error adding fixtures:', fixError);
            } else {
                console.log('Added', tournamentFixtures.length, 'fixtures');
            }
        }
        
        // Add standings
        const standings = players.map(p => {
            const playerResults = (results || []).filter(r => 
                r.home_player_id === p.id || r.away_player_id === p.id
            );
            
            let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
            
            playerResults.forEach(r => {
                const isHome = r.home_player_id === p.id;
                const pScore = isHome ? r.home_score : r.away_score;
                const oScore = isHome ? r.away_score : r.home_score;
                
                played++;
                gf += pScore || 0;
                ga += oScore || 0;
                
                if (pScore > oScore) wins++;
                else if (pScore === oScore) draws++;
                else losses++;
            });
            
            return {
                tournament_id: tournamentId,
                player_id: p.id,
                played,
                wins,
                draws,
                losses,
                goals_for: gf,
                goals_against: ga,
                goal_difference: gf - ga,
                points: (wins * 3) + draws
            };
        });
        
        const { error: standError } = await supabase.from('tournament_standings').insert(standings);
        if (standError) {
            console.error('Error adding standings:', standError);
        } else {
            console.log('Added', standings.length, 'standings');
        }
        
        // Update fixtures with results
        if (results && results.length > 0) {
            for (const r of results) {
                const winnerId = r.home_score > r.away_score ? r.home_player_id :
                                 r.away_score > r.home_score ? r.away_player_id : null;
                
                await supabase
                    .from('tournament_fixtures')
                    .update({
                        home_score: r.home_score,
                        away_score: r.away_score,
                        winner_id: winnerId,
                        played: true,
                        played_at: r.date
                    })
                    .eq('tournament_id', tournamentId)
                    .eq('home_player_id', r.home_player_id)
                    .eq('away_player_id', r.away_player_id);
            }
            console.log('Updated', results.length, 'results');
        }
        
        res.json({ 
            success: true, 
            message: 'EFL 2025 Tournament initialized successfully!',
            tournament_id: tournamentId,
            players_added: players.length,
            fixtures_added: fixtures?.length || 0,
            results_synced: results?.length || 0
        });
        
    } catch (err) {
        console.error('Error initializing main tournament:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

export default {
    initTournaments,
    getTournaments,
    getTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    joinTournament,
    generateFixtures,
    recordResult,
    initializeMainTournament
};
