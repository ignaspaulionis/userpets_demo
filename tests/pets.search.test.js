const request = require('supertest');
const { sequelize } = require('../config/db');

let app;
let Pet;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  app = require('../server');
  ({ Pet } = require('../models/pet'));
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
  await Pet.bulkCreate([
    { name: 'Buddy', type: 'dog', age: 3 },
    { name: 'mybuddycat', type: 'cat', age: 2 },
    { name: 'Rex', type: 'dog', age: 4 }
  ]);
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /pets name search', () => {
  test('name=buddy returns only partial case-insensitive matches', async () => {
    const res = await request(app).get('/pets?name=buddy');
    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Buddy', 'mybuddycat']));
    expect(names).not.toContain('Rex');
    expect(res.body).toHaveLength(2);
  });

  test('name=BUD also matches Buddy (case-insensitive)', async () => {
    const res = await request(app).get('/pets?name=BUD');
    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Buddy', 'mybuddycat']));
    expect(names).not.toContain('Rex');
    expect(res.body).toHaveLength(2);
  });

  test('without name returns all pets', async () => {
    const res = await request(app).get('/pets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test('nonexistent name returns empty array', async () => {
    const res = await request(app).get('/pets?name=zzzznonexistent');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
