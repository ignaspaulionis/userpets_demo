const request = require('supertest');
const { createApp, sequelize, Pet } = require('../server');

describe('GET /pets name search', () => {
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

  test("GET /pets?name=buddy returns pets whose name contains 'buddy'", async () => {
    await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 3 });
    await request(app).post('/pets').send({ name: 'mybuddycat', type: 'cat', age: 2 });
    await request(app).post('/pets').send({ name: 'Rex', type: 'dog', age: 4 });

    const res = await request(app).get('/pets?name=buddy');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.map((pet) => pet.name).sort()).toEqual(['Buddy', 'mybuddycat']);
  });

  test('GET /pets?name=BUD matches Buddy case-insensitively', async () => {
    await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 3 });
    await request(app).post('/pets').send({ name: 'Rex', type: 'dog', age: 4 });

    const res = await request(app).get('/pets?name=BUD');

    expect(res.status).toBe(200);
    expect(res.body.map((pet) => pet.name)).toEqual(['Buddy']);
  });

  test('GET /pets without name returns all pets', async () => {
    await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 3 });
    await request(app).post('/pets').send({ name: 'mybuddycat', type: 'cat', age: 2 });
    await request(app).post('/pets').send({ name: 'Rex', type: 'dog', age: 4 });

    const res = await request(app).get('/pets');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test('GET /pets?name=zzzznonexistent returns empty array', async () => {
    await request(app).post('/pets').send({ name: 'Buddy', type: 'dog', age: 3 });

    const res = await request(app).get('/pets?name=zzzznonexistent');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
