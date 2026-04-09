// Application constants

export const ROLES = {
  PLAYER: 'player',
  ADMIN: 'admin'
};

export const TOURNAMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const NOTIFICATION_TYPES = {
  PAYMENT: 'payment',
  TOURNAMENT: 'tournament',
  SYSTEM: 'system',
  MATCH: 'match'
};

export const FIXTURE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  },
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 20
  },
  PAYMENT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10
  }
};
