const express = require('express');
const router = express.Router();
const { promisePool } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Basic peer matching based on shared subjects and similar confidence
router.get('/peers', authenticateToken, authorizeRoles('student', 'peer_mentor'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user's subjects and confidence
    const [mine] = await promisePool.query(
      `SELECT subject, confidence FROM subject_confidence WHERE user_id = ?`,
      [userId]
    );

    if (mine.length === 0) {
      // Fallback: return recent active users excluding self
      const [fallback] = await promisePool.query(
        `SELECT id, name, email, role FROM users WHERE id <> ? AND is_active = TRUE LIMIT 10`,
        [userId]
      );
      return res.json({ matches: fallback });
    }

    const subjects = mine.map(r => r.subject);
    const placeholders = subjects.map(() => '?').join(',');

    // Find others with overlapping subjects and similar confidence (+/- 20)
    const [candidates] = await promisePool.query(
      `SELECT u.id, u.name, u.email, u.role, sc.subject, sc.confidence
       FROM users u
       JOIN subject_confidence sc ON sc.user_id = u.id
       WHERE u.id <> ? AND u.is_active = TRUE AND sc.subject IN (${placeholders})
       LIMIT 200`,
      [userId, ...subjects]
    );

    // Score candidates
    const myMap = new Map(mine.map(r => [r.subject, r.confidence]));
    const scores = new Map();
    for (const c of candidates) {
      const key = c.id;
      const diff = Math.abs((myMap.get(c.subject) || 0) - c.confidence);
      const s = Math.max(0, 100 - diff); // higher is better
      scores.set(key, (scores.get(key) || 0) + s);
    }

    // Aggregate by user
    const byUser = new Map();
    for (const c of candidates) {
      if (!byUser.has(c.id)) byUser.set(c.id, { id: c.id, name: c.name, email: c.email, role: c.role, subjects: {} });
      const u = byUser.get(c.id);
      u.subjects[c.subject] = c.confidence;
    }

    const matches = Array.from(byUser.values())
      .map(u => ({ ...u, score: scores.get(u.id) || 0 }))
      .sort((a, b) => (b.score - a.score))
      .slice(0, 10);

    res.json({ matches });
  } catch (error) {
    console.error('Peer matching error:', error);
    res.status(500).json({ error: 'Failed to compute peer matches' });
  }
});

module.exports = router;
