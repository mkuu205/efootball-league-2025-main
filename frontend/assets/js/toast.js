// Toast notification system
const toast = {
  show: (message, type = 'info', duration = 3000) => {
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toastEl);
    
    setTimeout(() => {
      toastEl.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  },

  success: (message) => toast.show(message, 'success'),
  error: (message) => toast.show(message, 'error'),
  info: (message) => toast.show(message, 'info')
};
