const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const sequelize = require('./config/db');

const petsRouter = require('./routes/pets');
const userRouter = require('./routes/user');
const tagsRouter = require('./routes/tags');

require('./models/user');
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

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const swaggerSpec = swaggerJsdoc({
  definition: require('./swagger/swagger.json'),
  apis: ['./routes/pets.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/pets', petsRouter);
app.use('/users', userRouter);
app.use('/tags', tagsRouter);

async function initDatabase() {
  const force = process.env.NODE_ENV === 'test';
  await sequelize.sync({ force });
}

if (require.main === module) {
  initDatabase().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}

module.exports = { app, initDatabase, sequelize };
