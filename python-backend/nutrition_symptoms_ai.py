"""
Nutrition & Symptoms AI Analysis
===============================
Advanced AI features for nutrition tracking and symptom-remedy matching
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json

class NutritionSymptomsAI:
    """AI-powered nutrition and symptom analysis."""
    
    def __init__(self):
        self.nutrition_models = {}
        self.symptom_models = {}
        self.remedy_database = self._load_remedy_database()
    
    def analyze_nutrition_patterns(self, nutrition_data: List[Dict]) -> Dict[str, Any]:
        """Analyze nutrition patterns and food-symptom correlations."""
        if not nutrition_data:
            return {"error": "No nutrition data available"}
        
        df = pd.DataFrame(nutrition_data)
        
        # Calculate nutrition metrics
        metrics = {
            'avg_calories': df['calories'].mean() if 'calories' in df else 0,
            'avg_protein': df['protein_g'].mean() if 'protein_g' in df else 0,
            'avg_carbs': df['carbs_g'].mean() if 'carbs_g' in df else 0,
            'avg_fat': df['fat_g'].mean() if 'fat_g' in df else 0,
            'avg_fiber': df['fiber_g'].mean() if 'fiber_g' in df else 0,
            'avg_sugar': df['sugar_g'].mean() if 'sugar_g' in df else 0,
            'caffeine_intake': df['caffeine_mg'].sum() if 'caffeine_mg' in df else 0,
            'meals_per_day': len(df) / max(1, df['date'].nunique()) if 'date' in df else 0
        }
        
        # Identify nutritional gaps
        gaps = self._identify_nutritional_gaps(metrics)
        
        # Food-symptom correlations
        correlations = self._analyze_food_symptom_correlations(df)
        
        # Generate recommendations
        recommendations = self._generate_nutrition_recommendations(metrics, gaps, correlations)
        
        return {
            'metrics': metrics,
            'nutritional_gaps': gaps,
            'food_symptom_correlations': correlations,
            'recommendations': recommendations
        }
    
    def predict_symptom_triggers(self, recent_meals: List[Dict], symptoms: List[Dict]) -> Dict[str, Any]:
        """Predict potential symptom triggers from recent meals."""
        if not recent_meals or not symptoms:
            return {"potential_triggers": [], "confidence": 0}
        
        # Analyze meal tags and symptoms
        meal_df = pd.DataFrame(recent_meals)
        symptom_df = pd.DataFrame(symptoms)
        
        # Extract common trigger foods
        trigger_foods = []
        confidence_scores = {}
        
        # Common GI triggers
        gi_triggers = ['dairy', 'gluten', 'spicy', 'alcohol', 'caffeine', 'high_fat', 'raw_vegetables']
        
        # Check for correlations
        if 'tags' in meal_df.columns and 'type' in symptom_df.columns:
            for trigger in gi_triggers:
                meals_with_trigger = meal_df[meal_df['tags'].apply(lambda x: trigger in x if isinstance(x, list) else False)]
                
                if len(meals_with_trigger) > 0:
                    # Check if symptoms appeared within 24 hours
                    symptom_count = len(symptom_df[symptom_df['type'] == 'gut'])
                    
                    if symptom_count > 0:
                        trigger_foods.append(trigger)
                        confidence_scores[trigger] = min(0.9, symptom_count / len(meals_with_trigger))
        
        return {
            'potential_triggers': trigger_foods,
            'confidence_scores': confidence_scores,
            'recommendations': self._get_trigger_avoidance_recommendations(trigger_foods)
        }
    
    def recommend_remedies(self, symptoms: List[Dict], user_history: Optional[List[Dict]] = None) -> List[Dict]:
        """Recommend remedies based on symptoms and user history."""
        if not symptoms:
            return []
        
        remedies = []
        
        for symptom in symptoms:
            symptom_type = symptom.get('type', '')
            severity = symptom.get('severity', 0)
            
            # Get remedies from database
            matching_remedies = [
                r for r in self.remedy_database 
                if symptom_type in r.get('conditions', [])
            ]
            
            # Sort by effectiveness
            if user_history:
                # Personalize based on user history
                for remedy in matching_remedies:
                    user_effectiveness = next(
                        (h['effectiveness'] for h in user_history if h['remedy_id'] == remedy['id']),
                        remedy['effectiveness_score']
                    )
                    remedy['personalized_score'] = user_effectiveness
                
                matching_remedies.sort(key=lambda x: x.get('personalized_score', 0), reverse=True)
            else:
                matching_remedies.sort(key=lambda x: x.get('effectiveness_score', 0), reverse=True)
            
            # Add top remedies
            remedies.extend(matching_remedies[:3])
        
        return remedies
    
    def analyze_symptom_patterns(self, symptoms: List[Dict]) -> Dict[str, Any]:
        """Analyze symptom patterns and predict flare-ups."""
        if not symptoms:
            return {"error": "No symptom data available"}
        
        df = pd.DataFrame(symptoms)
        
        # Group by type
        symptom_types = df.groupby('type')['severity'].agg(['mean', 'std', 'count']).to_dict('index')
        
        # Identify cyclical patterns
        patterns = self._identify_symptom_cycles(df)
        
        # Predict flare risk
        flare_risk = self._predict_flare_risk(df)
        
        return {
            'symptom_types': symptom_types,
            'patterns': patterns,
            'flare_risk': flare_risk,
            'recommendations': self._generate_symptom_management_recommendations(symptom_types, flare_risk)
        }
    
    def _identify_nutritional_gaps(self, metrics: Dict[str, float]) -> List[str]:
        """Identify nutritional deficiencies."""
        gaps = []
        
        # Protein
        if metrics.get('avg_protein', 0) < 50:
            gaps.append("Insufficient protein intake")
        
        # Fiber
        if metrics.get('avg_fiber', 0) < 25:
            gaps.append("Low fiber intake")
        
        # Excess sugar
        if metrics.get('avg_sugar', 0) > 50:
            gaps.append("High sugar consumption")
        
        # Excess caffeine
        if metrics.get('caffeine_intake', 0) > 400:
            gaps.append("Excessive caffeine intake")
        
        return gaps
    
    def _analyze_food_symptom_correlations(self, df: pd.DataFrame) -> List[Dict]:
        """Analyze correlations between foods and symptoms."""
        correlations = []
        
        # This would use actual data analysis
        # For now, return common patterns
        common_correlations = [
            {'food': 'dairy', 'symptom': 'gut', 'correlation': 0.6},
            {'food': 'gluten', 'symptom': 'gut', 'correlation': 0.5},
            {'food': 'spicy', 'symptom': 'gut', 'correlation': 0.7},
            {'food': 'caffeine', 'symptom': 'anxiety', 'correlation': 0.4},
            {'food': 'sugar', 'symptom': 'energy_crash', 'correlation': 0.5}
        ]
        
        return common_correlations
    
    def _generate_nutrition_recommendations(self, metrics: Dict, gaps: List[str], correlations: List[Dict]) -> List[str]:
        """Generate personalized nutrition recommendations."""
        recommendations = []
        
        # Address gaps
        if "Insufficient protein intake" in gaps:
            recommendations.append("Increase protein sources like lean meats, eggs, legumes")
        
        if "Low fiber intake" in gaps:
            recommendations.append("Add more whole grains, fruits, and vegetables to your diet")
        
        if "High sugar consumption" in gaps:
            recommendations.append("Reduce added sugars and opt for natural alternatives")
        
        if "Excessive caffeine intake" in gaps:
            recommendations.append("Limit caffeine to 400mg per day and avoid after 2 PM")
        
        # Address correlations
        high_corr = [c for c in correlations if c['correlation'] > 0.5]
        if high_corr:
            foods = [c['food'] for c in high_corr]
            recommendations.append(f"Consider eliminating or reducing: {', '.join(foods)}")
        
        return recommendations
    
    def _get_trigger_avoidance_recommendations(self, triggers: List[str]) -> List[str]:
        """Get recommendations for avoiding trigger foods."""
        recommendations = []
        
        for trigger in triggers:
            if trigger == 'dairy':
                recommendations.append("Try lactose-free or plant-based alternatives")
            elif trigger == 'gluten':
                recommendations.append("Opt for gluten-free grains like rice, quinoa, or corn")
            elif trigger == 'spicy':
                recommendations.append("Use mild herbs and spices instead of hot peppers")
            elif trigger == 'caffeine':
                recommendations.append("Switch to decaf or herbal teas")
            elif trigger == 'alcohol':
                recommendations.append("Stay hydrated and limit intake to special occasions")
        
        return recommendations
    
    def _identify_symptom_cycles(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Identify cyclical symptom patterns."""
        if 'date' not in df or len(df) < 14:
            return {'cycle_detected': False}
        
        # Convert dates
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        
        # Check for weekly patterns
        weekly_pattern = df.groupby('day_of_week')['severity'].mean()
        variation = weekly_pattern.std()
        
        return {
            'cycle_detected': variation > 1.5,
            'weekly_pattern': weekly_pattern.to_dict() if variation > 1.5 else {},
            'peak_days': weekly_pattern.nlargest(2).index.tolist() if variation > 1.5 else []
        }
    
    def _predict_flare_risk(self, df: pd.DataFrame) -> Dict[str, float]:
        """Predict risk of symptom flare-ups."""
        if len(df) < 7:
            return {'gut': 0.5, 'skin': 0.5, 'overall': 0.5}
        
        # Calculate recent severity trends
        recent_data = df.tail(7)
        
        risk_scores = {}
        for symptom_type in ['gut', 'skin', 'headache', 'fatigue']:
            type_data = recent_data[recent_data['type'] == symptom_type]
            
            if len(type_data) > 0:
                avg_severity = type_data['severity'].mean()
                trend = type_data['severity'].diff().mean()
                
                # Risk increases with high severity and upward trend
                risk = min(1.0, (avg_severity / 10) + max(0, trend / 5))
                risk_scores[symptom_type] = risk
            else:
                risk_scores[symptom_type] = 0.3  # Baseline risk
        
        risk_scores['overall'] = np.mean(list(risk_scores.values()))
        
        return risk_scores
    
    def _generate_symptom_management_recommendations(self, symptom_types: Dict, flare_risk: Dict) -> List[str]:
        """Generate symptom management recommendations."""
        recommendations = []
        
        # High risk recommendations
        if flare_risk.get('overall', 0) > 0.7:
            recommendations.append("Consider consulting with your healthcare provider about current symptoms")
            recommendations.append("Keep a detailed symptom diary to identify triggers")
        
        # Type-specific recommendations
        for symptom_type, stats in symptom_types.items():
            if stats['mean'] > 5:
                if symptom_type == 'gut':
                    recommendations.append("Follow a low-FODMAP diet and stay hydrated")
                elif symptom_type == 'skin':
                    recommendations.append("Use gentle, fragrance-free skincare products")
                elif symptom_type == 'headache':
                    recommendations.append("Manage stress and maintain regular sleep schedule")
                elif symptom_type == 'fatigue':
                    recommendations.append("Ensure adequate sleep and balanced nutrition")
        
        return recommendations
    
    def _load_remedy_database(self) -> List[Dict]:
        """Load remedy database."""
        # Default remedies database
        return [
            {
                'id': 1,
                'name': 'Peppermint Tea',
                'category': 'dietary',
                'conditions': ['gut', 'nausea'],
                'effectiveness_score': 7.5,
                'instructions': 'Drink 1-2 cups after meals'
            },
            {
                'id': 2,
                'name': 'Probiotic Supplement',
                'category': 'supplement',
                'conditions': ['gut', 'digestion'],
                'effectiveness_score': 8.0,
                'instructions': 'Take daily with food'
            },
            {
                'id': 3,
                'name': 'Aloe Vera Gel',
                'category': 'topical',
                'conditions': ['skin', 'inflammation'],
                'effectiveness_score': 7.0,
                'instructions': 'Apply to affected area 2-3 times daily'
            },
            {
                'id': 4,
                'name': 'Ginger Tea',
                'category': 'dietary',
                'conditions': ['gut', 'nausea', 'inflammation'],
                'effectiveness_score': 7.5,
                'instructions': 'Drink 2-3 cups daily'
            },
            {
                'id': 5,
                'name': 'Meditation',
                'category': 'lifestyle',
                'conditions': ['stress', 'anxiety', 'headache'],
                'effectiveness_score': 8.5,
                'instructions': 'Practice 10-15 minutes daily'
            },
            {
                'id': 6,
                'name': 'Omega-3 Supplement',
                'category': 'supplement',
                'conditions': ['inflammation', 'skin', 'mood'],
                'effectiveness_score': 7.8,
                'instructions': 'Take 1000mg daily with meals'
            },
            {
                'id': 7,
                'name': 'Chamomile Tea',
                'category': 'dietary',
                'conditions': ['stress', 'sleep', 'gut'],
                'effectiveness_score': 7.2,
                'instructions': 'Drink 1 cup before bedtime'
            },
            {
                'id': 8,
                'name': 'Light Exercise',
                'category': 'lifestyle',
                'conditions': ['stress', 'mood', 'energy'],
                'effectiveness_score': 8.7,
                'instructions': '30 minutes of moderate activity 5x per week'
            }
        ]