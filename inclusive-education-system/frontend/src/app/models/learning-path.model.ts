export interface LearningPathPlanItem {
  module_id: number;
  title: string;
  course: string;
  category: string;
  recommended_duration_min: number;
  milestone: string;
}

export interface LearningPathScheduleItem {
  day_offset: number;
  task: string;
  duration_min: number;
}

export interface LearningPathResponse {
  categories: string[];
  plan: LearningPathPlanItem[];
  schedule: LearningPathScheduleItem[];
  insights: string[];
  error?: string;
}
