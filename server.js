const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const sequelize = require('./config/db');
console.log('Requiring pets route...');

const petsRouter = require('./routes/pets');
const userRouter = require('./routes/user');

const User = require('./models/user');
const Pet = require('./models/pet');

const app = express();
app.use(express.json());


// Serve the index.html page at the root URL
app.use(express.static(path.join(__dirname, 'public'))); // Adjust the folder name if necessary


// Swagger setup
const swaggerSpec = swaggerJsdoc({
  definition: require('./swagger/swagger.json'),
  apis: ['./routes/pets.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/pets', petsRouter);
app.use('/users', userRouter);

// Initialize database and sync models
sequelize.sync({ force: true })  // Cleans the DB on every load
  .then(() => console.log('Database synced'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
