import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class ChatbotService:
    """AI Chatbot service for student queries"""
    
    def __init__(self, db_connector):
        self.db = db_connector
        self.intents = self._load_intents()
    
    def _load_intents(self) -> Dict:
        """
        Load chatbot intents and responses
        
        In production, this would use NLP models (BERT, GPT, etc.)
        For MVP, using rule-based pattern matching
        """
        return {
            'greeting': {
                'patterns': ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
                'responses': [
                    "Hello! I'm your AI learning assistant. How can I help you today?",
                    "Hi there! What would you like to learn about?",
                    "Hey! I'm here to help with your studies. What do you need?"
                ]
            },
            'course_inquiry': {
                'patterns': ['course', 'class', 'what should i learn', 'recommend', 'suggest'],
                'responses': [
                    "I can recommend courses based on your interests and progress. What subject are you interested in?",
                    "Let me help you find the perfect course. What topics interest you?",
                    "I have many course recommendations! Are you looking for beginner, intermediate, or advanced level?"
                ]
            },
            'help': {
                'patterns': ['help', 'what can you do', 'how does this work', 'assist'],
                'responses': [
                    "I can help you with:\n• Course recommendations\n• Study tips\n• Answering questions about your progress\n• Explaining concepts\n• Connecting you with peer mentors\n\nWhat would you like to know?",
                    "I'm here to support your learning journey! I can recommend courses, answer questions, provide study tips, and more. What do you need help with?"
                ]
            },
            'performance': {
                'patterns': ['how am i doing', 'my progress', 'my score', 'my performance', 'grades'],
                'responses': [
                    "Let me check your performance data...",
                    "I'll analyze your progress for you..."
                ]
            },
            'mentor': {
                'patterns': ['mentor', 'tutor', 'teacher', 'help me learn'],
                'responses': [
                    "You can connect with peer mentors through the Peer Collaboration section. They're experienced students ready to help!",
                    "Peer mentors are available to support your learning. Check your dashboard to see if you have an assigned mentor."
                ]
            },
            'study_tips': {
                'patterns': ['study tips', 'how to study', 'learning tips', 'study better'],
                'responses': [
                    "Here are some effective study tips:\n• Break study sessions into 25-30 minute chunks\n• Take regular breaks\n• Practice active recall\n• Teach concepts to others\n• Join study groups\n• Review material regularly",
                    "Effective learning strategies:\n• Set specific goals for each session\n• Use multiple learning methods (reading, videos, practice)\n• Connect new information to what you already know\n• Get enough sleep\n• Stay consistent with your schedule"
                ]
            },
            'motivation': {
                'patterns': ['motivation', 'encourage', 'give up', 'difficult', 'hard'],
                'responses': [
                    "Learning can be challenging, but you're making progress! Every expert was once a beginner. Keep going!",
                    "Remember why you started. Small steps lead to big achievements. You've got this!",
                    "Difficulty is a sign you're growing. Don't give up - reach out to your mentor or study group for support!"
                ]
            },
            'thanks': {
                'patterns': ['thank', 'thanks', 'appreciate'],
                'responses': [
                    "You're welcome! Happy to help anytime.",
                    "Glad I could help! Feel free to ask if you need anything else.",
                    "My pleasure! Good luck with your studies!"
                ]
            },
            'goodbye': {
                'patterns': ['bye', 'goodbye', 'see you', 'later'],
                'responses': [
                    "Goodbye! Happy learning!",
                    "See you later! Keep up the great work!",
                    "Bye! Come back anytime you need help."
                ]
            }
        }
    
    def generate_response(self, user_id: int, message: str, context: Dict = None) -> str:
        """
        Generate chatbot response to user message
        
        Args:
            user_id: User ID
            message: User's message
            context: Optional context data
            
        Returns:
            Chatbot response string
        """
        try:
            # Clean and normalize message
            clean_message = message.lower().strip()
            
            # Check for performance-related queries
            if self._match_intent(clean_message, 'performance'):
                return self._get_performance_response(user_id)
            
            # Match other intents
            for intent_name, intent_data in self.intents.items():
                if self._match_intent(clean_message, intent_name):
                    import random
                    return random.choice(intent_data['responses'])
            
            # Check for specific course questions
            if 'python' in clean_message or 'programming' in clean_message:
                return self._get_course_specific_response('programming', clean_message)
            
            if 'web' in clean_message or 'html' in clean_message or 'css' in clean_message:
                return self._get_course_specific_response('web', clean_message)
            
            # Default response with context awareness
            return self._generate_contextual_response(clean_message, context)
            
        except Exception as e:
            logger.error(f"Chatbot response generation error: {e}")
            return "I apologize, but I'm having trouble processing your request. Could you rephrase that?"
    
    def _match_intent(self, message: str, intent_name: str) -> bool:
        """Check if message matches an intent"""
        if intent_name not in self.intents:
            return False
        
        patterns = self.intents[intent_name]['patterns']
        return any(pattern in message for pattern in patterns)
    
    def _get_performance_response(self, user_id: int) -> str:
        """Generate response with user's performance data"""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_modules,
                    AVG(score) as avg_score,
                    SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM performance
                WHERE user_id = %s
            """
            result = self.db.execute_query(query, (user_id,))
            
            if not result or result[0]['total_modules'] == 0:
                return "You haven't completed any modules yet. Start learning to track your progress!"
            
            stats = result[0]
            avg_score = float(stats['avg_score']) if stats['avg_score'] else 0
            completed = stats['completed']
            total = stats['total_modules']
            
            response = f"Here's your progress summary:\n"
            response += f"• Completed modules: {completed}/{total}\n"
            response += f"• Average score: {avg_score:.1f}%\n"
            
            if avg_score >= 80:
                response += "\n🌟 Excellent work! You're doing great!"
            elif avg_score >= 60:
                response += "\n👍 Good progress! Keep it up!"
            else:
                response += "\n💪 Keep practicing! Consider reaching out to your mentor for help."
            
            return response
            
        except Exception as e:
            logger.error(f"Performance response error: {e}")
            return "I couldn't retrieve your performance data right now. Please try again later."
    
    def _get_course_specific_response(self, category: str, message: str) -> str:
        """Generate course-specific responses"""
        responses = {
            'programming': "Python is a great language to learn! It's beginner-friendly and widely used. I recommend starting with our 'Introduction to Programming' course. Would you like me to provide more details?",
            'web': "Web development is an exciting field! Our 'Web Development Fundamentals' course covers HTML, CSS, and JavaScript. It's perfect for beginners. Want to enroll?"
        }
        return responses.get(category, "That's an interesting topic! Let me find relevant courses for you.")
    
    def _generate_contextual_response(self, message: str, context: Optional[Dict]) -> str:
        """Generate contextual response when no intent matches"""
        # Check for question words
        if any(word in message for word in ['what', 'how', 'why', 'when', 'where', 'who']):
            return f"That's a great question about '{message}'. While I'm still learning, I can connect you with resources or your peer mentor for detailed answers. Would that help?"
        
        # Check for learning-related keywords
        if any(word in message for word in ['learn', 'understand', 'explain', 'teach']):
            return "I'd love to help you learn! Could you be more specific about what topic or concept you'd like to understand better?"
        
        # Default fallback
        return "I understand you're asking about: '" + message + "'. Could you provide more details or rephrase your question? I'm here to help with courses, study tips, and learning support!"
