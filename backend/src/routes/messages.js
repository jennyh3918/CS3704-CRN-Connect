// Created by Google Gemini
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Created by Codex
const ensureMember = async (userId, crn, res) => {
  const membership = await prisma.user_CRN_Room.findUnique({
    where: {
      user_id_crn: {
        user_id: userId,
        crn
      }
    }
  });

  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return null;
  }

  return membership;
};

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Send a message
router.post('/', authMiddleware, upload.array('attachments'), async (req, res) => {
  const { content, room_crn, parent_message_id } = req.body;
  const files = req.files;

  try {
    // Created by Codex
    const membership = await ensureMember(req.user.id, room_crn, res);
    if (!membership) return;

    const message = await prisma.message.create({
      data: {
        content,
        room_crn,
        user_id: req.user.id,
        parent_message_id: parent_message_id || null,
        attachments: {
          create: files.map(file => ({
            file_path: file.path,
            file_name: file.originalname,
            file_type: file.mimetype
          }))
        }
      },
      include: {
        user: true,
        attachments: true,
        reactions: true
      }
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(room_crn).emit('new_message', message);
    }

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// React to a message
router.post('/:id/react', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;

  try {
    // Created by Codex
    const existingMessage = await prisma.message.findUnique({
      where: { id },
      select: { room_crn: true }
    });

    if (!existingMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const membership = await ensureMember(req.user.id, existingMessage.room_crn, res);
    if (!membership) return;

    const reaction = await prisma.reaction.upsert({
      where: {
        message_id_user_id_emoji: {
          message_id: id,
          user_id: req.user.id,
          emoji
        }
      },
      update: {},
      create: {
        message_id: id,
        user_id: req.user.id,
        emoji
      }
    });

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        user: true,
        attachments: true,
        reactions: {
          include: {
            user: true
          }
        }
      }
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(message.room_crn).emit('message_updated', message);
    }

    res.json(reaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to react to message' });
  }
});

module.exports = router;
