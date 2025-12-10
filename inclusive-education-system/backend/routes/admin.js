const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { promisePool } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    
    let query = `
      SELECT 
        id, name, email, role, profile_picture, bio, 
        created_at, last_login, is_active
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await promisePool.query(query, params);

    res.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const [users] = await promisePool.query(
      'SELECT id, name, email, role, profile_picture, bio, created_at, last_login, is_active FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email exists
    const [existing] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await promisePool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, isActive, bio } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (typeof isActive === 'boolean') {
      updates.push('is_active = ?');
      params.push(isActive);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);

    const [result] = await promisePool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await promisePool.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const [courses] = await promisePool.query(`
      SELECT 
        c.*, 
        u.name as creator_name,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT ce.id) as enrollment_count
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({ courses });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// Create course
router.post('/courses', async (req, res) => {
  try {
    const { title, description, category, difficultyLevel, estimatedHours, thumbnailUrl } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [result] = await promisePool.query(
      `INSERT INTO courses 
       (title, description, category, difficulty_level, estimated_hours, thumbnail_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, difficultyLevel, estimatedHours, thumbnailUrl, req.user.id]
    );

    res.status(201).json({
      message: 'Course created successfully',
      courseId: result.insertId
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, category, difficultyLevel, estimatedHours, thumbnailUrl, isPublished } = req.body;

    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    if (difficultyLevel) {
      updates.push('difficulty_level = ?');
      params.push(difficultyLevel);
    }
    if (estimatedHours) {
      updates.push('estimated_hours = ?');
      params.push(estimatedHours);
    }
    if (thumbnailUrl !== undefined) {
      updates.push('thumbnail_url = ?');
      params.push(thumbnailUrl);
    }
    if (typeof isPublished === 'boolean') {
      updates.push('is_published = ?');
      params.push(isPublished);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(courseId);

    const [result] = await promisePool.query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully' });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    const [result] = await promisePool.query(
      'DELETE FROM courses WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Assign mentor to student
router.post('/mentor-assignments', async (req, res) => {
  try {
    const { mentorId, studentId, notes } = req.body;

    if (!mentorId || !studentId) {
      return res.status(400).json({ error: 'Mentor ID and Student ID are required' });
    }

    // Verify mentor role
    const [mentor] = await promisePool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [mentorId, 'peer_mentor']
    );

    if (mentor.length === 0) {
      return res.status(400).json({ error: 'Invalid mentor ID' });
    }

    // Verify student role
    const [student] = await promisePool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [studentId, 'student']
    );

    if (student.length === 0) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Check if assignment already exists
    const [existing] = await promisePool.query(
      'SELECT id FROM mentor_assignments WHERE mentor_id = ? AND student_id = ? AND status = ?',
      [mentorId, studentId, 'active']
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Active assignment already exists' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO mentor_assignments (mentor_id, student_id, assigned_by, notes) VALUES (?, ?, ?, ?)',
      [mentorId, studentId, req.user.id, notes]
    );

    res.status(201).json({
      message: 'Mentor assigned successfully',
      assignmentId: result.insertId
    });

  } catch (error) {
    console.error('Assign mentor error:', error);
    res.status(500).json({ error: 'Failed to assign mentor' });
  }
});

// Get all mentor assignments
router.get('/mentor-assignments', async (req, res) => {
  try {
    const [assignments] = await promisePool.query(`
      SELECT 
        ma.id, ma.status, ma.assigned_at, ma.notes,
        mentor.id as mentor_id, mentor.name as mentor_name, mentor.email as mentor_email,
        student.id as student_id, student.name as student_name, student.email as student_email,
        admin.name as assigned_by_name
      FROM mentor_assignments ma
      JOIN users mentor ON ma.mentor_id = mentor.id
      JOIN users student ON ma.student_id = student.id
      LEFT JOIN users admin ON ma.assigned_by = admin.id
      ORDER BY ma.assigned_at DESC
    `);

    res.json({ assignments });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to retrieve assignments' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [userStats] = await promisePool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count
      FROM users
      GROUP BY role
    `);

    const [courseStats] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_courses,
        SUM(CASE WHEN is_published = TRUE THEN 1 ELSE 0 END) as published_courses
      FROM courses
    `);

    const [enrollmentStats] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_enrollments,
        COUNT(DISTINCT user_id) as unique_students
      FROM course_enrollments
      WHERE status = 'active'
    `);

    const [moduleStats] = await promisePool.query(`
      SELECT COUNT(*) as total_modules FROM modules
    `);

    res.json({
      users: userStats,
      courses: courseStats[0],
      enrollments: enrollmentStats[0],
      modules: moduleStats[0]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

module.exports = router;
