const sequelize = require('./config/db');
const app = require('./app');

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await sequelize.sync();
      console.log('Database synced');
    }

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
