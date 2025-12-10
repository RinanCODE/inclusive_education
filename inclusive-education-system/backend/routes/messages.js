const express = require('express');
const router = express.Router();
const { promisePool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get messages for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationWith } = req.query;

    let query, params;

    if (conversationWith) {
      // Get conversation between two users
      query = `
        SELECT 
          m.id, m.content, m.is_read, m.timestamp,
          m.sender_id, m.receiver_id,
          sender.name as sender_name,
          receiver.name as receiver_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp ASC
      `;
      params = [userId, conversationWith, conversationWith, userId];
    } else {
      // Get all messages for user
      query = `
        SELECT 
          m.id, m.content, m.is_read, m.timestamp,
          m.sender_id, m.receiver_id,
          sender.name as sender_name,
          receiver.name as receiver_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.timestamp DESC
        LIMIT 100
      `;
      params = [userId, userId];
    }

    const [messages] = await promisePool.query(query, params);

    res.json({ messages });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// Get conversation list (unique users)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await promisePool.query(`
      SELECT DISTINCT
        u.id, u.name, u.email, u.role, u.profile_picture,
        (SELECT content FROM messages 
         WHERE (sender_id = u.id AND receiver_id = ?) 
            OR (sender_id = ? AND receiver_id = u.id)
         ORDER BY timestamp DESC LIMIT 1) as last_message,
        (SELECT timestamp FROM messages 
         WHERE (sender_id = u.id AND receiver_id = ?) 
            OR (sender_id = ? AND receiver_id = u.id)
         ORDER BY timestamp DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT sender_id FROM messages WHERE receiver_id = ?
        UNION
        SELECT DISTINCT receiver_id FROM messages WHERE sender_id = ?
      )
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId, userId, userId]);

    res.json({ conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// Send a message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    // Verify receiver exists
    const [receiver] = await promisePool.query(
      'SELECT id FROM users WHERE id = ?',
      [receiverId]
    );

    if (receiver.length === 0) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content]
    );

    // Get the created message
    const [messages] = await promisePool.query(`
      SELECT 
        m.id, m.content, m.is_read, m.timestamp,
        m.sender_id, m.receiver_id,
        sender.name as sender_name,
        receiver.name as receiver_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Message sent successfully',
      data: messages[0]
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.body;

    await promisePool.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [senderId, userId]
    );

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await promisePool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ unreadCount: result[0].count });

  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
