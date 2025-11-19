// Database and Data Management System with Supabase
console.log('🚀 database.js STARTED loading...');

// Database table keys
export const DB_KEYS = {
    PLAYERS: 'players',
    FIXTURES: 'fixtures',
    RESULTS: 'results',
    ADMIN_CONFIG: 'admin_config',
    PASSWORD_RESET_TOKENS: 'password_reset_tokens'
};

// Default balanced teams configuration
export const BALANCED_TEAMS = [
    { name: 'Kenya', strength: 85, color: '#000000' },
    { name: 'Chelsea', strength: 88, color: '#034694' },
    { name: 'Liverpool', strength: 87, color: '#c8102e' },
    { name: 'Everton', strength: 78, color: '#003399' },
    { name: 'Manchester United', strength: 85, color: '#da291c' },
    { name: 'West Ham', strength: 79, color: '#7c2c3b' },
    { name: 'Arsenal', strength: 86, color: '#ef0107' },
    { name: 'Manchester City', strength: 89, color: '#6caddf' },
    { name: 'Tottenham', strength: 84, color: '#132257' },
    { name: 'Newcastle', strength: 82, color: '#241f20' }
];

// Default players data
export const DEFAULT_PLAYERS = [
    { 
        id: 1, 
        name: 'alwaysresistance', 
        team: 'Kenya', 
        photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg', 
        strength: 3138, 
        team_color: '#000000', 
        default_photo: 'https://i.ibb.co/0jmt3HXf/alwaysresistance.jpg'
    },
    { 
        id: 2, 
        name: 'lildrip035', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg',
        strength: 3100, 
        team_color: '#034694', 
        default_photo: 'https://i.ibb.co/CcXdyfc/lildrip035.jpg'
    },
    { 
        id: 3, 
        name: 'Sergent white', 
        team: 'Chelsea', 
        photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg', 
        strength: 3042, 
        team_color: '#034694', 
        default_photo: 'https://i.ibb.co/TD6HHksv/sergent-white.jpg'
    },
    { 
        id: 4, 
        name: 'skangaKe254', 
        team: 'Liverpool', 
        photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg', 
        strength: 2700, 
        team_color: '#c8102e', 
        default_photo: 'https://i.ibb.co/Wv5nbZRy/skanga-Ke254.jpg'
    },
    { 
        id: 5, 
        name: 'Drexas', 
        team: 'Everton', 
        photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg', 
        strength: 2792, 
        team_color: '#003399', 
        default_photo: 'https://i.ibb.co/2mzRJVn/drexas.jpg'
    },
    { 
        id: 6, 
        name: 'Collo leevan', 
        team: 'Manchester United', 
        photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg', 
        strength: 2448, 
        team_color: '#da291c', 
        default_photo: 'https://i.ibb.co/nqyFvzvf/collo-leevan.jpg'
    },
    { 
        id: 7, 
        name: 'captainkenn', 
        team: 'West Ham', 
        photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg', 
        strength: 3110, 
        team_color: '#7c2c3b', 
        default_photo: 'https://i.ibb.co/35kMmxjW/captainkenn.jpg'
    },
    { 
        id: 8,
        name: 'Bora kesho',
        team: 'Manchester United',
        photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg',
        strength: 3177,
        team_color: '#DA291C',
        default_photo: 'https://i.ibb.co/7NXyjhWR/Bora-20kesho.jpg'
    }
];

// Default admin configuration
export const DEFAULT_ADMIN_CONFIG = {
    id: 1,
    tournament_name: 'Premier League Tournament',
    season: '2025',
    max_players_per_team: 2,
    points_for_win: 3,
    points_for_draw: 1,
    allow_player_registration: true,
    show_leaderboard: true,
    maintenance_mode: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

// Supabase Client Initialization
console.log('🔧 Initializing Supabase client...');

const SUPABASE_URL = 'https://zliedzrqzvywlsyfggcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaWVkenJxenZ5d2xzeWZnZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTE4NjYsImV4cCI6MjA3NjY2Nzg2Nn0.NbzEZ4ievehtrlyOxCK_mheb7YU4SnNgC0uXuOKPNOI';

// Export supabase as a variable that gets initialized
export let supabase = null;
let supabaseInitialized = false;
let databaseInitialized = false; // Add flag to prevent repeated initialization
const supabaseInitPromise = initializeSupabase();

async function initializeSupabase() {
    console.log('🔧 Initializing Supabase client...');
    
    try {
        // First try to use global supabase if available
        if (typeof window !== 'undefined' && window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully using window.supabase');
            supabaseInitialized = true;
            return;
        }

        // Try to load from CDN
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully via CDN');
        supabaseInitialized = true;
    } catch (error) {
        console.error('❌ Supabase client initialization failed:', error);
        supabase = null;
        supabaseInitialized = false;
    }
}

// Wait for Supabase to be initialized before executing database operations
async function ensureSupabaseInitialized() {
    if (!supabaseInitialized) {
        await supabaseInitPromise;
    }
    return supabase !== null;
}

// Core Database Functions

// Get data from Supabase
export async function getData(tableName) {
    // Validate tableName - FIXED: Better validation
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.warn('⚠️ getData called with invalid tableName:', tableName);
        console.trace('Stack trace for invalid tableName call');
        return [];
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for getData');
        return [];
    }
    
    try {
        console.log(`📋 Fetching data from table: ${tableName}`);
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            console.error(`Error getting ${tableName}:`, error);
            return [];
        }
        console.log(`✅ Retrieved ${data?.length || 0} records from ${tableName}`);
        return data || [];
    } catch (err) {
        console.error(`Error in getData for ${tableName}:`, err);
        return [];
    }
}

// Save data to Supabase
export async function saveData(tableName, data) {
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.error('Invalid table name:', tableName);
        return [];
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for saveData');
        return [];
    }
    
    try {
        console.log(`💾 Saving data to table: ${tableName}`, data);
        
        if (Array.isArray(data) && data.length > 0) {
            const { data: result, error } = await supabase.from(tableName).insert(data).select();
            if (error) throw error;
            console.log(`✅ Inserted ${result?.length || 0} records into ${tableName}`);
            return result;
        } else {
            const { data: result, error } = await supabase.from(tableName).upsert(data).select();
            if (error) throw error;
            console.log(`✅ Upserted record into ${tableName}`);
            return result;
        }
    } catch (error) {
        console.error(`Error saving to ${tableName}:`, error);
        throw error;
    }
}

// Update data in Supabase
export async function updateData(tableName, updates, id) {
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.error('Invalid table name:', tableName);
        return null;
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for updateData');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from(tableName)
            .update(updates)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
    }
}

// Delete data from Supabase
export async function deleteData(tableName, id) {
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.error('Invalid table name:', tableName);
        return false;
    }
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Supabase not available for deleteData');
        return false;
    }
    
    try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        throw error;
    }
}

// Initialize database with default data
export async function initializeDatabase() {
    // Prevent repeated initialization
    if (databaseInitialized) {
        console.log('⚙️ Database already initialized, skipping...');
        return;
    }
    
    console.log('⚙️ Initializing Supabase database...');
    
    if (!await ensureSupabaseInitialized()) {
        console.error('Cannot initialize database: Supabase not available');
        return;
    }

    try {
        // Connection test removed - directly proceed with initialization

        // Initialize players with better error handling
        let existingPlayers = [];
        try {
            existingPlayers = await getData(DB_KEYS.PLAYERS);
        } catch (err) {
            console.warn('Could not fetch players, table might not exist yet:', err.message);
        }
        
        if (!existingPlayers || existingPlayers.length === 0) {
            console.log('Setting up default players in Supabase...');
            try {
                const insertedPlayers = await saveData(DB_KEYS.PLAYERS, DEFAULT_PLAYERS);
                console.log(`✅ Default players inserted: ${insertedPlayers ? insertedPlayers.length : 0}`);
            } catch (err) {
                console.error('Failed to insert default players:', err);
            }
        } else {
            console.log(`✅ Players already initialized with ${existingPlayers.length} players`);
        }

        // Initialize admin config
        let existingConfig = [];
        try {
            existingConfig = await getData(DB_KEYS.ADMIN_CONFIG);
        } catch (err) {
            console.warn('Could not fetch admin config:', err.message);
        }
        
        if (!existingConfig || existingConfig.length === 0) {
            console.log('Setting up default admin configuration...');
            try {
                await saveData(DB_KEYS.ADMIN_CONFIG, [DEFAULT_ADMIN_CONFIG]);
                console.log('✅ Default admin configuration inserted');
            } catch (err) {
                console.error('Failed to insert admin config:', err);
            }
        } else {
            console.log('✅ Admin configuration already exists');
        }

        // Generate fixtures if none exist
        let existingFixtures = [];
        try {
            existingFixtures = await getData(DB_KEYS.FIXTURES);
        } catch (err) {
            console.warn('Could not fetch fixtures:', err.message);
        }
        
        if (!existingFixtures || existingFixtures.length === 0) {
            try {
                await generateSampleFixtures();
            } catch (err) {
                console.error('Failed to generate fixtures:', err);
            }
        }

        // Mark database as initialized
        databaseInitialized = true;
        console.log('✅ Database initialization completed');

    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// Admin Configuration Management
export async function getAdminConfig() {
    try {
        const config = await getData(DB_KEYS.ADMIN_CONFIG);
        return config && config.length > 0 ? config[0] : DEFAULT_ADMIN_CONFIG;
    } catch (error) {
        console.error('Error getting admin config:', error);
        return DEFAULT_ADMIN_CONFIG;
    }
}

export async function updateAdminConfig(updates) {
    if (!await ensureSupabaseInitialized()) return null;
    try {
        const currentConfig = await getAdminConfig();
        const updatedConfig = {
            ...currentConfig,
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from(DB_KEYS.ADMIN_CONFIG)
            .upsert(updatedConfig)
            .select();
            
        if (error) throw error;
        
        await refreshAllDisplays();
        return data[0];
    } catch (err) {
        console.error('Error updating admin config:', err);
        throw err;
    }
}

// Player Management
export async function addPlayer(playerData) {
    const players = await getData(DB_KEYS.PLAYERS);
    const isDuplicate = players.some(p => 
        p.name.toLowerCase() === playerData.name.toLowerCase() && 
        p.team.toLowerCase() === playerData.team.toLowerCase()
    );
    
    if (isDuplicate) {
        throw new Error(`Player "${playerData.name}" already exists in team ${playerData.team}`);
    }

    const maxId = players.length > 0 ? Math.max(...players.map(p => p.id || 0)) : 0;
    const newPlayer = {
        ...playerData,
        id: maxId + 1,
        photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
        default_photo: playerData.photo || `https://via.placeholder.com/100/1a1a2e/ffffff?text=${playerData.name.charAt(0)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const inserted = await saveData(DB_KEYS.PLAYERS, [newPlayer]);
    console.log('Player added:', newPlayer.name);
    await refreshAllDisplays();
    return inserted[0];
}

export async function updatePlayer(player) {
    if (!await ensureSupabaseInitialized()) return null;
    try {
        const { data, error } = await supabase
            .from(DB_KEYS.PLAYERS)
            .update({ 
                ...player, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', player.id)
            .select();
            
        if (error) throw error;
        await refreshAllDisplays();
        return data[0];
    } catch (err) {
        console.error('Error updating player:', err);
        throw err;
    }
}

export async function deletePlayer(playerId) {
    if (!await ensureSupabaseInitialized()) return false;
    try {
        // Delete related results first
        await supabase.from(DB_KEYS.RESULTS).delete().or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
        
        // Delete related fixtures
        await supabase.from(DB_KEYS.FIXTURES)
            .delete()
            .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`);
            
        // Delete player
        const { error } = await supabase.from(DB_KEYS.PLAYERS).delete().eq('id', playerId);
        
        if (error) throw error;
        
        await refreshAllDisplays();
        return true;
    } catch (err) {
        console.error('Error deleting player:', err);
        throw err;
    }
}

// Fixture Management
async function generateSampleFixtures() {
    const players = await getData(DB_KEYS.PLAYERS);
    if (!players || players.length < 2) return;

    const fixtures = [];
    let fixtureId = 1;
    const startDate = new Date();
    const matchPairs = [];

    // Generate all possible match pairs
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            matchPairs.push([players[i], players[j]]);
        }
    }

    // Create fixtures for each pair
    matchPairs.forEach(([p1, p2], idx) => {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + idx * 2);

        fixtures.push({
            id: fixtureId++,
            home_player_id: p1.id,
            away_player_id: p2.id,
            date: matchDate.toISOString().split('T')[0],
            time: '15:00',
            venue: 'Virtual Stadium ' + String.fromCharCode(65 + (idx % 3)),
            played: false,
            is_home_leg: true,
            status: 'scheduled',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    });

    try {
        await saveData(DB_KEYS.FIXTURES, fixtures);
        console.log('✅ Generated', fixtures.length, 'fixtures');
    } catch (error) {
        console.error('Error generating fixtures:', error);
        // If status column doesn't exist, try without it
        const fixturesWithoutStatus = fixtures.map(({ status, ...fixture }) => fixture);
        await saveData(DB_KEYS.FIXTURES, fixturesWithoutStatus);
        console.log('✅ Generated', fixtures.length, 'fixtures (without status)');
    }
}

export async function addFixture(fixture) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const maxId = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.id || 0)) : 0;
    
    const newFixture = {
        ...fixture,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    return await saveData(DB_KEYS.FIXTURES, [newFixture]);
}

export async function updateFixture(fixture) {
    if (!await ensureSupabaseInitialized()) return null;
    const { data, error } = await supabase
        .from(DB_KEYS.FIXTURES)
        .update({ 
            ...fixture, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', fixture.id)
        .select();
        
    if (error) throw error;
    await refreshAllDisplays();
    return data[0];
}

export async function deleteFixture(fixtureId) {
    if (!await ensureSupabaseInitialized()) return false;
    const { error } = await supabase.from(DB_KEYS.FIXTURES).delete().eq('id', fixtureId);
    if (error) throw error;
    await refreshAllDisplays();
    return true;
}

// Result Management
export async function addResult(result) {
    const results = await getData(DB_KEYS.RESULTS);
    const maxId = results.length > 0 ? Math.max(...results.map(r => r.id || 0)) : 0;
    
    const newResult = {
        ...result,
        id: maxId + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const inserted = await saveData(DB_KEYS.RESULTS, [newResult]);
    
    // Mark corresponding fixture as played
    const fixtures = await getData(DB_KEYS.FIXTURES);
    const fixture = fixtures.find(f => 
        f.home_player_id === result.home_player_id && 
        f.away_player_id === result.away_player_id
    );
    
    if (fixture) {
        await updateFixture({ 
            ...fixture, 
            played: true,
            status: 'completed'
        });
    }
    
    await refreshAllDisplays();
    return inserted[0];
}

export async function updateResult(result) {
    if (!await ensureSupabaseInitialized()) return null;
    const { data, error } = await supabase
        .from(DB_KEYS.RESULTS)
        .update({ 
            ...result, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', result.id)
        .select();
        
    if (error) throw error;
    await refreshAllDisplays();
    return data[0];
}

export async function deleteResult(resultId) {
    if (!await ensureSupabaseInitialized()) return false;
    const { error } = await supabase.from(DB_KEYS.RESULTS).delete().eq('id', resultId);
    if (error) throw error;
    await refreshAllDisplays();
    return true;
}

// Helper Functions
export async function getPlayerById(playerId) {
    const players = await getData(DB_KEYS.PLAYERS);
    return players.find(p => p.id === playerId);
}

export async function getFixtureById(fixtureId) {
    const fixtures = await getData(DB_KEYS.FIXTURES);
    return fixtures.find(f => f.id === fixtureId);
}

export async function getResultById(resultId) {
    const results = await getData(DB_KEYS.RESULTS);
    return results.find(r => r.id === resultId);
}

export function getDefaultStats() {
    return { 
        played: 0, 
        wins: 0, 
        draws: 0, 
        losses: 0, 
        goalsFor: 0, 
        goalsAgainst: 0, 
        goalDifference: 0, 
        points: 0 
    };
}

// Statistics & League Table
export async function calculatePlayerStats(playerId) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        
        if (!Array.isArray(results)) {
            console.error('Results data is not an array:', results);
            return getDefaultStats();
        }

        const playerResults = results.filter(r => 
            r && (r.home_player_id === playerId || r.away_player_id === playerId)
        );

        let stats = getDefaultStats();
        
        playerResults.forEach(result => {
            if (!result) return;
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            stats.played++;
            stats.goalsFor += playerScore;
            stats.goalsAgainst += opponentScore;

            if (playerScore > opponentScore) {
                stats.wins++;
                stats.points += 3;
            } else if (playerScore === opponentScore) {
                stats.draws++;
                stats.points += 1;
            } else {
                stats.losses++;
            }
        });

        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        return stats;
    } catch (error) {
        console.error('Error calculating player stats:', error);
        return getDefaultStats();
    }
}

export async function getRecentForm(playerId, matches = 5) {
    try {
        const results = await getData(DB_KEYS.RESULTS);
        
        if (!Array.isArray(results)) {
            console.error('Results data is not an array in getRecentForm:', results);
            return [];
        }

        const playerResults = results
            .filter(r => r && (r.home_player_id === playerId || r.away_player_id === playerId))
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, matches);

        return playerResults.map(result => {
            if (!result) return 'N';
            
            const isHome = result.home_player_id === playerId;
            const playerScore = isHome ? (result.home_score || 0) : (result.away_score || 0);
            const opponentScore = isHome ? (result.away_score || 0) : (result.home_score || 0);

            if (playerScore > opponentScore) return 'W';
            if (playerScore === opponentScore) return 'D';
            return 'L';
        }).reverse();
    } catch (error) {
        console.error('Error getting recent form:', error);
        return [];
    }
}

export async function getLeagueTable() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        
        if (!Array.isArray(players)) {
            console.error('Players data is not an array:', players);
            return [];
        }

        if (players.length === 0) {
            console.log('No players found for league table');
            return [];
        }

        const tableData = await Promise.all(players.map(async p => {
            const stats = await calculatePlayerStats(p.id);
            const form = await getRecentForm(p.id);
            return { ...p, ...stats, form };
        })); // ✅ FIXED — added missing )

        return tableData.sort((a, b) => 
            b.points - a.points || 
            b.goalDifference - a.goalDifference || 
            b.goalsFor - a.goalsFor
        );
    } catch (error) {
        console.error('Error generating league table:', error);
        return [];
    }
}


// Refresh UI & Subscriptions
export async function refreshAllDisplays() {
    try {
        console.log('Refreshing all displays...');
        
        // Refresh admin displays if on admin page
        if (window.location.pathname.includes('admin.html')) {
            if (typeof window.renderAdminPlayers === 'function') {
                await window.renderAdminPlayers();
            }
            if (typeof window.renderAdminFixtures === 'function') {
                await window.renderAdminFixtures();
            }
            if (typeof window.renderAdminResults === 'function') {
                await window.renderAdminResults();
            }
            if (typeof window.populatePlayerSelects === 'function') {
                await window.populatePlayerSelects();
            }
            if (typeof window.updateAdminStatistics === 'function') {
                await window.updateAdminStatistics();
            }
        } else {
            // Refresh main site displays
            if (typeof window.renderHomePage === 'function') {
                await window.renderHomePage();
            }
            if (typeof window.renderFixtures === 'function') {
                await window.renderFixtures();
            }
            if (typeof window.renderResults === 'function') {
                await window.renderResults();
            }
            if (typeof window.renderLeagueTable === 'function') {
                await window.renderLeagueTable();
            }
            if (typeof window.renderPlayers === 'function') {
                await window.renderPlayers();
            }
        }
        
        showNotification('Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing displays:', error);
        showNotification('Error refreshing data', 'error');
    }
}

// Subscribe to database changes
export function subscribeToChanges(callback) {
    if (!supabase) return null;
    
    try {
        return supabase.channel('schema-db-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public' }, 
                payload => {
                    console.log('DB change detected', payload);
                    if (callback) callback(payload);
                    refreshAllDisplays();
                }
            ).subscribe();
    } catch (error) {
        console.error('Error setting up database subscription:', error);
        return null;
    }
}

// Data Management Functions
export async function exportTournamentData() {
    try {
        const players = await getData(DB_KEYS.PLAYERS);
        const fixtures = await getData(DB_KEYS.FIXTURES);
        const results = await getData(DB_KEYS.RESULTS);
        
        const data = {
            players,
            fixtures,
            results,
            exportDate: new Date().toISOString(),
            tournament: 'eFootball League 2025',
            version: '3.0',
            database: 'Supabase'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `efootball_tournament_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Tournament data exported successfully!', 'success');
        return data;
    } catch (error) {
        console.error('Error exporting tournament data:', error);
        showNotification('Error exporting data: ' + error.message, 'error');
        throw error;
    }
}

export async function importTournamentData(data) {
    try {
        if (!data.players || !data.fixtures || !data.results) {
            throw new Error('Invalid tournament data format');
        }
        
        showNotification('Importing data to Supabase...', 'info');
        
        // Clear existing data
        await supabase.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        await supabase.from(DB_KEYS.FIXTURES).delete().neq('id', 0);
        await supabase.from(DB_KEYS.PLAYERS).delete().neq('id', 0);
        
        // Import new data
        if (data.players && data.players.length > 0) {
            await saveData(DB_KEYS.PLAYERS, data.players);
        }
        if (data.fixtures && data.fixtures.length > 0) {
            await saveData(DB_KEYS.FIXTURES, data.fixtures);
        }
        if (data.results && data.results.length > 0) {
            await saveData(DB_KEYS.RESULTS, data.results);
        }
        
        await refreshAllDisplays();
        showNotification('Tournament data imported successfully to Supabase!', 'success');
        return true;
    } catch (error) {
        console.error('Error importing tournament data:', error);
        showNotification('Error importing data: ' + error.message, 'error');
        throw error;
    }
}

export async function resetAllResults() {
    if (!confirm('Are you sure you want to clear all match results? This cannot be undone.')) {
        return false;
    }
    
    try {
        // Delete all results
        await supabase.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        
        // Reset all fixtures to not played
        const fixtures = await getData(DB_KEYS.FIXTURES);
        for (const fixture of fixtures) {
            await updateFixture({
                ...fixture,
                played: false,
                status: 'scheduled'
            });
        }
        
        await refreshAllDisplays();
        showNotification('All results cleared successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting results:', error);
        showNotification('Error resetting results', 'error');
        return false;
    }
}

export async function resetTournament() {
    if (!confirm('Are you sure you want to reset the entire tournament? This will delete ALL data including players, fixtures, and results. This cannot be undone.')) {
        return false;
    }
    
    try {
        // Delete all data
        await supabase.from(DB_KEYS.RESULTS).delete().neq('id', 0);
        await supabase.from(DB_KEYS.FIXTURES).delete().neq('id', 0);
        await supabase.from(DB_KEYS.PLAYERS).delete().neq('id', 0);
        
        // Reinitialize with default data
        databaseInitialized = false; // Reset flag
        await initializeDatabase();
        
        await refreshAllDisplays();
        showNotification('Tournament reset successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting tournament:', error);
        showNotification('Error resetting tournament', 'error');
        return false;
    }
}

// Utilities
export function formatDisplayDate(dateString) {
    if (!dateString) return 'TBD';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

export function showNotification(message, type = 'info') {
    if (typeof document === 'undefined') return;
    
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    const notification = document.createElement('div');
    notification.className = `custom-notification alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 1060; 
        min-width: 300px; 
        max-width: 400px;
        background: ${type === 'success' ? '#198754' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#0dcaf0'};
        color: white;
        border: none;
    `;
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => { 
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Data Sync System
export class DataSync {
    constructor() {
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
    }

    async manualSync() {
        showNotification('🔄 Refreshing data from Supabase...', 'info');
        
        try {
            await refreshAllDisplays();
            this.lastUpdate = new Date().toISOString();
            localStorage.setItem('efl_last_sync', this.lastUpdate);
            showNotification('✅ Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            showNotification('❌ Sync failed. Please try again.', 'error');
        }
    }
}

// Create global data sync instance
export const dataSync = new DataSync();

// Make functions globally available for onclick events
window.refreshAllDisplays = refreshAllDisplays;
window.exportTournamentData = exportTournamentData;
window.resetAllResults = resetAllResults;
window.resetTournament = resetTournament;
window.dataSync = dataSync;

// Initialize Database on DOM Loaded - FIXED: Only run once
if (typeof document !== 'undefined') {
    let domInitialized = false;
    
    document.addEventListener('DOMContentLoaded', async function() {
        if (domInitialized) {
            console.log('📦 DOM already initialized, skipping...');
            return;
        }
        
        console.log('📦 DOM loaded, initializing database...');
        domInitialized = true;
        
        // Wait for Supabase to initialize
        try {
            await ensureSupabaseInitialized();
            
            if (!supabase) {
                console.error('❌ Supabase not available, skipping database initialization');
                showNotification('❌ Database connection failed. Please refresh the page.', 'error');
                return;
            }
            
            await initializeDatabase();
            
            // Set up change subscriptions
            try {
                subscribeToChanges(payload => console.log('DB change detected', payload));
            } catch (err) {
                console.warn('Could not set up change subscriptions:', err.message);
            }
            
            console.log('✅ Supabase database system initialized');
            
            // Update sync status display
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.innerHTML = '<i class="fas fa-cloud me-1"></i>Supabase Online';
                syncStatus.className = 'badge bg-success';
            }
            
        } catch (error) {
            console.error('Database initialization error:', error);
            showNotification('❌ Database initialization failed: ' + error.message, 'error');
        }
    });
}

console.log('✅ database.js COMPLETED loading - all functions available');

// =======================================================
//  COMPATIBILITY PATCH FOR advanced-stats.js + admin.html
// =======================================================

// Database core functions
window.getData = getData;
window.saveData = saveData;
window.updateData = updateData;
window.deleteData = deleteData;

// Lookup helpers
window.getPlayerById = getPlayerById;
window.getFixtureById = getFixtureById;
window.getResultById = getResultById;

// League & stats
window.calculatePlayerStats = calculatePlayerStats;
window.getRecentForm = getRecentForm;
window.getLeagueTable = getLeagueTable;

// Global config
window.DB_KEYS = DB_KEYS;

// Refresh system
window.refreshAllDisplays = refreshAllDisplays;

// Data sync
window.dataSync = dataSync;

// Fix for advanced-stats.js expecting populatePlayerSelects - FIXED SYNTAX
if (window.advancedStats && typeof window.advancedStats.populatePlayerSelects === 'function') {
    window.populatePlayerSelects = window.advancedStats.populatePlayerSelects.bind(window.advancedStats);
} else {
    window.populatePlayerSelects = function() {
        console.warn('populatePlayerSelects not available - advancedStats not loaded');
    };
}

// Debug helper to track undefined table calls
export async function debugGetDataCaller() {
    console.trace('Debug: getData called with undefined tableName');
}

// Temporary patch - wrap getData for debugging - FIXED: Better validation
const originalGetData = getData;
window.getData = async function(tableName) {
    // Better validation for tableName
    if (!tableName || tableName === 'undefined' || typeof tableName !== 'string') {
        console.warn('⚠️ getData called with invalid tableName:', tableName);
        console.trace('Stack trace for invalid tableName call');
        return [];
    }
    return await originalGetData(tableName);
};
