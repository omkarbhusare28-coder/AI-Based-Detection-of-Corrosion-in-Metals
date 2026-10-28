export type ClassificationType = 'Corroded' | 'Non-corroded';
export type SeverityType = 'Mild' | 'Moderate' | 'Severe' | 'None';

export interface InspectionResult {
  id: string;
  is_metal_surface: boolean;
  classification: ClassificationType;
  confidence: number;
  severity: SeverityType;
  notes?: string;
  timestamp: string;
  imageUrl: string;
  thumbnailUrl: string;
  fileName?: string;
}

export interface AnalysisResponse {
  is_metal_surface: boolean;
  classification: ClassificationType;
  confidence: number;
  severity: SeverityType;
  notes?: string;
  timestamp: string;
  error?: string;
}
