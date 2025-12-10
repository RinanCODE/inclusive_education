import pymysql
from pymysql import MySQLError as Error
from pymysql.cursors import DictCursor
import os
import logging

logger = logging.getLogger(__name__)

class DatabaseConnector:
    """Database connector for MySQL"""
    
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = int(os.getenv('DB_PORT', 3306))
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.database = os.getenv('DB_NAME', 'inclusive_education')
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            if self.connection is None or not getattr(self.connection, 'open', False):
                self.connection = pymysql.connect(
                    host=self.host,
                    port=self.port,
                    user=self.user,
                    password=self.password,
                    database=self.database,
                    cursorclass=DictCursor,
                    autocommit=True
                )
                logger.info("✅ Database connected successfully")
            return self.connection
        except Error as e:
            logger.error(f"❌ Database connection error: {e}")
            raise
    
    def _ensure_connection(self):
        """Ensure connection is alive; reconnect if needed."""
        if self.connection is None or not getattr(self.connection, 'open', False):
            self.connect()
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and getattr(self.connection, 'open', False):
            self.connection.close()
            logger.info("Database connection closed")
    
    def execute_query(self, query, params=None):
        """Execute a SELECT query and return results"""
        try:
            self._ensure_connection()
            connection = self.connection
            cursor = connection.cursor()
            if params is None:
                cursor.execute(query)
            else:
                cursor.execute(query, params)
            result = cursor.fetchall()
            cursor.close()
            return result
        except Error as e:
            logger.error(f"Query execution error: {e}")
            raise
    
    def execute_update(self, query, params=None):
        """Execute an INSERT/UPDATE/DELETE query"""
        try:
            self._ensure_connection()
            connection = self.connection
            cursor = connection.cursor()
            if params is None:
                cursor.execute(query)
            else:
                cursor.execute(query, params)
            try:
                connection.commit()
            except Exception:
                pass
            affected_rows = cursor.rowcount
            cursor.close()
            return affected_rows
        except Error as e:
            logger.error(f"Update execution error: {e}")
            if connection:
                connection.rollback()
            raise
    
    def __del__(self):
        """Cleanup on object destruction"""
        self.disconnect()
