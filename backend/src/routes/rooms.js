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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
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

    const userRoom = await prisma.user_CRN_Room.upsert({
      where: {
        user_id_crn: {
          user_id: req.user.id,
          crn
        }
      },
      update: {},
      create: {
        user_id: req.user.id,
        crn
      }
    });
    res.json(userRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join room' });
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Update room color preference
router.patch('/:crn/color', authMiddleware, async (req, res) => {
  const { crn } = req.params;
  const { color } = req.body;
  try {
    const updated = await prisma.user_CRN_Room.update({
      where: {
        user_id_crn: {
          user_id: req.user.id,
          crn
        }
      },
      data: { color }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update color' });
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
          crn
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to leave room' });
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
