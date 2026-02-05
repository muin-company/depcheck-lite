export interface AnalyzerOptions {
  cwd: string;
  ignore?: string[];
  dirs?: string[];
}

export interface AnalysisResult {
  unused: string[];
  used: string[];
  total: number;
}
