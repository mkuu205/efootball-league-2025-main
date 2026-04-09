// Authentication helpers
const auth = {
  login: async (identifier, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        identifier,
        password
      });

      api.setToken(response.data.token);
      api.setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (username, email, password, team) => {
    try {
      const response = await api.post('/api/auth/register', {
        username,
        email,
        password,
        team
      });

      api.setToken(response.data.token);
      api.setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    api.setToken(null);
    api.setUser(null);
    window.location.href = '/login.html';
  },

  isAuthenticated: () => {
    return api.getToken() !== null;
  },

  isAdmin: () => {
    const user = api.getUser();
    return user && user.role === 'admin';
  },

  requireAuth: () => {
    if (!auth.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireAdmin: () => {
    if (!auth.isAuthenticated() || !auth.isAdmin()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }
};
