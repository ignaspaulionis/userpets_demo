const request = require('supertest');
const app = require('../server');

const loginAndGetToken = async () => {
  const res = await request(app)
    .post('/users/login')
    .send({ email: 'test@test.com', password: 'password123' });

  return res.body.token;
};

describe('Pet API', () => {
  it('should create a new pet', async () => {
    const token = await loginAndGetToken();
    const res = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Buddy', type: 'dog', age: 3 });

    expect(res.statusCode).toEqual(201);
  });

  it('should fail to create a pet with invalid data', async () => {
    const token = await loginAndGetToken();
    const res = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Buddy', age: -1 });

    expect(res.statusCode).toEqual(400);
  });
});