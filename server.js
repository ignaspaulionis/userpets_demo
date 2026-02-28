const path = require('path');
const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
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

function createPetNotifier() {
  const clients = new Set();

  return {
    register(client) {
      clients.add(client);
      client.on('close', () => clients.delete(client));
    },
    broadcastPetCreated(pet) {
      const message = JSON.stringify({
        type: 'pet_created',
        payload: {
          id: pet.id,
          name: pet.name,
          type: pet.type,
          age: pet.age,
        },
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    },
  };
}

function createApp(options = {}) {
  const app = express();
  app.use(express.json());

  app.locals.petNotifier = options.petNotifier || { broadcastPetCreated: () => {} };

  app.use(express.static(path.join(__dirname, 'public')));

  const swaggerSpec = swaggerJsdoc({
    definition: require('./swagger/swagger.json'),
    apis: ['./routes/pets.js'],
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/pets', petsRouter);
  app.use('/users', userRouter);
  app.use('/tags', tagsRouter);

  return app;
}

async function startServer() {
  await sequelize.sync({ force: process.env.NODE_ENV === 'test' });
  const notifier = createPetNotifier();
  const app = createApp({ petNotifier: notifier });
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    notifier.register(ws);
  });

  const port = process.env.PORT || 3000;
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = { createApp, startServer, createPetNotifier, sequelize, User, Pet, Tag };
