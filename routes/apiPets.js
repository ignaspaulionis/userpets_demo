const express = require('express');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

const router = express.Router();

const isPositiveIntegerString = (value) => /^\d+$/.test(value) && Number(value) > 0;

router.get('/', async (req, res) => {
  try {
    const pageRaw = req.query.page ?? '1';
    const limitRaw = req.query.limit ?? '10';

    if (!isPositiveIntegerString(String(pageRaw))) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }

    if (!isPositiveIntegerString(String(limitRaw))) {
      return res.status(400).json({ error: 'limit must be a positive integer' });
    }

    const page = Number(pageRaw);
    const parsedLimit = Number(limitRaw);
    const limit = Math.min(parsedLimit, 100);
    const offset = (page - 1) * limit;

    const total = await Pet.count({ distinct: true, col: 'id' });
    const data = await Pet.findAll({ include: Tag, limit, offset });
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
