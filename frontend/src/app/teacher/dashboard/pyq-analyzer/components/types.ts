export interface OriginalQuestion {
  questionText?: string;
  marks?: string | number;
  metadata?: {
    concept?: string;
    difficulty?: string;
    topic?: string;
  };
  images?: any[];
}

export interface SimilarityResult {
  originalQuestion?: OriginalQuestion;
  sourceQuestionId?: string;
  matchType: 'EXACT' | 'CONCEPT_REPEATED' | 'NEW';
  overallSimilarity: number;
  targetQuestionId?: string;
  matchedQuestionText?: string;
  matchedQuestionImages?: any[];
  reasoning: string;
  conceptMatch?: number;
  logicMatch?: number;
  formulaMatch?: number;
  patternMatch?: number;
  valuesMatch?: number;
}

export interface AnalysisReport {
  analysisId?: string;
  summary?: {
    averageSimilarity?: number;
    matchCounts?: {
      EXACT?: number;
      CONCEPT_REPEATED?: number;
      NEW?: number;
    };
  };
  analytics?: {
    overallRepetitionPercent?: number;
    fullyRepeated?: number;
    conceptRepeated?: number;
    newQuestions?: number;
  };
  similarityResults?: SimilarityResult[];
}

export interface AnalysisHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  overallRepetition: number;
}
