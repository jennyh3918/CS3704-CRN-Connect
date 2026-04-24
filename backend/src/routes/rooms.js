// Created by Google Gemini
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Get all rooms the user has joined (with latest message and color)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userWithRooms = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        rooms: {
          include: {
            room: {
              include: {
                messages: {
                  orderBy: { created_at: 'desc' },
                  take: 1,
                  include: {
                    user: {
                      select: { username: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithRooms) return res.json([]);

    const formattedRooms = userWithRooms.rooms.map(ur => ({
      crn: ur.room.crn,
      course_name: ur.room.course_name,
      color: ur.color,
      latestMessage: ur.room.messages[0] ? {
        content: ur.room.messages[0].content,
        created_at: ur.room.messages[0].created_at,
        user: ur.room.messages[0].user
      } : null
    }));

    res.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms', details: error.message });
  }
});

// Join a CRN room
router.post('/join', authMiddleware, async (req, res) => {
  const { crn, course_name } = req.body;
  if (!crn) {
    return res.status(400).json({ error: 'CRN is required' });
  }
  try {
    // Ensure room exists
    await prisma.cRN_Room.upsert({
      where: { crn },
      update: {},
      create: { crn, course_name: course_name || `Room ${crn}` }
    });

    // Check for existing association
    const existing = await prisma.user_CRN_Room.findFirst({
      where: { user_id: req.user.id, crn }
    });

    if (!existing) {
      await prisma.user_CRN_Room.create({
        data: {
          user_id: req.user.id,
          crn,
          color: "#3b82f6" // Default color
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room', details: error.message });
  }
});

// Get room details
router.get('/:crn', authMiddleware, async (req, res) => {
  const { crn } = req.params;
  try {
    const room = await prisma.cRN_Room.findUnique({
      where: { crn }
    });
    res.json(room);
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room', details: error.message });
  }
});

// Update room color preference
router.patch('/:crn/color', authMiddleware, async (req, res) => {
  const { crn } = req.params;
  const { color } = req.body;
  
  if (!color) {
    return res.status(400).json({ error: 'Color is required' });
  }

  try {
    // Use correct composite key syntax: user_id_crn
    const updated = await prisma.user_CRN_Room.update({
      where: {
        user_id_crn: {
          user_id: req.user.id,
          crn: crn
        }
      },
      data: { color }
    });

    res.json({ success: true, color: updated.color });
  } catch (error) {
    console.error('Error updating color:', error);
    res.status(500).json({ error: 'Failed to update color', details: error.message });
  }
});

// Leave a room
router.delete('/:crn', authMiddleware, async (req, res) => {
  const { crn } = req.params;
  try {
    await prisma.user_CRN_Room.delete({
      where: {
        user_id_crn: {
          user_id: req.user.id,
          crn: crn
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room', details: error.message });
  }
});

// Get messages for a CRN room
router.get('/:crn/messages', authMiddleware, async (req, res) => {
  const { crn } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { room_crn: crn },
      include: {
        user: true,
        attachments: true,
        reactions: true
      },
      orderBy: { created_at: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// Get users in a CRN room
router.get('/:crn/users', authMiddleware, async (req, res) => {
  const { crn } = req.params;
  try {
    const roomWithUsers = await prisma.cRN_Room.findUnique({
      where: { crn },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    });
    res.json(roomWithUsers ? roomWithUsers.users.map(u => u.user) : []);
  } catch (error) {
    console.error('Error fetching room users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

module.exports = router;
