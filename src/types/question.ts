export enum QuestionType {
  SingleChoice = 'single',
  MultipleChoice = 'multiple',
  TrueFalse = 'truefalse'
}

export interface Option {
  id: string;
  text?: string;
  image?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  image?: string;
  options: Option[];
  answer: string | string[];
  explanation: string;
}

export interface Paper {
  id: string;
  name: string;
  questions: Question[];
}

export interface UserAnswer {
  questionId: string;
  answer: string | string[];
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
