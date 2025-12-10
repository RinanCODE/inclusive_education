const express = require('express');
const router = express.Router();
const axios = require('axios');
const { promisePool } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get student dashboard data
router.get('/dashboard', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get enrolled courses
    const [enrollments] = await promisePool.query(`
      SELECT 
        c.id, c.title, c.description, c.category, c.thumbnail_url,
        ce.progress_percentage, ce.status, ce.enrolled_at
      FROM course_enrollments ce
      JOIN courses c ON ce.course_id = c.id
      WHERE ce.user_id = ? AND ce.status = 'active'
      ORDER BY ce.enrolled_at DESC
    `, [userId]);

    // Get recent performance
    const [performance] = await promisePool.query(`
      SELECT 
        p.score, p.completion_status, p.timestamp,
        m.title as module_title,
        c.title as course_title
      FROM performance p
      JOIN modules m ON p.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.timestamp DESC
      LIMIT 10
    `, [userId]);

    // Get assigned mentor
    const [mentors] = await promisePool.query(`
      SELECT 
        u.id, u.name, u.email, u.profile_picture
      FROM mentor_assignments ma
      JOIN users u ON ma.mentor_id = u.id
      WHERE ma.student_id = ? AND ma.status = 'active'
      LIMIT 1
    `, [userId]);

    // Get study groups
    const [studyGroups] = await promisePool.query(`
      SELECT 
        sg.id, sg.name, sg.description,
        COUNT(sgm.user_id) as member_count
      FROM study_group_members sgm
      JOIN study_groups sg ON sgm.group_id = sg.id
      WHERE sgm.user_id = ? AND sg.is_active = TRUE
      GROUP BY sg.id
    `, [userId]);

    res.json({
      enrollments,
      recentPerformance: performance,
      mentor: mentors[0] || null,
      studyGroups,
      stats: {
        totalCourses: enrollments.length,
        completedModules: performance.filter(p => p.completion_status === 'completed').length,
        averageScore: performance.length > 0 
          ? (performance.reduce((sum, p) => sum + parseFloat(p.score || 0), 0) / performance.length).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get modules for a course with user's completion status
router.get('/courses/:courseId/modules', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);
    if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

    // Verify course exists (do not require published status for viewing modules)
    const [courses] = await promisePool.query(
      `SELECT id, title, category, difficulty_level, is_published FROM courses WHERE id = ?`,
      [courseId]
    );
    if (courses.length === 0) return res.status(404).json({ error: 'Course not found' });

    // Fetch modules and user's completion
    const [modules] = await promisePool.query(`
      SELECT 
        m.id, m.title, m.module_order, m.duration_minutes,
        COALESCE(MAX(CASE WHEN p.completion_status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(MAX(p.score), NULL) AS last_score
      FROM modules m
      LEFT JOIN performance p ON p.module_id = m.id AND p.user_id = ?
      WHERE m.course_id = ?
      GROUP BY m.id, m.title, m.module_order, m.duration_minutes
      ORDER BY m.module_order ASC
    `, [userId, courseId]);

    // Compute progress for the course
    const total = modules.length || 0;
    const done = modules.filter(m => m.completed === 1).length;
    const progress = total > 0 ? Number(((done / total) * 100).toFixed(2)) : 0;

    res.json({
      course: courses[0],
      modules,
      progress
    });
  } catch (error) {
    console.error('Get course modules error:', error);
    res.status(500).json({ error: 'Failed to retrieve modules' });
  }
});

// List available published courses for students
router.get('/courses', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const [courses] = await promisePool.query(`
      SELECT 
        c.id, c.title, c.description, c.category, c.difficulty_level, c.thumbnail_url,
        COALESCE(COUNT(DISTINCT m.id), 0) as module_count,
        COALESCE(COUNT(DISTINCT ce_all.id), 0) as enrollment_count,
        (CASE WHEN ce_me.id IS NULL THEN 0 ELSE 1 END) AS enrolled_by_me
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN course_enrollments ce_all ON c.id = ce_all.course_id
      LEFT JOIN course_enrollments ce_me ON c.id = ce_me.course_id AND ce_me.user_id = ?
      WHERE c.is_published = TRUE
      GROUP BY c.id, enrolled_by_me
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({ courses });
  } catch (error) {
    console.error('List courses error:', error);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// Get AI-powered recommendations
router.get('/recommendations', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Call AI service
    try {
      const aiResponse = await axios.get(
        `${process.env.AI_SERVICE_URL}/recommendations/${userId}`,
        { timeout: 5000 }
      );

      // Log recommendation
      if (aiResponse.data.recommendations) {
        for (const rec of aiResponse.data.recommendations) {
          await promisePool.query(`
            INSERT INTO ai_recommendations 
            (user_id, recommended_course_id, recommendation_reason, confidence_score)
            VALUES (?, ?, ?, ?)
          `, [userId, rec.course_id, rec.reason, rec.confidence]);
        }
      }

      res.json(aiResponse.data);

    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      
      // Fallback: Return popular courses
      const [popularCourses] = await promisePool.query(`
        SELECT 
          c.id, c.title, c.description, c.category, c.difficulty_level,
          COUNT(ce.id) as enrollment_count
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.is_published = TRUE
        GROUP BY c.id
        ORDER BY enrollment_count DESC
        LIMIT 5
      `);

      res.json({
        recommendations: popularCourses.map(course => ({
          course_id: course.id,
          title: course.title,
          description: course.description,
          reason: 'Popular course',
          confidence: 0.75
        })),
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get student performance records
router.get('/performance', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [performance] = await promisePool.query(`
      SELECT 
        p.id, p.score, p.completion_status, p.time_spent_minutes, p.timestamp,
        m.id as module_id, m.title as module_title,
        c.id as course_id, c.title as course_title
      FROM performance p
      JOIN modules m ON p.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.timestamp DESC
    `, [userId]);

    res.json({ performance });

  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

// Submit module completion
router.post('/performance', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId, score, completionStatus, timeSpentMinutes, notes } = req.body;

    const [result] = await promisePool.query(`
      INSERT INTO performance 
      (user_id, module_id, score, completion_status, time_spent_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, moduleId, score, completionStatus, timeSpentMinutes, notes]);

    // Update course progress
    const [moduleInfo] = await promisePool.query(
      'SELECT course_id FROM modules WHERE id = ?',
      [moduleId]
    );

    if (moduleInfo.length > 0) {
      const courseId = moduleInfo[0].course_id;
      
      // Calculate progress percentage
      const [totalModules] = await promisePool.query(
        'SELECT COUNT(*) as total FROM modules WHERE course_id = ?',
        [courseId]
      );

      const [completedModules] = await promisePool.query(`
        SELECT COUNT(DISTINCT module_id) as completed
        FROM performance p
        JOIN modules m ON p.module_id = m.id
        WHERE p.user_id = ? AND m.course_id = ? AND p.completion_status = 'completed'
      `, [userId, courseId]);

      const progressPercentage = (completedModules[0].completed / totalModules[0].total * 100).toFixed(2);

      await promisePool.query(`
        UPDATE course_enrollments 
        SET progress_percentage = ?
        WHERE user_id = ? AND course_id = ?
      `, [progressPercentage, userId, courseId]);
    }

    res.status(201).json({
      message: 'Performance recorded successfully',
      id: result.insertId
    });

  } catch (error) {
    console.error('Performance submission error:', error);
    res.status(500).json({ error: 'Failed to record performance' });
  }
});

// Enroll in a course
router.post('/enroll', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    // Check if already enrolled
    const [existing] = await promisePool.query(
      'SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO course_enrollments (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    );

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollmentId: result.insertId
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

module.exports = router;
