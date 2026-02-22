const express = require('express');
const { Tag } = require('../models/tag');
const { handleRouteError } = require('../utils/errorHandler');

const router = express.Router();

const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json(tags);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const tag = await Tag.create({ name: name.trim() });
    res.status(201).json(tag);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid tag id' });
    }

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const tag = await Tag.findByPk(id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    tag.name = name.trim();
    await tag.save();
    res.json(tag);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid tag id' });
    }

    if (name !== undefined && !isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }

    const tag = await Tag.findByPk(id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (name !== undefined) {
      tag.name = name.trim();
    }

    await tag.save();
    res.json(tag);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid tag id' });
    }

    const tag = await Tag.findByPk(id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.destroy();
    res.status(204).end();
  } catch (err) {
    handleRouteError(err, res);
  }
});

module.exports = router;
