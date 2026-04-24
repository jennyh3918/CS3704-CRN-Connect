// Created by Google Gemini
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Created by Codex
const getMembership = (userId, crn) =>
  prisma.user_CRN_Room.findUnique({
    where: {
      user_id_crn: {
        user_id: userId,
        crn
      }
    }
  });

const ensureMember = async (userId, crn, res) => {
  const membership = await getMembership(userId, crn);
  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return null;
  }
  return membership;
};

const ensureAdmin = async (userId, crn, res) => {
  const membership = await ensureMember(userId, crn, res);
  if (!membership) return null;
  if (!membership.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return membership;
};

const promoteNextAdminIfNeeded = async (crn) => {
  const adminCount = await prisma.user_CRN_Room.count({
    where: {
      crn,
      is_admin: true
    }
  });

  if (adminCount > 0) return;

  const nextAdmin = await prisma.user_CRN_Room.findFirst({
    where: { crn },
    orderBy: { joined_at: 'asc' }
  });

  if (!nextAdmin) return;

  await prisma.user_CRN_Room.update({
    where: {
      user_id_crn: {
        user_id: nextAdmin.user_id,
        crn
      }
    },
    data: { is_admin: true }
  });
};

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
    // Created by Codex
    const existingMembership = await getMembership(req.user.id, crn);
    if (existingMembership) {
      return res.json(existingMembership);
    }

    // Ensure room exists
    await prisma.cRN_Room.upsert({
      where: { crn },
      update: {},
      create: { crn, course_name: course_name || `Room ${crn}` }
    });

    const memberCount = await prisma.user_CRN_Room.count({
      where: { crn }
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
        crn,
        is_admin: memberCount === 0
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
    // Created by Codex
    const membership = await ensureMember(req.user.id, crn, res);
    if (!membership) return;

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
    // Created by Codex
    const membership = await ensureMember(req.user.id, crn, res);
    if (!membership) return;

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
    // Created by Codex
    const membership = await ensureMember(req.user.id, crn, res);
    if (!membership) return;

    await prisma.user_CRN_Room.delete({
      where: {
        user_id_crn: {
          user_id: req.user.id,
          crn
        }
      }
    });

    if (membership.is_admin) {
      await promoteNextAdminIfNeeded(crn);
    }

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
    // Created by Codex
    const membership = await ensureMember(req.user.id, crn, res);
    if (!membership) return;

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
    // Created by Codex
    const membership = await ensureMember(req.user.id, crn, res);
    if (!membership) return;

    const roomWithUsers = await prisma.cRN_Room.findUnique({
      where: { crn },
      include: {
        users: {
          orderBy: {
            joined_at: 'asc'
          },
          include: {
            user: true
          }
        }
      }
    });
    res.json({
      currentUserIsAdmin: membership.is_admin,
      users: roomWithUsers ? roomWithUsers.users.map(({ is_admin, user }) => ({
        ...user,
        is_admin
      })) : []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Created by Codex
// Remove a user from a CRN room
router.delete('/:crn/users/:userId', authMiddleware, async (req, res) => {
  const { crn, userId } = req.params;
  try {
    const adminMembership = await ensureAdmin(req.user.id, crn, res);
    if (!adminMembership) return;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Admins cannot remove themselves' });
    }

    const memberToRemove = await getMembership(userId, crn);
    if (!memberToRemove) {
      return res.status(404).json({ error: 'User is not in this room' });
    }

    await prisma.user_CRN_Room.delete({
      where: {
        user_id_crn: {
          user_id: userId,
          crn
        }
      }
    });

    if (memberToRemove.is_admin) {
      await promoteNextAdminIfNeeded(crn);
    }

    const io = req.app.get('socketio');
    if (io) {
      io.to(crn).emit('member_removed', {
        crn,
        userId
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

module.exports = router;
