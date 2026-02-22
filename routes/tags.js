const express = require('express');
const { Tag } = require('../models/associations');

const router = express.Router();

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json(tags);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await Tag.create({ name: name.trim() });
    res.status(201).json(tag);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tag id' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    tag.name = name.trim();
    await tag.save();
    res.json(tag);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tag id' });
    }

    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const { name } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Tag name must be a non-empty string' });
      }
      tag.name = name.trim();
    }

    await tag.save();
    res.json(tag);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tag id' });
    }

    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
