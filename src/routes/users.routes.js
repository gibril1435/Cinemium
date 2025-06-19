const express = require('express');
const router = express.Router();
const { readTable, writeTable } = require('../utils/jsonDb');

// Get all users
router.get('/', (req, res) => {
  const users = readTable('Users');
  res.json(users);
});

// Get a user by ID
router.get('/:id', (req, res) => {
  const users = readTable('Users');
  const user = users.find(u => u.UserID == req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Create a new user
router.post('/', (req, res) => {
  const users = readTable('Users');
  const newId = users.length ? Math.max(...users.map(u => u.UserID)) + 1 : 1;
  const newUser = { ...req.body, UserID: newId };
  users.push(newUser);
  writeTable('Users', users);
  res.status(201).json(newUser);
});

// Update a user
router.put('/:id', (req, res) => {
  const users = readTable('Users');
  const idx = users.findIndex(u => u.UserID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx] = { ...users[idx], ...req.body };
  writeTable('Users', users);
  res.json(users[idx]);
});

// Delete a user
router.delete('/:id', (req, res) => {
  let users = readTable('Users');
  const idx = users.findIndex(u => u.UserID == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const deleted = users.splice(idx, 1)[0];
  writeTable('Users', users);
  res.json(deleted);
});

module.exports = router; 