/**
 * Jest global setup: syncs the in-memory test database before all tests run.
 * The NODE_ENV=test environment variable causes config/db.js to use :memory: storage.
 */
const sequelize = require('../config/db');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
