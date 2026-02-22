const app = require('./app');
const sequelize = require('./config/db');

sequelize.sync({ force: true }).then(() => {
  console.log('Database synced');

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
