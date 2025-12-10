const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { promisePool } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get current user's full profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await promisePool.query(
      'SELECT id, name, email, role, profile_picture, bio, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const [profiles] = await promisePool.query(
      'SELECT academic_background, learning_goals, accessibility_needs, preferences FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const [conf] = await promisePool.query(
      'SELECT subject, confidence, updated_at FROM subject_confidence WHERE user_id = ? ORDER BY subject',
      [userId]
    );

    res.json({
      user: users[0],
      profile: profiles[0] || null,
      subjectConfidence: conf
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Upsert profile basic info and preferences
router.put('/me',
  authenticateToken,
  [
    body('academic_background').optional().isString(),
    body('learning_goals').optional().isString(),
    body('accessibility_needs').optional().isString(),
    body('preferences').optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.user.id;
      const { academic_background, learning_goals, accessibility_needs, preferences } = req.body;

      // Ensure user_profiles row exists
      await promisePool.query(
        `INSERT INTO user_profiles (user_id) VALUES (?)
         ON DUPLICATE KEY UPDATE user_id = user_id`,
        [userId]
      );

      // Update provided fields
      await promisePool.query(
        `UPDATE user_profiles SET 
          academic_background = COALESCE(?, academic_background),
          learning_goals = COALESCE(?, learning_goals),
          accessibility_needs = COALESCE(?, accessibility_needs),
          preferences = COALESCE(?, preferences)
         WHERE user_id = ?`,
        [academic_background ?? null, learning_goals ?? null, accessibility_needs ?? null, preferences ? JSON.stringify(preferences) : null, userId]
      );

      res.json({ message: 'Profile updated' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Upsert subject confidence
router.post('/confidence',
  authenticateToken,
  [
    body('subject').isString().trim().isLength({ min: 1 }),
    body('confidence').isInt({ min: 0, max: 100 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.user.id;
      const { subject, confidence } = req.body;

      await promisePool.query(
        `INSERT INTO subject_confidence (user_id, subject, confidence)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE confidence = VALUES(confidence)`,
        [userId, subject, confidence]
      );

      res.status(201).json({ message: 'Confidence saved' });
    } catch (error) {
      console.error('Save confidence error:', error);
      res.status(500).json({ error: 'Failed to save confidence' });
    }
  }
);

// Log behavior/interaction event
router.post('/behavior',
  authenticateToken,
  [
    body('event_type').isString().trim().isLength({ min: 1 }),
    body('metadata').optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userId = req.user.id;
      const { event_type, metadata } = req.body;

      const [result] = await promisePool.query(
        `INSERT INTO behavior_events (user_id, event_type, metadata)
         VALUES (?, ?, ?)`,
        [userId, event_type, metadata ? JSON.stringify(metadata) : null]
      );

      res.status(201).json({ message: 'Event logged', id: result.insertId });
    } catch (error) {
      console.error('Log behavior error:', error);
      res.status(500).json({ error: 'Failed to log behavior' });
    }
  }
);

module.exports = router;
