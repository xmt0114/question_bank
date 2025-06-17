export enum QuestionType {
  SingleChoice = 'single',
  MultipleChoice = 'multiple',
  TrueFalse = 'truefalse',
  HandsOn = 'handson'
}

export interface Option {
  id: string;
  text?: string;
  image?: string;
  images?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  image?: string;
  images?: string[];
  richContent?: string; // 富文本内容，用于实操题的图文混排
  options: Option[];
  answer: string | string[] | null;
  explanation: string;
}

// 组织（如中国计算机电子学会、全国青少年信息素养大赛）
export interface Organization {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

// 类别（如机器人技术、图形化编程、Python编程）
export interface Category {
  id: string;
  name: string;
  image?: string;
  description?: string;
  organizationId: string; // 关联到所属组织
}

// 级别（如一级/二级/三级或1-3年级/4-6年级/初中组）
export interface Level {
  id: string;
  name: string;
  description?: string;
  categoryId: string; // 关联到所属类别
}

// 试卷（如2024年12月初赛、2025年3月初赛）
export interface Paper {
  id: string;
  name: string;
  levelId: string; // 关联到所属级别
  questions: Question[];
}

export interface UserAnswer {
  questionId: string;
  answer: string | string[] | null;
  isCorrect: boolean;
  isAnswered: boolean;
}

export interface ExamResult {
  paperId: string;
  userAnswers: Record<string, UserAnswer>;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  startTime: Date;
  endTime?: Date;
}
