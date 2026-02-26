const request = require('supertest');
const app = require('../app');

describe('Malformed JSON handling', () => {
  const assertMalformed = async (path) => {
    const res = await request(app)
      .post(path)
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(res.status).toBe(400);
    expect(res.type).toMatch(/json/);
    expect(res.body).toEqual({ error: 'Malformed JSON' });
  };

  it('normalizes malformed JSON for users register', async () => {
    await assertMalformed('/users/register');
  });

  it('normalizes malformed JSON for pets', async () => {
    await assertMalformed('/pets');
  });

  it('normalizes malformed JSON for tags', async () => {
    await assertMalformed('/tags');
  });
});
