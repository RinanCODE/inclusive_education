const mysql = require('mysql2/promise');
require('dotenv').config();

(async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('📚 Seeding courses/modules if missing...');

    const [[{ cnt: courseCount }]] = await conn.query('SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = "courses"', [process.env.DB_NAME]);
    if (!courseCount) {
      console.log('⚠️  Required tables not found. Run migrate.js first.');
      process.exit(1);
    }

    const [[{ total: coursesTotal }]] = await conn.query('SELECT COUNT(*) AS total FROM courses');
    if (coursesTotal > 0) {
      console.log(`✅ Courses already present (${coursesTotal}). Skipping.`);
      process.exit(0);
    }

    // Insert sample courses
    const [courseResult] = await conn.query(
      `INSERT INTO courses (title, description, category, difficulty_level, estimated_hours, created_by, is_published)
       VALUES 
       (?,?,?,?,?, NULL, TRUE),
       (?,?,?,?,?, NULL, TRUE),
       (?,?,?,?,?, NULL, TRUE)`,
      [
        'Introduction to Programming', 'Learn the basics of programming with Python', 'Computer Science', 'beginner', 20,
        'Web Development Fundamentals', 'HTML, CSS, and JavaScript basics', 'Web Development', 'beginner', 30,
        'Data Structures and Algorithms', 'Essential CS concepts for problem solving', 'Computer Science', 'intermediate', 40
      ]
    );

    // Fetch inserted course IDs in order
    const [courses] = await conn.query('SELECT id, title FROM courses ORDER BY id ASC LIMIT 3');
    const idMap = Object.fromEntries(courses.map(c => [c.title, c.id]));

    // Insert sample modules
    await conn.query(
      `INSERT INTO modules (course_id, title, content, module_order, duration_minutes) VALUES
       (?, 'Getting Started with Python', 'Introduction to Python syntax and basic concepts', 1, 45),
       (?, 'Variables and Data Types', 'Understanding variables, strings, numbers, and booleans', 2, 60),
       (?, 'Control Flow', 'If statements, loops, and conditional logic', 3, 75),
       (?, 'HTML Basics', 'Structure of web pages with HTML5', 1, 50),
       (?, 'CSS Styling', 'Making websites beautiful with CSS', 2, 60),
       (?, 'JavaScript Introduction', 'Adding interactivity to web pages', 3, 70)`,
      [
        idMap['Introduction to Programming'],
        idMap['Introduction to Programming'],
        idMap['Introduction to Programming'],
        idMap['Web Development Fundamentals'],
        idMap['Web Development Fundamentals'],
        idMap['Web Development Fundamentals']
      ]
    );

    console.log('✅ Seeded sample courses and modules');
    process.exit(0);
  } catch (e) {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
