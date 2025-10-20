// ✅ Health check route — confirms backend is running
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'eFootball League 2025 API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});
