export interface BatchRow {
  id: number;
  batchNo: string;
  name: string;
  marketplace: string;
  status: string;
  totalCount: number;
  analyzedCount: number;
  recommendedCount: number;
  rejectedCount: number;
  createdAt: string;
  latestDecisionAction?: BatchDecisionAction | null;
}

export interface BatchDecisionAction {
  id: number;
  batchId: number;
  batchNo?: string;
  batchName?: string;
  actionType: string;
  conclusion: string | null;
  meetingType: string | null;
  status: string;
  dueAt: string | null;
  notifiedAt: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BatchDetail extends BatchRow {
  totalItems?: number;
  productDirection?: string | null;
  targetCategory?: string | null;
  remark?: string | null;
  createdBy?: number | null;
}

export interface ItemRow {
  id: number;
  asin: string;
  marketplace?: string;
  productTitle: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  analysisStatus: string;
  workflowStatus: string;
  marketScore: number | null;
  competitionScore: number | null;
  designScore: number | null;
  riskScore: number | null;
  opportunityScore: number | null;
  recommendation: string | null;
  recommendationReason: string | null;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  monthlySales: number | null;
  monthlyRevenue: number | null;
  bsr: number | null;
  sellers: number | null;
  variations: number | null;
  lqs: number | null;
  lastError: string | null;
}

export interface AnalysisSnapshot {
  id: number;
  itemId: number;
  source: string;
  payloadJson: unknown;
  createdAt: string;
}

export interface AnalysisReview {
  id: number;
  itemId: number;
  reviewerId: number | null;
  roundName: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  comment: string | null;
  createdAt: string;
}

export interface DesignEvaluation {
  id: number;
  itemId: number;
  status: string;
  targetUser: string | null;
  usageScenario: string | null;
  painPoints: string | null;
  designDirection: string | null;
  materialSuggestion: string | null;
  structureSuggestion: string | null;
  packageSuggestion: string | null;
  sellingPoints: string | null;
  reviewComment: string | null;
}

export interface SampleEvaluation {
  id: number;
  itemId: number;
  decision: string | null;
  targetPrice: number | null;
  estimatedCost: number | null;
  grossMargin: number | null;
  moq: number | null;
  supplier: string | null;
  sampleCost: number | null;
  sampleCycleDays: number | null;
  comment: string | null;
}

export interface ItemReport {
  item: ItemRow | null;
  snapshots: AnalysisSnapshot[];
  reviews: AnalysisReview[];
  designEvaluation: DesignEvaluation | null;
  sampleEvaluation: SampleEvaluation | null;
}

export interface BatchMetrics {
  rejectionReasonDistribution: Array<{ reason: string; count: number }>;
}

export interface ItemListFilters {
  keyword?: string;
  analysisStatus?: string;
  workflowStatus?: string;
  recommendation?: string;
  minOpportunityScore?: number | null;
  maxOpportunityScore?: number | null;
  operationPriority?: string;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
}

export interface SavedView {
  id: number;
  userId: number;
  moduleKey: string;
  viewName: string;
  viewConfigJson: string | null;
  isDefault: number;
  createdAt: string;
  updatedAt: string;
}
