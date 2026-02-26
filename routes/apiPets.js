const express = require('express');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

const router = express.Router();

const parsePositiveInt = (value) => {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(String(value))) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

router.get('/', async (req, res) => {
  try {
    const parsedPage = parsePositiveInt(req.query.page);
    const parsedLimit = parsePositiveInt(req.query.limit);

    if (parsedPage === null) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }

    if (parsedLimit === null) {
      return res.status(400).json({ error: 'limit must be a positive integer' });
    }

    const page = parsedPage || 1;
    const requestedLimit = parsedLimit || 10;
    const limit = Math.min(requestedLimit, 100);
    const offset = (page - 1) * limit;

    const total = await Pet.count();
    const data = await Pet.findAll({
      include: Tag,
      order: [['id', 'ASC']],
      limit,
      offset,
    });

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

router.get('/types', (req, res) => {
  res.json(['dog', 'cat', 'bird', 'fish', 'hamster']);
});

module.exports = router;
