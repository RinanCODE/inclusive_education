const express = require('express');
const router = express.Router();
const { promisePool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get all study groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await promisePool.query(`
      SELECT 
        sg.id, sg.name, sg.description, sg.max_members, sg.created_at,
        creator.name as creator_name,
        COUNT(sgm.user_id) as member_count,
        MAX(CASE WHEN sgm.user_id = ? THEN 1 ELSE 0 END) as is_member
      FROM study_groups sg
      JOIN users creator ON sg.created_by = creator.id
      LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
      WHERE sg.is_active = TRUE
      GROUP BY sg.id
      ORDER BY sg.created_at DESC
    `, [userId]);

    res.json({ groups });

  } catch (error) {
    console.error('Get study groups error:', error);
    res.status(500).json({ error: 'Failed to retrieve study groups' });
  }
});

// Get user's study groups
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await promisePool.query(`
      SELECT 
        sg.id, sg.name, sg.description, sg.max_members, sg.created_at,
        creator.name as creator_name,
        sgm.role as my_role,
        COUNT(members.user_id) as member_count
      FROM study_group_members sgm
      JOIN study_groups sg ON sgm.group_id = sg.id
      JOIN users creator ON sg.created_by = creator.id
      LEFT JOIN study_group_members members ON sg.id = members.group_id
      WHERE sgm.user_id = ? AND sg.is_active = TRUE
      GROUP BY sg.id
      ORDER BY sg.created_at DESC
    `, [userId]);

    res.json({ groups });

  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({ error: 'Failed to retrieve your study groups' });
  }
});

// Get study group details with members
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    // Get group info
    const [groups] = await promisePool.query(`
      SELECT 
        sg.id, sg.name, sg.description, sg.max_members, sg.created_at,
        creator.name as creator_name, creator.id as creator_id
      FROM study_groups sg
      JOIN users creator ON sg.created_by = creator.id
      WHERE sg.id = ? AND sg.is_active = TRUE
    `, [groupId]);

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Study group not found' });
    }

    // Get members
    const [members] = await promisePool.query(`
      SELECT 
        u.id, u.name, u.email, u.role as user_role, u.profile_picture,
        sgm.role as group_role, sgm.joined_at
      FROM study_group_members sgm
      JOIN users u ON sgm.user_id = u.id
      WHERE sgm.group_id = ?
      ORDER BY sgm.joined_at ASC
    `, [groupId]);

    // Check if current user is a member
    const isMember = members.some(m => m.id === userId);

    res.json({
      group: groups[0],
      members,
      isMember,
      memberCount: members.length
    });

  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ error: 'Failed to retrieve group details' });
  }
});

// Create a study group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, maxMembers } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO study_groups (name, description, created_by, max_members) VALUES (?, ?, ?, ?)',
      [name, description, userId, maxMembers || 10]
    );

    const groupId = result.insertId;

    // Add creator as moderator
    await promisePool.query(
      'INSERT INTO study_group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, userId, 'moderator']
    );

    res.status(201).json({
      message: 'Study group created successfully',
      groupId
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create study group' });
  }
});

// Join a study group
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    // Check if group exists and is active
    const [groups] = await promisePool.query(
      'SELECT id, max_members FROM study_groups WHERE id = ? AND is_active = TRUE',
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Study group not found' });
    }

    // Check if already a member
    const [existing] = await promisePool.query(
      'SELECT id FROM study_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Check if group is full
    const [memberCount] = await promisePool.query(
      'SELECT COUNT(*) as count FROM study_group_members WHERE group_id = ?',
      [groupId]
    );

    if (memberCount[0].count >= groups[0].max_members) {
      return res.status(400).json({ error: 'Study group is full' });
    }

    // Add member
    await promisePool.query(
      'INSERT INTO study_group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, userId, 'member']
    );

    res.status(201).json({ message: 'Joined study group successfully' });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join study group' });
  }
});

// Leave a study group
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    const [result] = await promisePool.query(
      'DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    res.json({ message: 'Left study group successfully' });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave study group' });
  }
});

module.exports = router;
