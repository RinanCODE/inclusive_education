from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging

from services.recommendation_service import RecommendationService
from services.chatbot_service import ChatbotService
from database.db_connector import DatabaseConnector
import io
try:
    import PyPDF2
except Exception:
    PyPDF2 = None

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services
db = DatabaseConnector()
recommendation_service = RecommendationService(db)
chatbot_service = ChatbotService(db)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'service': 'AI Microservices',
        'version': os.getenv('MODEL_VERSION', '1.0.0')
    }), 200

@app.route('/recommendations/<int:user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    Get personalized course recommendations for a user
    
    Args:
        user_id: User ID to get recommendations for
        
    Returns:
        JSON with recommended courses
    """
    try:
        logger.info(f"Getting recommendations for user {user_id}")
        
        recommendations = recommendation_service.get_personalized_recommendations(user_id)
        
        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'source': 'ai_model'
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({
            'error': 'Failed to generate recommendations',
            'message': str(e)
        }), 500

@app.route('/chatbot', methods=['POST'])
def chatbot():
    """
    AI Chatbot endpoint for student queries
    
    Request body:
        - user_id: User ID
        - message: User's message
        - context: Optional context data
        
    Returns:
        JSON with chatbot response
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_id = data.get('user_id')
        message = data.get('message')
        context = data.get('context', {})
        
        logger.info(f"Chatbot query from user {user_id}: {message[:50]}...")
        
        response = chatbot_service.generate_response(user_id, message, context)
        
        return jsonify({
            'response': response,
            'source': 'ai_model'
        }), 200
        
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return jsonify({
            'error': 'Failed to generate response',
            'message': str(e)
        }), 500

@app.route('/analyze-performance', methods=['POST'])
def analyze_performance():
    """
    Analyze student performance and provide insights
    
    Request body:
        - user_id: User ID
        
    Returns:
        JSON with performance analysis
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        analysis = recommendation_service.analyze_student_performance(user_id)
        
        return jsonify(analysis), 200
        
    except Exception as e:
        logger.error(f"Performance analysis error: {str(e)}")
        return jsonify({
            'error': 'Failed to analyze performance',
            'message': str(e)
        }), 500

@app.route('/learning-path/<int:user_id>', methods=['GET'])
def learning_path(user_id):
    """Generate a dynamic learning path for a user"""
    try:
        logger.info(f"Generating learning path for user {user_id}")
        data = recommendation_service.generate_learning_path(user_id)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Learning path error: {str(e)}")
        return jsonify({'error': 'Failed to generate learning path', 'message': str(e)}), 500

@app.route('/full-recommendations/<int:user_id>', methods=['GET'])
def full_recommendations(user_id):
    """Return extended recommendations (lessons, readings, exercises, schedules, feedback)"""
    try:
        logger.info(f"Full recommendations for user {user_id}")
        data = recommendation_service.get_full_recommendations(user_id)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Full recommendations error: {str(e)}")
        return jsonify({'error': 'Failed to get full recommendations', 'message': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    """Summarize uploaded PDF/TXT or provided text."""
    try:
        text = None
        if 'text' in request.form and request.form.get('text'):
            text = request.form.get('text')
        elif 'file' in request.files:
            f = request.files['file']
            filename = (f.filename or '').lower()
            if filename.endswith('.txt'):
                text = f.read().decode('utf-8', errors='ignore')
            elif filename.endswith('.pdf'):
                if not PyPDF2:
                    return jsonify({'error': 'PDF support not installed on server'}), 400
                pdf_bytes = f.read()
                reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
                pages = []
                for page in reader.pages[:20]:
                    try:
                        pages.append(page.extract_text() or '')
                    except Exception:
                        continue
                text = '\n'.join(pages)
        if not text:
            return jsonify({'error': 'No text or file provided'}), 400

        # Naive summarization: take first N sentences and basic keywords
        sentences = [s.strip() for s in text.replace('\n', ' ').split('.') if s.strip()]
        summary = '. '.join(sentences[:5]) + ('.' if sentences[:5] else '')
        # Simple mock references/examples (placeholder for NLP model)
        references = [
            'https://www.khanacademy.org/ (General study resource)',
            'https://www.coursera.org/ (Courses overview)'
        ]
        examples = sentences[5:8]
        return jsonify({
            'summary': summary,
            'references': references,
            'examples': examples
        }), 200
    except Exception as e:
        logger.error(f"Summarize error: {str(e)}")
        return jsonify({'error': 'Failed to summarize', 'message': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info('=' * 50)
    logger.info('🤖 AI Microservices Starting')
    logger.info('=' * 50)
    logger.info(f'📡 Port: {port}')
    logger.info(f'🔧 Debug Mode: {debug}')
    logger.info(f'🗄️  Database: {os.getenv("DB_HOST")}')
    logger.info('=' * 50)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
