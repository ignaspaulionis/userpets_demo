const request = require('supertest');
const jwt = require('jwt-simple');
const { app, initDatabase, sequelize } = require('../server');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

const secretKey = 'your_secret_key';

describe('API integration tests', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('users auth and protected routes', () => {
    test('register and login succeeds', async () => {
      const registerRes = await request(app).post('/users/register').send({
        email: 'dev@example.com',
        password: 'password123',
        fullname: 'Dev User',
      });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body).toEqual({ message: 'User registered successfully!' });

      const loginRes = await request(app).post('/users/login').send({
        email: 'dev@example.com',
        password: 'password123',
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeTruthy();
    });

    test('login fails for invalid password', async () => {
      await User.create({ email: 'dev2@example.com', password: 'password123', fullname: 'Dev 2' });

      const res = await request(app).post('/users/login').send({
        email: 'dev2@example.com',
        password: 'wrong-password',
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid credentials' });
    });

    test('protected route rejects missing token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'No token provided' });
    });

    test('protected route allows valid token', async () => {
      const user = await User.create({ email: 'admin@example.com', password: 'password123', fullname: 'Admin' });
      const token = jwt.encode({ userId: user.id }, secretKey);

      const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toMatchObject({ id: user.id, email: 'admin@example.com', fullname: 'Admin' });
    });
  });

  describe('pets CRUD and validation', () => {
    test('create pet validates age boundary and allows age 0', async () => {
      const invalid = await request(app).post('/pets').send({ name: 'Rex', type: 'dog', age: -1 });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toEqual({ error: 'Age must be an integer between 0 and 30' });

      const valid = await request(app).post('/pets').send({ name: 'Rex', type: 'dog', age: 0 });
      expect(valid.status).toBe(201);
      expect(valid.body).toMatchObject({ name: 'Rex', type: 'dog', age: 0 });
      expect(valid.body.createdAt).toBeTruthy();
      expect(valid.body.updatedAt).toBeTruthy();
    });

    test('list, update, patch, delete pet', async () => {
      const createRes = await request(app).post('/pets').send({ name: 'Milo', type: 'cat', age: 2 });
      const petId = createRes.body.id;

      const listRes = await request(app).get('/pets');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(1);

      const putRes = await request(app).put(`/pets/${petId}`).send({ name: 'Milo2', type: 'cat', age: 3 });
      expect(putRes.status).toBe(200);
      expect(putRes.body).toMatchObject({ id: petId, name: 'Milo2', type: 'cat', age: 3 });

      const patchRes = await request(app).patch(`/pets/${petId}`).send({ name: 'Milo3' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.name).toBe('Milo3');

      const deleteRes = await request(app).delete(`/pets/${petId}`);
      expect(deleteRes.status).toBe(204);

      const deleted = await Pet.findByPk(petId);
      expect(deleted).toBeNull();
    });
  });

  describe('tags CRUD and pet-tag relations', () => {
    test('create/update/delete tag with validation', async () => {
      const invalidCreate = await request(app).post('/tags').send({ name: '   ' });
      expect(invalidCreate.status).toBe(400);
      expect(invalidCreate.body).toEqual({ error: 'Name is required' });

      const create = await request(app).post('/tags').send({ name: ' friendly ' });
      expect(create.status).toBe(201);
      expect(create.body.name).toBe('friendly');

      const invalidPut = await request(app).put(`/tags/${create.body.id}`).send({ name: '' });
      expect(invalidPut.status).toBe(400);
      expect(invalidPut.body).toEqual({ error: 'Name is required' });

      const update = await request(app).put(`/tags/${create.body.id}`).send({ name: ' playful ' });
      expect(update.status).toBe(200);
      expect(update.body.name).toBe('playful');

      const del = await request(app).delete(`/tags/${create.body.id}`);
      expect(del.status).toBe(204);
    });

    test('assign and remove tag from pet + negative cases', async () => {
      const pet = await Pet.create({ name: 'Bolt', type: 'dog', age: 4 });
      const tag = await Tag.create({ name: 'energetic' });

      const assign = await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);
      expect(assign.status).toBe(200);
      expect(assign.body.id).toBe(pet.id);
      expect(assign.body.Tags.length).toBe(1);
      expect(assign.body.Tags[0].id).toBe(tag.id);

      const remove = await request(app).delete(`/pets/${pet.id}/tags/${tag.id}`);
      expect(remove.status).toBe(204);

      const invalidIds = await request(app).post('/pets/abc/tags/xyz');
      expect(invalidIds.status).toBe(400);
      expect(invalidIds.body).toEqual({ error: 'Invalid pet id or tag id' });

      const missingPet = await request(app).post(`/pets/999/tags/${tag.id}`);
      expect(missingPet.status).toBe(404);
      expect(missingPet.body).toEqual({ error: 'Pet not found' });
    });
  });
});
