const request = require('supertest');
const sequelize = require('../config/db');
const app = require('../app');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

describe('API integration tests', () => {
  let token;
  let user;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    user = await User.create({
      email: 'owner@test.com',
      password: 'pass123',
      fullname: 'Owner User',
    });

    const loginRes = await request(app)
      .post('/users/login')
      .send({ email: 'owner@test.com', password: 'pass123' });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('register user', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ email: 'new@test.com', password: 'pass123', fullname: 'New User' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered successfully!');
  });

  test('login fails with invalid credentials', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'owner@test.com', password: 'wrong' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('protected user route returns 401 without token', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(401);
  });

  test('update other user returns 403', async () => {
    const other = await User.create({ email: 'other@test.com', password: 'pass123', fullname: 'Other' });
    const res = await request(app)
      .put(`/users/${other.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fullname: 'Nope', email: 'other@test.com' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Access denied');
  });

  test('pets CRUD and validation', async () => {
    const invalid = await request(app).post('/pets').send({ name: 'A', type: 'dog', age: 2 });
    expect(invalid.statusCode).toBe(400);

    const create = await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 3 });
    expect(create.statusCode).toBe(201);

    const petId = create.body.id;

    const update = await request(app).put(`/pets/${petId}`).send({ name: 'Max', type: 'cat', age: 4 });
    expect(update.statusCode).toBe(200);
    expect(update.body.name).toBe('Max');

    const patch = await request(app).patch(`/pets/${petId}`).send({ name: 'Rocky' });
    expect(patch.statusCode).toBe(200);
    expect(patch.body.name).toBe('Rocky');

    const del = await request(app).delete(`/pets/${petId}`);
    expect(del.statusCode).toBe(204);
  });

  test('tags CRUD', async () => {
    const create = await request(app).post('/tags').send({ name: 'friendly' });
    expect(create.statusCode).toBe(201);

    const tagId = create.body.id;

    const put = await request(app).put(`/tags/${tagId}`).send({ name: 'playful' });
    expect(put.statusCode).toBe(200);
    expect(put.body.name).toBe('playful');

    const patch = await request(app).patch(`/tags/${tagId}`).send({ name: 'active' });
    expect(patch.statusCode).toBe(200);
    expect(patch.body.name).toBe('active');

    const del = await request(app).delete(`/tags/${tagId}`);
    expect(del.statusCode).toBe(204);
  });

  test('pet-tag assignment and removal', async () => {
    const pet = await Pet.create({ name: 'Luna', type: 'cat', age: 2 });
    const tag = await Tag.create({ name: 'cute' });

    const assign = await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);
    expect(assign.statusCode).toBe(200);
    expect(assign.body.Tags.length).toBe(1);

    const remove = await request(app).delete(`/pets/${pet.id}/tags/${tag.id}`);
    expect(remove.statusCode).toBe(204);
  });

  test('not found cases', async () => {
    const pet404 = await request(app).delete('/pets/9999');
    expect(pet404.statusCode).toBe(404);

    const tag404 = await request(app).put('/tags/9999').send({ name: 'x' });
    expect(tag404.statusCode).toBe(404);

    const user404 = await request(app)
      .patch('/users/9999')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullname: 'x' });
    expect(user404.statusCode).toBe(404);
  });
});
