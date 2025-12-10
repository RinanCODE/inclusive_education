const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer();
const { promisePool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get AI recommendations
router.get('/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify user has access (students can only access their own, admins can access all)
    if (req.user.role === 'student' && parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Forward request to Python AI service
    const aiResponse = await axios.get(
      `${process.env.AI_SERVICE_URL}/recommendations/${userId}`,
      { timeout: 10000 }
    );

    res.json(aiResponse.data);

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('AI service unavailable:', error.message);
      
      // Fallback to basic recommendations
      const [recommendations] = await promisePool.query(`
        SELECT 
          c.id as course_id,
          c.title,
          c.description,
          c.category,
          c.difficulty_level,
          COUNT(ce.id) as popularity
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.is_published = TRUE
        GROUP BY c.id
        ORDER BY popularity DESC
        LIMIT 5
      `);

      return res.json({
        recommendations: recommendations.map(r => ({
          course_id: r.course_id,
          title: r.title,
          description: r.description,
          reason: 'Popular course recommendation',
          confidence: 0.7
        })),
        source: 'fallback'
      });
    }

    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Archive current chat history for the authenticated user
router.post('/chatbot/archive', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Move all conversations for this user to archive
    const [result] = await promisePool.query(
      `INSERT INTO chatbot_conversations_archive (user_id, message, response, context_data, original_timestamp)
       SELECT user_id, message, response, context_data, timestamp
       FROM chatbot_conversations
       WHERE user_id = ?`,
      [userId]
    );

    // Delete moved rows from active table
    await promisePool.query(
      `DELETE FROM chatbot_conversations WHERE user_id = ?`,
      [userId]
    );

    res.json({ archived: result.affectedRows || 0 });
  } catch (error) {
    console.error('Archive chat history error:', error);
    res.status(500).json({ error: 'Failed to archive chat history' });
  }
});

// Get archived chat history for the authenticated user
router.get('/chatbot/archive', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;

    const [rows] = await promisePool.query(
      `SELECT id, message, response, original_timestamp, archived_at
       FROM chatbot_conversations_archive
       WHERE user_id = ?
       ORDER BY archived_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    // Return oldest-first for chronological rendering
    res.json({ archived: rows.slice().reverse() });
  } catch (error) {
    console.error('Get archived chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve archived chat history' });
  }
});

// Summarize text or uploaded file (pdf/txt)
router.post('/summarize', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Expect multipart/form-data or JSON with text
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const form = new FormData();
      if (req.file) {
        form.append('file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });
      }
      if (req.body && req.body.text) form.append('text', req.body.text);
      const aiResp = await axios.post(`${process.env.AI_SERVICE_URL}/summarize`, form, {
        headers: form.getHeaders(),
        timeout: 20000
      });
      return res.json(aiResp.data);
    } else {
      const { text } = req.body || {};
      if (!text) return res.status(400).json({ error: 'text is required' });
      const form = new FormData();
      form.append('text', text);
      const aiResp = await axios.post(`${process.env.AI_SERVICE_URL}/summarize`, form, {
        headers: form.getHeaders(),
        timeout: 20000
      });
      return res.json(aiResp.data);
    }
  } catch (error) {
    console.error('Summarize proxy error:', error.message);
    res.status(500).json({ error: 'Failed to summarize content' });
  }
});

// Get learning path
router.get('/learning-path', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const aiResponse = await axios.get(
      `${process.env.AI_SERVICE_URL}/learning-path/${userId}`,
      { timeout: 10000 }
    );
    res.json(aiResponse.data);
  } catch (error) {
    console.error('AI learning path error:', error.message);
    res.status(500).json({ error: 'Failed to get learning path' });
  }
});

// Get full recommendations bundle
router.get('/full-recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const aiResponse = await axios.get(
      `${process.env.AI_SERVICE_URL}/full-recommendations/${userId}`,
      { timeout: 10000 }
    );
    res.json(aiResponse.data);
  } catch (error) {
    console.error('AI full recommendations error:', error.message);
    res.status(500).json({ error: 'Failed to get full recommendations' });
  }
});

// Chat with AI tutor
router.post('/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Forward to Python AI service
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/chatbot`,
        {
          user_id: userId,
          message,
          context
        },
        { timeout: 15000 }
      );

      // Log conversation
      await promisePool.query(
        `INSERT INTO chatbot_conversations (user_id, message, response, context_data)
         VALUES (?, ?, ?, ?)`,
        [userId, message, aiResponse.data.response, JSON.stringify(context || {})]
      );

      res.json(aiResponse.data);

    } catch (aiError) {
      console.error('AI chatbot service error:', aiError.message);

      // Fallback response
      const fallbackResponse = generateFallbackResponse(message);

      await promisePool.query(
        `INSERT INTO chatbot_conversations (user_id, message, response, context_data)
         VALUES (?, ?, ?, ?)`,
        [userId, message, fallbackResponse, JSON.stringify({ fallback: true })]
      );

      res.json({
        response: fallbackResponse,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get chat history
router.get('/chatbot/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const [conversations] = await promisePool.query(
      `SELECT id, message, response, timestamp
       FROM chatbot_conversations
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json({ conversations: conversations.reverse() });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// Simple fallback response generator
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI learning assistant. How can I help you today?";
  }

  if (lowerMessage.includes('help')) {
    return "I can help you with:\n- Course recommendations\n- Learning tips\n- Answering questions about your studies\n- Explaining concepts\n\nWhat would you like to know?";
  }

  if (lowerMessage.includes('course') || lowerMessage.includes('learn')) {
    return "I can recommend courses based on your interests and progress. What subject are you interested in learning?";
  }

  if (lowerMessage.includes('thank')) {
    return "You're welcome! Feel free to ask if you need anything else.";
  }

  return "I understand you're asking about: '" + message + "'. While I'm processing your question, could you provide more details? The AI service will provide more comprehensive answers once it's fully connected.";
}

module.exports = router;
