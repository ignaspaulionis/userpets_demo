const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const sequelize = require('./config/db');

const petsRouter = require('./routes/pets');
const userRouter = require('./routes/user');
const tagsRouter = require('./routes/tags');

const User = require('./models/user');
const { Pet } = require('./models/pet');
const { Tag } = require('./models/tag');

Pet.belongsToMany(Tag, {
  through: 'PetTags',
  foreignKey: 'petId',
  otherKey: 'tagId',
  onDelete: 'CASCADE',
});
Tag.belongsToMany(Pet, {
  through: 'PetTags',
  foreignKey: 'tagId',
  otherKey: 'petId',
  onDelete: 'CASCADE',
});

function createApp() {
  const app = express();
  app.use(express.json());

  app.use(express.static(path.join(__dirname, 'public')));

  const swaggerSpec = swaggerJsdoc({
    definition: require('./swagger/swagger.json'),
    apis: ['./routes/pets.js'],
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/pets', petsRouter);
  app.use('/api/pets', petsRouter);
  app.use('/users', userRouter);
  app.use('/tags', tagsRouter);

  return app;
}

async function startServer() {
  await sequelize.sync({ force: process.env.NODE_ENV === 'test' });
  const app = createApp();
  const port = process.env.PORT || 3000;
  return app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { createApp, startServer, sequelize, User, Pet, Tag };
