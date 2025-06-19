const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

/**
 * @swagger
 * tags:
 *   - name: Studios
 *     description: Studio management (admin only)
 * /api/admin/studios:
 *   get:
 *     summary: Get all studios (admin)
 *     tags: [Studios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of studios
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new studio
 *     tags: [Studios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Studio'
 *     responses:
 *       201:
 *         description: Studio created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Studio'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

// Get all studios
router.get('/', (req, res) => {
  const studios = readTable('Studios');
  res.json(studios);
});

// Get a studio by ID
router.get('/:id', (req, res) => {
  const studios = readTable('Studios');
  const studio = studios.find(s => s.studioId == req.params.id);
  if (!studio) return res.status(404).json({ error: 'Studio not found' });
  res.json(studio);
});

// Create a new studio
router.post('/', (req, res) => {
  const studios = readTable('Studios');
  const newId = studios.length ? Math.max(...studios.map(s => s.studioId)) + 1 : 1;
  const newStudio = { ...req.body, studioId: newId };
  studios.push(newStudio);
  writeTable('Studios', studios);
  res.status(201).json(newStudio);
});

// Update a studio
router.put('/:id', (req, res) => {
  const studios = readTable('Studios');
  const idx = studios.findIndex(s => s.studioId == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Studio not found' });
  studios[idx] = { ...studios[idx], ...req.body };
  writeTable('Studios', studios);
  res.json(studios[idx]);
});

// Delete a studio
router.delete('/:id', (req, res) => {
  let studios = readTable('Studios');
  const idx = studios.findIndex(s => s.studioId == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Studio not found' });
  const deleted = studios.splice(idx, 1)[0];
  writeTable('Studios', studios);
  res.json(deleted);
});

module.exports = router; 