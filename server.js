const app = require('./app');
const sequelize = require('./config/db');

const isTest = process.env.NODE_ENV === 'test';

sequelize.sync({ force: !isTest }).then(() => {
  console.log('Database synced');

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
