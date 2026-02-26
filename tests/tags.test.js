const request = require('supertest');
const app = require('../app');

describe('Tags API', () => {
  it('supports tags CRUD and list', async () => {
    const create = await request(app).post('/tags').send({ name: 'Friendly' });
    expect(create.status).toBe(201);

    const list = await request(app).get('/tags');
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);

    const put = await request(app).put(`/tags/${create.body.id}`).send({ name: 'Guard' });
    expect(put.status).toBe(200);
    expect(put.body.name).toBe('Guard');

    const patch = await request(app).patch(`/tags/${create.body.id}`).send({ name: 'Calm' });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe('Calm');

    const del = await request(app).delete(`/tags/${create.body.id}`);
    expect(del.status).toBe(204);
  });

  it('returns 400 for invalid id and 404 for missing tag', async () => {
    const invalid = await request(app).put('/tags/abc').send({ name: 'Nope' });
    expect(invalid.status).toBe(400);

    const missing = await request(app).put('/tags/999').send({ name: 'Nope' });
    expect(missing.status).toBe(404);
  });
});
