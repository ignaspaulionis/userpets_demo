const sequelize = require('./config/db');
const app = require('./app');

// Initialize database and sync models
sequelize.sync({ force: true })  // Cleans the DB on every load
  .then(() => console.log('Database synced'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
