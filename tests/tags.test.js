const request = require('supertest');
const app = require('../app');
const { Tag } = require('../models/tag');

// Reset tags table before each test for isolation
beforeEach(async () => {
  await Tag.destroy({ where: {}, truncate: true });
});

describe('Tags API', () => {
  // ── GET /tags ─────────────────────────────────────────────────────────────
  describe('GET /tags', () => {
    it('returns an empty array when no tags exist', async () => {
      const res = await request(app).get('/tags');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all existing tags', async () => {
      await Tag.create({ name: 'friendly' });
      await Tag.create({ name: 'vaccinated' });

      const res = await request(app).get('/tags');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const names = res.body.map((t) => t.name);
      expect(names).toContain('friendly');
      expect(names).toContain('vaccinated');
    });
  });

  // ── POST /tags ────────────────────────────────────────────────────────────
  describe('POST /tags', () => {
    it('creates a tag with a valid name', async () => {
      const res = await request(app).post('/tags').send({ name: 'playful' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'playful' });
      expect(res.body.id).toBeDefined();
    });

    it('trims whitespace from name', async () => {
      const res = await request(app).post('/tags').send({ name: '  cute  ' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('cute');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app).post('/tags').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when name is an empty string', async () => {
      const res = await request(app).post('/tags').send({ name: '' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when name is only whitespace', async () => {
      const res = await request(app).post('/tags').send({ name: '   ' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── PUT /tags/:id ─────────────────────────────────────────────────────────
  describe('PUT /tags/:id', () => {
    it('updates a tag name', async () => {
      const tag = await Tag.create({ name: 'old' });
      const res = await request(app)
        .put(`/tags/${tag.id}`)
        .send({ name: 'new' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('new');
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).put('/tags/abc').send({ name: 'x' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent tag', async () => {
      const res = await request(app).put('/tags/9999').send({ name: 'x' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when name is empty', async () => {
      const tag = await Tag.create({ name: 'existing' });
      const res = await request(app)
        .put(`/tags/${tag.id}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /tags/:id ───────────────────────────────────────────────────────
  describe('PATCH /tags/:id', () => {
    it('partially updates a tag name', async () => {
      const tag = await Tag.create({ name: 'original' });
      const res = await request(app)
        .patch(`/tags/${tag.id}`)
        .send({ name: 'updated' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('updated');
    });

    it('returns tag unchanged when body is empty', async () => {
      const tag = await Tag.create({ name: 'stable' });
      const res = await request(app).patch(`/tags/${tag.id}`).send({});
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('stable');
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).patch('/tags/0').send({ name: 'x' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent tag', async () => {
      const res = await request(app).patch('/tags/9999').send({ name: 'x' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when name is empty string', async () => {
      const tag = await Tag.create({ name: 'keep' });
      const res = await request(app)
        .patch(`/tags/${tag.id}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /tags/:id ──────────────────────────────────────────────────────
  describe('DELETE /tags/:id', () => {
    it('deletes an existing tag and returns 204', async () => {
      const tag = await Tag.create({ name: 'temporary' });
      const res = await request(app).delete(`/tags/${tag.id}`);
      expect(res.status).toBe(204);

      const found = await Tag.findByPk(tag.id);
      expect(found).toBeNull();
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).delete('/tags/abc');
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent tag', async () => {
      const res = await request(app).delete('/tags/9999');
      expect(res.status).toBe(404);
    });
  });
});
