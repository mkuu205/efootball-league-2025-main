// Helper utility functions

export const formatCurrency = (amount, currency = 'KES') => {
  return `${currency} ${parseFloat(amount).toFixed(2)}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

export const generateTransactionCode = () => {
  const prefix = 'EFL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const calculateGoalDifference = (goalsFor, goalsAgainst) => {
  return parseInt(goalsFor) - parseInt(goalsAgainst);
};

export const calculatePoints = (wins, draws) => {
  return (parseInt(wins) * 3) + parseInt(draws);
};
