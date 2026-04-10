// Created by Google Gemini
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

router.post('/sync', authMiddleware, async (req, res) => {
  const { user } = req;
  try {
    const syncedUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        last_seen: new Date(),
        username: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url
      },
      create: {
        id: user.id,
        username: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url
      }
    });
    res.json(syncedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

module.exports = router;
