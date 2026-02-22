function handleRouteError(err, res) {
  console.error('Database operation failed:', err);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { handleRouteError };
