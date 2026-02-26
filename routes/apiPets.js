const express = require('express');
const { Pet } = require('../models/pet');
const { Tag } = require('../models/tag');

const router = express.Router();

const parsePositiveInteger = (value) => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

router.get('/', async (req, res) => {
  try {
    const parsedPage = parsePositiveInteger(req.query.page);
    const parsedLimit = parsePositiveInteger(req.query.limit);

    if (parsedPage === null) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }

    if (parsedLimit === null) {
      return res.status(400).json({ error: 'limit must be a positive integer' });
    }

    const page = parsedPage || 1;
    const limit = Math.min(parsedLimit || 10, 100);
    const offset = (page - 1) * limit;
    const where = {};

    const total = await Pet.count({ where, distinct: true, col: 'id' });
    const data = await Pet.findAll({
      where,
      include: Tag,
      limit,
      offset,
      order: [['id', 'ASC']],
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

module.exports = router;
