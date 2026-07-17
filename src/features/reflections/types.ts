export type AnalysisConfidence = "high" | "medium" | "low";

export type ReflectionObservation = {
  text: string;
  evidence: string;
  confidence: AnalysisConfidence;
};

export type LearningIssue = {
  title: string;
  description: string;
  evidence: string;
  confidence: AnalysisConfidence;
};

export type DiagnosticQuestion = {
  id: string;
  question: string;
  options: string[];
  allowUnsure: boolean;
};

export type LessonRescueStep = {
  title: string;
  instruction: string;
  durationMinutes: number;
};

export type LessonRescue = {
  durationMinutes: 5 | 10 | 15;
  objective: string;
  materials: string[];
  steps: LessonRescueStep[];
  alternativeExplanation: string;
  exitQuestions: string[];
};

export type ReflectionAnalysis = {
  summary: string;
  observations: ReflectionObservation[];
  learningIssues: LearningIssue[];
  diagnosticQuestions: DiagnosticQuestion[];
  lessonRescue: LessonRescue;
  /** Metadata ditambah oleh route; model tidak perlu menjana medan ini. */
  id?: string;
  classId?: string;
  mode?: "demo" | "ai";
};

export type AnalyzeRequest = {
  classId: string;
  transcript: string;
};

export type AnalyzeReflectionRequest = AnalyzeRequest;

export type ApiErrorResponse = {
  error: string;
  details?: Record<string, string>;
};
