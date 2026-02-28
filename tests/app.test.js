const request = require('supertest');
const jwt = require('jwt-simple');
const { createApp, sequelize, User, Pet, Tag } = require('../server');

const secretKey = 'your_secret_key';

describe('API integration tests', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Users', () => {
    test('registers user', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'user1@example.com',
        password: 'password123',
        fullname: 'User One',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: 'User registered successfully!' });
    });

    test('login returns token', async () => {
      await User.create({
        email: 'user2@example.com',
        password: 'password123',
        fullname: 'User Two',
      });

      const res = await request(app).post('/users/login').send({
        email: 'user2@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
    });

    test('rejects protected route without token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    test('allows authenticated user to list users', async () => {
      const user = await User.create({
        email: 'auth@example.com',
        password: 'password123',
        fullname: 'Auth User',
      });
      const token = jwt.encode({ userId: user.id }, secretKey);

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('email');
    });

    test('forbids updating another user without superadmin', async () => {
      const userA = await User.create({
        email: 'a@example.com',
        password: 'password123',
        fullname: 'User A',
      });
      const userB = await User.create({
        email: 'b@example.com',
        password: 'password123',
        fullname: 'User B',
      });
      const token = jwt.encode({ userId: userA.id }, secretKey);

      const res = await request(app)
        .put(`/users/${userB.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Updated Name' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied');
    });
  });

  describe('Pets', () => {
    test('creates pet with valid payload', async () => {
      const res = await request(app).post('/pets').send({
        name: 'Buddy',
        type: 'dog',
        age: 4,
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Buddy');
      expect(res.body.type).toBe('dog');
      expect(res.body.age).toBe(4);
    });

    test('rejects pet with invalid age', async () => {
      const res = await request(app).post('/pets').send({
        name: 'Buddy',
        type: 'dog',
        age: 99,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Age must be an integer between 0 and 30');
    });

    test('returns 404 when deleting missing pet', async () => {
      const res = await request(app).delete('/pets/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pet not found');
    });
  });

  describe('Tags', () => {
    test('creates tag and lists tags', async () => {
      const createRes = await request(app).post('/tags').send({ name: 'friendly' });
      expect(createRes.status).toBe(201);

      const listRes = await request(app).get('/tags');
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body[0].name).toBe('friendly');
    });

    test('rejects blank tag name', async () => {
      const res = await request(app).post('/tags').send({ name: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name is required');
    });

    test('returns 400 for invalid tag id in update', async () => {
      const res = await request(app).put('/tags/abc').send({ name: 'new' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid tag id');
    });
  });

  describe('Pet-tag relations', () => {
    test('assigns and removes tag from pet', async () => {
      const pet = await Pet.create({ name: 'Nora', type: 'cat', age: 2 });
      const tag = await Tag.create({ name: 'cute' });

      const assignRes = await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);
      expect(assignRes.status).toBe(200);
      expect(assignRes.body.Tags.length).toBe(1);

      const removeRes = await request(app).delete(`/pets/${pet.id}/tags/${tag.id}`);
      expect(removeRes.status).toBe(204);
    });

    test('returns 400 for invalid pet/tag ids', async () => {
      const res = await request(app).post('/pets/abc/tags/xyz');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid pet id or tag id');
    });
  });
});
