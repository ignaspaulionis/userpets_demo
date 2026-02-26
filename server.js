const sequelize = require('./config/db');
const app = require('./app');

// Initialize database and sync models
const force = process.env.NODE_ENV === 'test';
sequelize.sync({ force })
  .then(() => console.log(`Database synced (force=${force})`));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
