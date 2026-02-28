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

    test('rejects duplicate registration', async () => {
      await User.create({
        email: 'dup@example.com',
        password: 'password123',
        fullname: 'Dup User',
      });

      const res = await request(app).post('/users/register').send({
        email: 'dup@example.com',
        password: 'password123',
        fullname: 'Dup User',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
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

    test('login rejects invalid credentials', async () => {
      await User.create({
        email: 'user3@example.com',
        password: 'password123',
        fullname: 'User Three',
      });

      const res = await request(app).post('/users/login').send({
        email: 'user3@example.com',
        password: 'wrong',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
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

    test('allows user to update own profile via PUT', async () => {
      const user = await User.create({
        email: 'self@example.com',
        password: 'password123',
        fullname: 'Self User',
      });
      const token = jwt.encode({ userId: user.id }, secretKey);

      const res = await request(app)
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Self Updated', email: 'self-new@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.user.fullname).toBe('Self Updated');
      expect(res.body.user.email).toBe('self-new@example.com');
    });

    test('patches user fields including issuperadmin', async () => {
      const user = await User.create({
        email: 'patchme@example.com',
        password: 'password123',
        fullname: 'Patch Me',
      });
      const token = jwt.encode({ userId: user.id }, secretKey);

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Patched', issuperadmin: true });

      expect(res.status).toBe(200);
      expect(res.body.user.fullname).toBe('Patched');
      expect(res.body.user.issuperadmin).toBe(true);
    });

    test('returns 404 when updating missing user in authorized context', async () => {
      const superadmin = await User.create({
        email: 'superadmin@example.com',
        password: 'password123',
        fullname: 'Super Admin',
        issuperadmin: true,
      });
      const token = jwt.encode({ userId: superadmin.id }, secretKey);

      const res = await request(app)
        .put('/users/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Nope' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    test('returns user stats', async () => {
      await User.create({
        email: 'stats@example.com',
        password: 'password123',
        fullname: 'Stats User',
      });

      const res = await request(app).get('/users/user-stats');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).toHaveProperty('issuperadmin');
    });
  });

  describe('Pets', () => {
    test('lists pets', async () => {
      await Pet.create({ name: 'Luna', type: 'cat', age: 2 });
      const res = await request(app).get('/pets');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].name).toBe('Luna');
    });

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

    test('rejects pet creation for age -1, 101, and non-integer', async () => {
      const payloadBase = { name: 'Buddy', type: 'dog' };

      const negativeRes = await request(app).post('/pets').send({ ...payloadBase, age: -1 });
      const overRes = await request(app).post('/pets').send({ ...payloadBase, age: 101 });
      const nonIntegerRes = await request(app).post('/pets').send({ ...payloadBase, age: 2.5 });

      expect(negativeRes.status).toBe(400);
      expect(overRes.status).toBe(400);
      expect(nonIntegerRes.status).toBe(400);
      expect(negativeRes.body.error).toContain('Age must be an integer between 0 and 30');
      expect(overRes.body.error).toContain('Age must be an integer between 0 and 30');
      expect(nonIntegerRes.body.error).toContain('Age must be an integer between 0 and 30');
    });

    test('rejects pet with invalid type', async () => {
      const res = await request(app).post('/pets').send({
        name: 'Buddy',
        type: 'dragon',
        age: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Type must be one of');
    });

    test('updates pet with PUT', async () => {
      const pet = await Pet.create({ name: 'Old', type: 'cat', age: 3 });
      const res = await request(app).put(`/pets/${pet.id}`).send({
        name: 'New',
        type: 'dog',
        age: 4,
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New');
      expect(res.body.type).toBe('dog');
      expect(res.body.age).toBe(4);
    });

    test('patches pet with PATCH', async () => {
      const pet = await Pet.create({ name: 'Patchy', type: 'cat', age: 3 });
      const res = await request(app).patch(`/pets/${pet.id}`).send({ name: 'Patched' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Patched');
      expect(res.body.type).toBe('cat');
    });

    test('supports age edge values on create and patch', async () => {
      const createZero = await request(app).post('/pets').send({ name: 'Zero', type: 'cat', age: 0 });
      const createThirty = await request(app).post('/pets').send({ name: 'Thirty', type: 'dog', age: 30 });

      expect(createZero.status).toBe(201);
      expect(createZero.body.age).toBe(0);
      expect(createThirty.status).toBe(201);
      expect(createThirty.body.age).toBe(30);

      const patchZero = await request(app).patch(`/pets/${createThirty.body.id}`).send({ age: 0 });
      expect(patchZero.status).toBe(200);
      expect(patchZero.body.age).toBe(0);

      const persisted = await Pet.findByPk(createThirty.body.id);
      expect(persisted.age).toBe(0);
    });

    test('rejects invalid ages on PUT and PATCH', async () => {
      const pet = await Pet.create({ name: 'Agey', type: 'cat', age: 3 });

      const putNegative = await request(app).put(`/pets/${pet.id}`).send({ name: 'Agey', type: 'cat', age: -1 });
      const putOver = await request(app).put(`/pets/${pet.id}`).send({ name: 'Agey', type: 'cat', age: 31 });
      const putNonInteger = await request(app).put(`/pets/${pet.id}`).send({ name: 'Agey', type: 'cat', age: 1.5 });
      const patchOver = await request(app).patch(`/pets/${pet.id}`).send({ age: 999 });

      expect(putNegative.status).toBe(400);
      expect(putOver.status).toBe(400);
      expect(putNonInteger.status).toBe(400);
      expect(patchOver.status).toBe(400);

      expect(putNegative.body.error).toContain('Age must be an integer between 0 and 30');
      expect(putOver.body.error).toContain('Age must be an integer between 0 and 30');
      expect(putNonInteger.body.error).toContain('Age must be an integer between 0 and 30');
      expect(patchOver.body.error).toContain('Age must be an integer between 0 and 30');
    });

    test('returns 404 when updating missing pet', async () => {
      const res = await request(app).put('/pets/999').send({ name: 'Ghost', type: 'dog', age: 2 });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pet not found');
    });

    test('returns 400 for invalid pet id on delete', async () => {
      const res = await request(app).delete('/pets/abc');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid pet id');
    });

    test('deletes existing pet', async () => {
      const pet = await Pet.create({ name: 'DeleteMe', type: 'cat', age: 1 });
      const res = await request(app).delete(`/pets/${pet.id}`);
      expect(res.status).toBe(204);
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

    test('updates tag with PUT', async () => {
      const tag = await Tag.create({ name: 'old' });
      const res = await request(app).put(`/tags/${tag.id}`).send({ name: 'new' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('new');
    });

    test('patches tag with PATCH', async () => {
      const tag = await Tag.create({ name: 'patch-old' });
      const res = await request(app).patch(`/tags/${tag.id}`).send({ name: 'patch-new' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('patch-new');
    });

    test('returns 400 for invalid tag id in update', async () => {
      const res = await request(app).put('/tags/abc').send({ name: 'new' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid tag id');
    });

    test('returns 404 for missing tag on PUT', async () => {
      const res = await request(app).put('/tags/999').send({ name: 'new' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tag not found');
    });

    test('returns 400 for invalid PATCH tag name payload', async () => {
      const tag = await Tag.create({ name: 'keep' });
      const res = await request(app).patch(`/tags/${tag.id}`).send({ name: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name must be a non-empty string');
    });

    test('returns 404 for missing tag on PATCH', async () => {
      const res = await request(app).patch('/tags/999').send({ name: 'new' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tag not found');
    });

    test('returns 404 for missing tag on delete', async () => {
      const res = await request(app).delete('/tags/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tag not found');
    });

    test('deletes existing tag', async () => {
      const tag = await Tag.create({ name: 'delete-tag' });
      const res = await request(app).delete(`/tags/${tag.id}`);
      expect(res.status).toBe(204);
    });
  });

  describe('Pet-tag relations', () => {
    test('assigns and removes tag from pet', async () => {
      const pet = await Pet.create({ name: 'Nora', type: 'cat', age: 2 });
      const tag = await Tag.create({ name: 'cute' });

      const assignRes = await request(app).post(`/pets/${pet.id}/tags/${tag.id}`);
      expect(assignRes.status).toBe(200);
      expect(assignRes.body.id).toBe(pet.id);

      const petAfterAssign = await request(app).get('/pets');
      expect(petAfterAssign.status).toBe(200);
      expect(petAfterAssign.body[0].Tags.some((t) => t.id === tag.id)).toBe(true);

      const removeRes = await request(app).delete(`/pets/${pet.id}/tags/${tag.id}`);
      expect(removeRes.status).toBe(204);

      const petAfterRemove = await request(app).get('/pets');
      expect(petAfterRemove.status).toBe(200);
      expect(petAfterRemove.body[0].Tags.length).toBe(0);
    });

    test('returns 400 for invalid pet/tag ids', async () => {
      const res = await request(app).post('/pets/abc/tags/xyz');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid pet id or tag id');
    });

    test('returns 404 when assigning to missing pet', async () => {
      const tag = await Tag.create({ name: 'active' });
      const res = await request(app).post(`/pets/999/tags/${tag.id}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pet not found');
    });

    test('returns 404 when assigning missing tag', async () => {
      const pet = await Pet.create({ name: 'Milo', type: 'dog', age: 4 });
      const res = await request(app).post(`/pets/${pet.id}/tags/999`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tag not found');
    });

    test('returns 400 for invalid pet/tag ids on remove', async () => {
      const res = await request(app).delete('/pets/abc/tags/xyz');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid pet id or tag id');
    });

    test('returns 404 when removing from missing pet', async () => {
      const tag = await Tag.create({ name: 'calm' });
      const res = await request(app).delete(`/pets/999/tags/${tag.id}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pet not found');
    });

    test('returns 404 when removing missing tag', async () => {
      const pet = await Pet.create({ name: 'Mia', type: 'cat', age: 1 });
      const res = await request(app).delete(`/pets/${pet.id}/tags/999`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tag not found');
    });

    test('returns 404 when removing missing relation participants', async () => {
      const res = await request(app).delete('/pets/999/tags/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pet not found');
    });
  });
});
