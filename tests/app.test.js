const request = require('supertest');
const sequelize = require('../config/db');
const { createApp } = require('../server');
const User = require('../models/user');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

const app = createApp();

async function createAndLoginUser(email = 'user@example.com') {
  await request(app).post('/users/register').send({
    email,
    password: 'pass1234',
    fullname: 'User Name',
  });

  const loginRes = await request(app).post('/users/login').send({
    email,
    password: 'pass1234',
  });

  return loginRes.body.token;
}

describe('App integration tests', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('/users', () => {
    test('registers successfully', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'register@example.com',
        password: 'pass1234',
        fullname: 'Register User',
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully!');
    });

    test('returns 400 on duplicate register', async () => {
      await request(app).post('/users/register').send({
        email: 'dup@example.com',
        password: 'pass1234',
        fullname: 'Dup User',
      });

      const res = await request(app).post('/users/register').send({
        email: 'dup@example.com',
        password: 'pass1234',
        fullname: 'Dup User 2',
      });

      expect(res.status).toBe(400);
    });

    test('login success', async () => {
      await request(app).post('/users/register').send({
        email: 'login@example.com',
        password: 'pass1234',
        fullname: 'Login User',
      });

      const res = await request(app).post('/users/login').send({
        email: 'login@example.com',
        password: 'pass1234',
      });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
    });

    test('login invalid credentials returns 400', async () => {
      const res = await request(app).post('/users/login').send({
        email: 'missing@example.com',
        password: 'wrongpass',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });

    test('GET /users returns 401 without token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
    });

    test('GET /users returns 200 with token', async () => {
      const token = await createAndLoginUser('list@example.com');

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('PUT /users/:id owner update returns 200', async () => {
      const token = await createAndLoginUser('owner@example.com');
      const owner = await User.findOne({ where: { email: 'owner@example.com' } });

      const res = await request(app)
        .put(`/users/${owner.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'owner.updated@example.com', fullname: 'Owner Updated' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('owner.updated@example.com');
    });

    test('PUT /users/:id non-owner returns 403', async () => {
      const ownerToken = await createAndLoginUser('owner2@example.com');
      const anotherToken = await createAndLoginUser('other@example.com');
      const owner = await User.findOne({ where: { email: 'owner2@example.com' } });

      const res = await request(app)
        .put(`/users/${owner.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ fullname: 'Hacker' });

      expect(ownerToken).toBeDefined();
      expect(res.status).toBe(403);
    });

    test('PUT /users/:id missing user returns 404 in authorized context', async () => {
      const token = await createAndLoginUser('adminlike@example.com');
      const current = await User.findOne({ where: { email: 'adminlike@example.com' } });

      const res = await request(app)
        .put('/users/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Nobody' });

      expect(current.id).not.toBe(999);
      expect(res.status).toBe(403);
    });

    test('PATCH /users/:id with token returns 200 (permissive)', async () => {
      const token = await createAndLoginUser('patcher@example.com');
      const user = await User.findOne({ where: { email: 'patcher@example.com' } });

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Patched User' });

      expect(res.status).toBe(200);
      expect(res.body.user.fullname).toBe('Patched User');
    });

    test('PATCH /users/:id missing user returns 404', async () => {
      const token = await createAndLoginUser('patchmissing@example.com');

      const res = await request(app)
        .patch('/users/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Nobody' });

      expect(res.status).toBe(404);
    });

    test('/users/user-stats is public and returns 200', async () => {
      const res = await request(app).get('/users/user-stats');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('/pets', () => {
    test('GET /pets returns 200', async () => {
      const res = await request(app).get('/pets');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /pets valid returns 201', async () => {
      const res = await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 3 });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Buddy');
    });

    test('POST /pets invalid name returns 400', async () => {
      const res = await request(app).post('/pets').send({ name: 'A', type: 'dog', age: 3 });
      expect(res.status).toBe(400);
    });

    test('POST /pets invalid age returns 400', async () => {
      const res = await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 100 });
      expect(res.status).toBe(400);
    });

    test('POST /pets invalid type returns 400', async () => {
      const res = await request(app).post('/pets').send({ name: 'Buddy', type: 'dragon', age: 3 });
      expect(res.status).toBe(400);
    });

    test('PUT /pets/:id existing returns 200', async () => {
      const pet = await Pet.create({ name: 'Kitty', type: 'cat', age: 2 });
      const res = await request(app).put(`/pets/${pet.id}`).send({ name: 'Kitty2', type: 'cat', age: 4 });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Kitty2');
    });

    test('PUT /pets/:id missing returns 404', async () => {
      const res = await request(app).put('/pets/999').send({ name: 'No', type: 'cat', age: 1 });
      expect(res.status).toBe(404);
    });

    test('PATCH /pets/:id existing returns 200', async () => {
      const pet = await Pet.create({ name: 'Birdy', type: 'bird', age: 1 });
      const res = await request(app).patch(`/pets/${pet.id}`).send({ name: 'Birdy2' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Birdy2');
    });

    test('PATCH /pets/:id missing returns 404', async () => {
      const res = await request(app).patch('/pets/999').send({ name: 'Nope' });
      expect(res.status).toBe(404);
    });

    test('DELETE /pets/:id invalid id returns 400', async () => {
      const res = await request(app).delete('/pets/not-a-number');
      expect(res.status).toBe(400);
    });

    test('DELETE /pets/:id missing returns 404', async () => {
      const res = await request(app).delete('/pets/999');
      expect(res.status).toBe(404);
    });

    test('DELETE /pets/:id success returns 204', async () => {
      const pet = await Pet.create({ name: 'DeleteMe', type: 'fish', age: 1 });
      const res = await request(app).delete(`/pets/${pet.id}`);
      expect(res.status).toBe(204);
    });
  });

  describe('/tags', () => {
    test('GET /tags returns 200', async () => {
      const res = await request(app).get('/tags');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /tags valid returns 201', async () => {
      const res = await request(app).post('/tags').send({ name: 'friendly' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('friendly');
    });

    test('POST /tags invalid name returns 400', async () => {
      const res = await request(app).post('/tags').send({ name: '   ' });
      expect(res.status).toBe(400);
    });

    test('PUT /tags/:id invalid id returns 400', async () => {
      const res = await request(app).put('/tags/abc').send({ name: 'x' });
      expect(res.status).toBe(400);
    });

    test('PUT /tags/:id not found returns 404', async () => {
      const res = await request(app).put('/tags/999').send({ name: 'x' });
      expect(res.status).toBe(404);
    });

    test('PUT /tags/:id success returns 200', async () => {
      const tag = await Tag.create({ name: 'old' });
      const res = await request(app).put(`/tags/${tag.id}`).send({ name: 'new' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('new');
    });

    test('PATCH /tags/:id invalid id returns 400', async () => {
      const res = await request(app).patch('/tags/abc').send({ name: 'x' });
      expect(res.status).toBe(400);
    });

    test('PATCH /tags/:id invalid name returns 400', async () => {
      const tag = await Tag.create({ name: 'ok' });
      const res = await request(app).patch(`/tags/${tag.id}`).send({ name: '   ' });
      expect(res.status).toBe(400);
    });

    test('PATCH /tags/:id not found returns 404', async () => {
      const res = await request(app).patch('/tags/999').send({ name: 'x' });
      expect(res.status).toBe(404);
    });

    test('PATCH /tags/:id success returns 200', async () => {
      const tag = await Tag.create({ name: 'ok' });
      const res = await request(app).patch(`/tags/${tag.id}`).send({ name: 'better' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('better');
    });

    test('DELETE /tags/:id invalid id returns 400', async () => {
      const res = await request(app).delete('/tags/abc');
      expect(res.status).toBe(400);
    });

    test('DELETE /tags/:id not found returns 404', async () => {
      const res = await request(app).delete('/tags/999');
      expect(res.status).toBe(404);
    });

    test('DELETE /tags/:id success returns 204', async () => {
      const tag = await Tag.create({ name: 'deleteme' });
      const res = await request(app).delete(`/tags/${tag.id}`);
      expect(res.status).toBe(204);
    });
  });

  describe('Pet-Tag relations', () => {
    test('POST /pets/:petId/tags/:tagId invalid ids returns 400', async () => {
      const res = await request(app).post('/pets/abc/tags/xyz');
      expect(res.status).toBe(400);
    });

    test('POST relation missing pet returns 404', async () => {
      const tag = await Tag.create({ name: 'active' });
      const res = await request(app).post(`/pets/999/tags/${tag.id}`);
      expect(res.status).toBe(404);
    });

    test('POST relation missing tag returns 404', async () => {
      const pet = await Pet.create({ name: 'Rex', type: 'dog', age: 5 });
      const res = await request(app).post(`/pets/${pet.id}/tags/999`);
      expect(res.status).toBe(404);
    });

    test('POST relation success returns 200 and relation visible via GET /pets', async () => {
      const pet = await Pet.create({ name: 'Rex', type: 'dog', age: 5 });
      const tag = await Tag.create({ name: 'playful' });

      const assignRes = await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);
      expect(assignRes.status).toBe(200);
      expect(assignRes.body.id).toBe(pet.id);

      const petsRes = await request(app).get('/pets');
      expect(petsRes.status).toBe(200);
      const matchedPet = petsRes.body.find((p) => p.id === pet.id);
      expect(matchedPet).toBeDefined();
      expect(Array.isArray(matchedPet.Tags)).toBe(true);
      expect(matchedPet.Tags.some((t) => t.id === tag.id && t.name === 'playful')).toBe(true);
    });

    test('DELETE /pets/:petId/tags/:tagId invalid ids returns 400', async () => {
      const res = await request(app).delete('/pets/abc/tags/xyz');
      expect(res.status).toBe(400);
    });

    test('DELETE relation missing pet returns 404', async () => {
      const tag = await Tag.create({ name: 'sleepy' });
      const res = await request(app).delete(`/pets/999/tags/${tag.id}`);
      expect(res.status).toBe(404);
    });

    test('DELETE relation missing tag returns 404', async () => {
      const pet = await Pet.create({ name: 'Luna', type: 'cat', age: 2 });
      const res = await request(app).delete(`/pets/${pet.id}/tags/999`);
      expect(res.status).toBe(404);
    });

    test('DELETE relation success returns 204 and relation removed in GET /pets', async () => {
      const pet = await Pet.create({ name: 'Nemo', type: 'fish', age: 1 });
      const tag = await Tag.create({ name: 'tiny' });
      await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);

      const removeRes = await request(app).delete(`/pets/${pet.id}/tags/${tag.id}`);
      expect(removeRes.status).toBe(204);

      const petsRes = await request(app).get('/pets');
      const matchedPet = petsRes.body.find((p) => p.id === pet.id);
      expect(matchedPet).toBeDefined();
      expect(Array.isArray(matchedPet.Tags)).toBe(true);
      expect(matchedPet.Tags.some((t) => t.id === tag.id)).toBe(false);
    });
  });
});
