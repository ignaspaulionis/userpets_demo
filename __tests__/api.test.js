const request = require('supertest');
const app = require('../server');

// Test user registration
it('should register a new user', async () => {
  const response = await request(app).post('/users/register').send({ email: 'test@test.com', password: 'pass12345678', fullname: 'Test User' });
  expect(response.status).toBe(201);
});

// Add more test cases as needed