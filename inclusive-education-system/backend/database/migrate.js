const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    const dbName = process.env.DB_NAME;

    if (dbName) {
      // Connect directly to the configured application database
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: dbName,
        multipleStatements: true
      });
      console.log(`📦 Connected to database '${dbName}'`);

      // Create only the missing tables/indexes safely (non-destructive)
      console.log('🔄 Applying safe, incremental migrations...');

      // Ensure users table exists (warn if missing)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('student','peer_mentor','admin') NOT NULL DEFAULT 'student',
          profile_picture VARCHAR(500),
          bio TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT TRUE,
          INDEX idx_email (email),
          INDEX idx_role (role)
        ) ENGINE=InnoDB;
      `);

      // Courses table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
          estimated_hours INT,
          thumbnail_url VARCHAR(500),
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_published BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_category (category),
          INDEX idx_difficulty (difficulty_level)
        ) ENGINE=InnoDB;
      `);

      // Modules table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS modules (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          module_order INT NOT NULL,
          video_url VARCHAR(500),
          transcript TEXT,
          duration_minutes INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          INDEX idx_course_id (course_id),
          INDEX idx_module_order (module_order)
        ) ENGINE=InnoDB;
      `);

      // user_profiles table (missing in your DB caused registration failure)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          academic_background TEXT,
          learning_goals TEXT,
          accessibility_needs TEXT,
          preferences JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_profiles_user_id (user_id)
        ) ENGINE=InnoDB;
      `);

      // subject_confidence table (used by profile and peer matching routes)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS subject_confidence (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          subject VARCHAR(100) NOT NULL,
          confidence TINYINT UNSIGNED NOT NULL CHECK (confidence <= 100),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_subject (user_id, subject),
          INDEX idx_conf_user (user_id)
        ) ENGINE=InnoDB;
      `);

      // Chatbot archived conversations (used by new archive feature)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS chatbot_conversations_archive (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          context_data JSON,
          original_timestamp TIMESTAMP NULL,
          archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_archive_user (user_id),
          INDEX idx_archive_time (archived_at)
        ) ENGINE=InnoDB;
      `);

      console.log('✅ Incremental migrations applied successfully');
    } else {
      // Fallback: No DB_NAME provided, run full schema (creates DB and all tables)
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
      });
      console.log('📦 Connected to MySQL server');

      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('🔄 Running full database schema...');
      await connection.query(schema);
      console.log('✅ Database schema created successfully');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
runMigration();
