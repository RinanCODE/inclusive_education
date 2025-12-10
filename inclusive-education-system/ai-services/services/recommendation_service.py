import logging
from typing import List, Dict
import random

logger = logging.getLogger(__name__)

class RecommendationService:
    """AI-powered course recommendation service"""
    
    def __init__(self, db_connector):
        self.db = db_connector
        self.confidence_threshold = 0.5
    
    def get_personalized_recommendations(self, user_id: int, limit: int = 5) -> List[Dict]:
        """
        Generate personalized course recommendations for a user
        
        This is a placeholder implementation using rule-based logic.
        In production, this would use ML models (collaborative filtering, content-based, etc.)
        
        Args:
            user_id: User ID to generate recommendations for
            limit: Maximum number of recommendations
            
        Returns:
            List of recommended courses with confidence scores
        """
        try:
            # Get user's performance history
            user_performance = self._get_user_performance(user_id)
            
            # Get user's enrolled courses
            enrolled_courses = self._get_enrolled_courses(user_id)
            enrolled_ids = [c['course_id'] for c in enrolled_courses]
            
            # Get user's interests based on completed modules
            user_interests = self._analyze_user_interests(user_id)
            
            # Get all available courses
            all_courses = self._get_available_courses()
            
            # Filter out already enrolled courses
            available_courses = [c for c in all_courses if c['id'] not in enrolled_ids]
            
            # Score each course
            scored_courses = []
            for course in available_courses:
                score = self._calculate_recommendation_score(
                    course, 
                    user_performance, 
                    user_interests
                )
                
                if score >= self.confidence_threshold:
                    scored_courses.append({
                        'course_id': course['id'],
                        'title': course['title'],
                        'description': course['description'],
                        'category': course['category'],
                        'difficulty_level': course['difficulty_level'],
                        'confidence': round(score, 2),
                        'reason': self._generate_recommendation_reason(course, user_interests)
                    })
            
            # Sort by confidence score and return top N
            scored_courses.sort(key=lambda x: x['confidence'], reverse=True)
            
            return scored_courses[:limit]
            
        except Exception as e:
            logger.error(f"Recommendation generation error: {e}")
            return []
    
    def _get_user_performance(self, user_id: int) -> List[Dict]:
        """Get user's performance records"""
        query = """
            SELECT p.*, m.course_id, c.category
            FROM performance p
            JOIN modules m ON p.module_id = m.id
            JOIN courses c ON m.course_id = c.id
            WHERE p.user_id = %s
            ORDER BY p.timestamp DESC
        """
        return self.db.execute_query(query, (user_id,))
    
    def _get_enrolled_courses(self, user_id: int) -> List[Dict]:
        """Get user's enrolled courses"""
        query = """
            SELECT course_id, progress_percentage, status
            FROM course_enrollments
            WHERE user_id = %s
        """
        return self.db.execute_query(query, (user_id,))
    
    def _get_available_courses(self) -> List[Dict]:
        """Get all published courses"""
        query = """
            SELECT id, title, description, category, difficulty_level, estimated_hours
            FROM courses
            WHERE is_published = TRUE
        """
        return self.db.execute_query(query)
    
    def _analyze_user_interests(self, user_id: int) -> Dict:
        """Analyze user interests based on performance"""
        performance = self._get_user_performance(user_id)
        
        if not performance:
            return {'categories': [], 'avg_score': 0}
        
        # Count categories
        category_counts = {}
        total_score = 0
        score_count = 0
        
        for record in performance:
            category = record.get('category', 'General')
            category_counts[category] = category_counts.get(category, 0) + 1
            
            if record.get('score'):
                total_score += float(record['score'])
                score_count += 1
        
        # Get top categories
        sorted_categories = sorted(
            category_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        avg_score = total_score / score_count if score_count > 0 else 0
        
        return {
            'categories': [cat for cat, _ in sorted_categories[:3]],
            'avg_score': avg_score
        }
    
    def _calculate_recommendation_score(
        self, 
        course: Dict, 
        user_performance: List[Dict],
        user_interests: Dict
    ) -> float:
        """
        Calculate recommendation score for a course
        
        This is a simplified scoring algorithm. In production, use ML models.
        """
        score = 0.5  # Base score
        
        # Category match bonus
        if course['category'] in user_interests.get('categories', []):
            score += 0.3
        
        # Difficulty level matching
        avg_score = user_interests.get('avg_score', 0)
        if avg_score >= 80 and course['difficulty_level'] in ['intermediate', 'advanced']:
            score += 0.15
        elif avg_score >= 60 and course['difficulty_level'] == 'intermediate':
            score += 0.2
        elif avg_score < 60 and course['difficulty_level'] == 'beginner':
            score += 0.2
        
        # Popularity bonus (simulated)
        score += random.uniform(0, 0.15)
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _generate_recommendation_reason(self, course: Dict, user_interests: Dict) -> str:
        """Generate human-readable recommendation reason"""
        reasons = []
        
        if course['category'] in user_interests.get('categories', []):
            reasons.append(f"matches your interest in {course['category']}")
        
        if course['difficulty_level'] == 'beginner':
            reasons.append("great for building foundational skills")
        elif course['difficulty_level'] == 'intermediate':
            reasons.append("perfect for expanding your knowledge")
        else:
            reasons.append("challenges you with advanced concepts")
        
        if not reasons:
            reasons.append("highly rated by other students")
        
        return "This course " + " and ".join(reasons) + "."
    
    def analyze_student_performance(self, user_id: int) -> Dict:
        """Analyze student performance and provide insights"""
        try:
            performance = self._get_user_performance(user_id)
            
            if not performance:
                return {
                    'message': 'No performance data available',
                    'stats': {}
                }
            
            # Calculate statistics
            scores = [float(p['score']) for p in performance if p.get('score')]
            completed = len([p for p in performance if p['completion_status'] == 'completed'])
            
            stats = {
                'total_modules': len(performance),
                'completed_modules': completed,
                'completion_rate': round(completed / len(performance) * 100, 2),
                'average_score': round(sum(scores) / len(scores), 2) if scores else 0,
                'highest_score': max(scores) if scores else 0,
                'lowest_score': min(scores) if scores else 0
            }
            
            # Generate insights
            insights = []
            if stats['average_score'] >= 80:
                insights.append("Excellent performance! You're mastering the material.")
            elif stats['average_score'] >= 60:
                insights.append("Good progress! Keep up the consistent effort.")
            else:
                insights.append("Consider reviewing challenging topics with your mentor.")
            
            if stats['completion_rate'] < 50:
                insights.append("Try to complete more modules to improve your learning pace.")
            
            # Compute interests for strong categories
            user_interests = self._analyze_user_interests(user_id)
            return {
                'stats': stats,
                'insights': insights,
                'strong_categories': user_interests.get('categories', [])[:2]
            }
            
        except Exception as e:
            logger.error(f"Performance analysis error: {e}")
            return {'error': str(e)}

    def generate_learning_path(self, user_id: int) -> Dict:
        """Generate a simple dynamic learning path for the user."""
        try:
            # Try to compute interests and performance; fall back gracefully if paramized queries fail
            try:
                interests = self._analyze_user_interests(user_id) or {}
            except Exception as e:
                logger.error(f"Interests analysis error (fallback to empty): {e}")
                interests = {}

            try:
                performance = self._get_user_performance(user_id)
            except Exception as e:
                logger.error(f"Performance fetch error (fallback to empty): {e}")
                performance = []

            completed_module_ids = {int(p['module_id']) for p in performance if p.get('completion_status') == 'completed'}

            # Pick modules from top-interest categories the user hasn't completed
            categories = interests.get('categories', []) or ['General']
            modules = []
            if categories:
                # Build a safe, quoted IN list to avoid driver param errors on some environments
                safe_cats = []
                for cat in categories:
                    if cat is None:
                        continue
                    # Basic sanitization: keep as string and escape single quotes
                    cat_str = str(cat).replace("'", "''")
                    safe_cats.append(f"'{cat_str}'")
                in_list = ','.join(safe_cats) if safe_cats else "'General'"
                query = f"""
                    SELECT m.id, m.title, m.module_order, m.duration_minutes, c.title as course_title, c.category
                    FROM modules m
                    JOIN courses c ON m.course_id = c.id
                    WHERE c.is_published = TRUE AND c.category IN ({in_list})
                    ORDER BY c.category, m.module_order ASC
                """
                modules = self.db.execute_query(query)
            # Fallback: if modules are still empty, pull the first few published modules regardless of category
            if not modules:
                query_fb = """
                    SELECT m.id, m.title, m.module_order, m.duration_minutes, c.title as course_title, c.category
                    FROM modules m
                    JOIN courses c ON m.course_id = c.id
                    WHERE c.is_published = TRUE
                    ORDER BY c.category, m.module_order ASC
                    LIMIT 6
                """
                modules = self.db.execute_query(query_fb)

            plan = []
            for mod in modules:
                if int(mod['id']) in completed_module_ids:
                    continue
                plan.append({
                    'module_id': mod['id'],
                    'title': mod['title'],
                    'course': mod['course_title'],
                    'category': mod['category'],
                    'recommended_duration_min': mod.get('duration_minutes') or 45,
                    'milestone': f"Complete '{mod['title']}' in {mod.get('duration_minutes') or 45} minutes"
                })
                if len(plan) >= 6:
                    break

            # Simple schedule suggestion: next 7 days
            schedule = []
            for i, item in enumerate(plan[:7]):
                schedule.append({
                    'day_offset': i,
                    'task': f"Study: {item['title']} ({item['course']})",
                    'duration_min': item['recommended_duration_min']
                })

            return {
                'categories': categories,
                'plan': plan,
                'schedule': schedule,
                'insights': [
                    'Focus on your strongest interest areas first.',
                    'Keep steady daily sessions of 30–60 minutes.'
                ]
            }
        except Exception as e:
            logger.error(f"Learning path generation error: {e}")
            return {'plan': [], 'schedule': [], 'error': str(e)}

    def get_full_recommendations(self, user_id: int) -> Dict:
        """Return extended recommendations (lessons, readings, exercises, schedules, feedback)."""
        try:
            base = self.get_personalized_recommendations(user_id)
            lessons = [
                {
                    'title': f"Lesson: {r['title']}",
                    'course_id': r['course_id'],
                    'difficulty': r['difficulty_level'],
                    'reason': r['reason']
                }
                for r in base
            ]
            readings = [
                {
                    'title': f"Reading: {r['title']} Overview",
                    'url': 'https://example.edu/resources/' + str(r['course_id'])
                } for r in base
            ]
            exercises = [
                {
                    'course_id': r['course_id'],
                    'difficulty': 'adaptive-' + r['difficulty_level'],
                    'count': 5
                } for r in base
            ]
            schedule = {
                'daily_minutes': 45,
                'days_per_week': 5,
                'note': 'Auto-adjusts based on progress.'
            }
            perf = self.analyze_student_performance(user_id)
            feedback = perf.get('insights', [
                'Keep practicing regularly.',
                'Review topics with lower scores.'
            ])

            return {
                'lessons': lessons,
                'readings': readings,
                'exercises': exercises,
                'schedule': schedule,
                'feedback': feedback
            }
        except Exception as e:
            logger.error(f"Full recommendations error: {e}")
            return {'lessons': [], 'readings': [], 'exercises': [], 'schedule': {}, 'feedback': [], 'error': str(e)}
