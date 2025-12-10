const express = require('express');
const router = express.Router();
const { promisePool } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Mentor dashboard summary
router.get('/dashboard', authenticateToken, authorizeRoles('peer_mentor'), async (req, res) => {
  try {
    const mentorId = req.user.id;

    const [[{ active_students }]] = await promisePool.query(
      `SELECT COUNT(*) AS active_students
       FROM mentor_assignments
       WHERE mentor_id = ? AND status = 'active'`,
      [mentorId]
    );

    const [[{ study_groups_managed }]] = await promisePool.query(
      `SELECT COUNT(*) AS study_groups_managed
       FROM study_groups
       WHERE created_by = ? AND is_active = TRUE`,
      [mentorId]
    );

    const [[{ total_messages }]] = await promisePool.query(
      `SELECT COUNT(*) AS total_messages
       FROM messages
       WHERE sender_id = ? OR receiver_id = ?`,
      [mentorId, mentorId]
    );

    const [recentConversations] = await promisePool.query(
      `SELECT m.id, m.content, m.timestamp, u.name as other_party_name
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY m.timestamp DESC
       LIMIT 10`,
      [mentorId, mentorId, mentorId]
    );

    res.json({
      activeStudents: Number(active_students) || 0,
      studyGroupsManaged: Number(study_groups_managed) || 0,
      totalMessages: Number(total_messages) || 0,
      recentConversations
    });
  } catch (error) {
    console.error('Mentor dashboard error:', error);
    res.status(500).json({ error: 'Failed to load mentor dashboard' });
  }
});

module.exports = router;
