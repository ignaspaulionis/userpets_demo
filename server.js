const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const sequelize = require('./config/db');
const apiRateLimit = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');

const petsRouter = require('./routes/pets');
const userRouter = require('./routes/user');
const tagsRouter = require('./routes/tags');

const { Pet } = require('./models/pet');
const { Tag } = require('./models/tag');

const useForceSync = process.env.FORCE_DB_SYNC === 'true' && process.env.NODE_ENV !== 'production';

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

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(apiRateLimit);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const swaggerSpec = swaggerJsdoc({
  definition: require('./swagger/swagger.json'),
  apis: ['./routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/pets', petsRouter);
app.use('/users', userRouter);
app.use('/tags', tagsRouter);
app.use(errorHandler);

sequelize.sync({ force: useForceSync })
  .then(() => console.log(`Database synced${useForceSync ? ' with force=true' : ''}`))
  .catch((error) => {
    console.error('Database sync failed');
    console.error(error);
    process.exit(1);
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
