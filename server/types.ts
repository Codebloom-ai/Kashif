export type Verdict = 'safe' | 'suspicious' | 'scam';

export interface RedFlag {
  flag: string;
  quote_from_message: string;
}

export interface GuardrailResult {
  verdict: Verdict;
  triggered_rules: string[];
  matched_keywords: string[];
  reasoning: string;
  forced: boolean;
}

export interface ScamShieldResponse {
  verdict: Verdict;
  llm_verdict: Verdict;
  guardrail_verdict: Verdict;
  guardrail_escalated: boolean;
  confidence: number;
  confidence_reason: string;
  matched_patterns: string[];
  red_flags: RedFlag[];
  explanation: string;
  what_to_do: string[];
  report_to: string[];
  transcription?: {
    sender?: string;
    channel?: string;
    links?: string[];
    raw_text: string;
  };
  provider_used: string;
  model_used: string;
  latency_ms: number;
  fallback_used: boolean;
  is_basic_check?: boolean;
  personalization_risk?: {
    detected: boolean;
    reason: string;
  };
  debug_info?: {
    raw_llm_json: any;
    guardrail: GuardrailResult;
    fallback_chain: string[];
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMImagePart {
  mimeType: string;
  base64Data: string;
}

export interface CallLLMParams {
  messages: LLMMessage[];
  images?: LLMImagePart[];
  jsonSchema?: boolean;
  temperature?: number;
  timeoutMs?: number;
}

export interface CallLLMResult {
  content: string;
  parsedJson: any | null;
  provider_used: string;
  model_used: string;
  latency_ms: number;
  fallback_used: boolean;
  fallback_chain: string[];
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

export interface UsageLogEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  latency_ms: number;
  status: 'success' | 'fallback_success' | 'failed';
  fallback_used: boolean;
  fallback_chain?: string[];
  endpoint: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
}

export interface ExposureImageAnalysis {
  image_index: number;
  image_name?: string;
  image_type: 'profile' | 'post' | 'story' | 'chat' | 'document' | 'other';
  extracted_text: {
    name?: string;
    username?: string;
    bio?: string;
    captions?: string;
    other_text?: string;
  };
  location_clues: Array<{
    clue: string;
    where_in_image: string;
    confidence: string;
  }>;
  documents_visible: Array<{
    type: string;
    where_in_image: string;
    legible: boolean;
  }>;
  people: {
    faces_count: number;
    children_present: boolean;
  };
  work_school_clues: string[];
  screens_or_reflections: string[];
  estimated_location: {
    guess: string;
    reasoning: string;
    confidence: number;
  };
  routine_clues: string[];
  exif_data?: {
    gps?: { latitude: number; longitude: number };
    timestamp?: string;
    make?: string;
    model?: string;
    has_exif: boolean;
    note: string;
  };
  thumbnail_warning?: boolean;
}

export interface LocationTimelineItem {
  timestamp: string;
  name: string;
  city?: string;
  lat?: number;
  lon?: number;
  source: string;
}

export interface FullExportData {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'generic';
  account: {
    username: string;
    full_name?: string;
    bio?: string;
    email?: string;
    phone?: string;
    created_at?: string;
    follower_count?: number;
    following_count?: number;
  };
  captions_history: Array<{ text: string; timestamp?: string; location_name?: string }>;
  comments_history: Array<{ text: string; timestamp?: string; to_account?: string }>;
  search_history: Array<{ query: string; timestamp?: string }>;
  location_timeline: LocationTimelineItem[];
  ad_interests: string[];
  total_posts_found: number;
  total_comments_found: number;
  total_searches_found: number;
  total_photos_found: number;
  analyzed_photos_count: number;
  raw_file_tree?: string[];
}

export interface PrePublishRecommendation {
  action: string;
  concrete_edit: string;
  category: string;
  impact: string;
}

export interface VideoMetadata {
  duration_sec: number;
  frames_extracted: number;
  transcript?: string;
  audio_findings?: string[];
  note: string;
}

export interface ExposureReport {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  images_analyzed: number;
  findings: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    detail: string;
    where_seen: string;
    weight_points: number;
  }>;
  attack_paths: Array<{
    title: string;
    description: string;
    exploited_clues: string[];
  }>;
  fix_checklist: Array<{
    priority: number;
    action: string;
    reason: string;
  }>;
  pre_publish_recommendations?: PrePublishRecommendation[];
  video_metadata?: VideoMetadata;
  is_pre_publish?: boolean;
  per_image_results: ExposureImageAnalysis[];
  provider_used: string;
  model_used: string;
  total_latency_ms: number;
  verified_via_email: boolean;
  claimed_username?: string;
  username_verified?: {
    username_visible: boolean;
    matches_claimed_username: boolean;
    confidence: number;
  };
  is_full_export?: boolean;
  export_platform?: 'instagram' | 'facebook' | 'tiktok';
  export_summary?: {
    total_posts: number;
    total_comments: number;
    total_searches: number;
    total_photos: number;
    photos_analyzed: number;
    account_created?: string;
  };
  location_timeline?: LocationTimelineItem[];
  search_history_highlights?: string[];
  comments_highlights?: Array<{ text: string; timestamp?: string; to_account?: string }>;
  ad_interests?: string[];
}

export interface SyntheticProfile {
  id: string;
  name: string;
  username: string;
  city: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  bio: string;
  posts: Array<{
    id: string;
    caption: string;
    image_svg: string;
    clues: string[];
  }>;
  profileCardSvg: string;
  profile_card_svg?: string;
  simulated_export?: FullExportData;
  ground_truth: {
    workplace?: string;
    school?: string;
    neighborhood?: string;
    city?: string;
    children_present: boolean;
    documents_exposed: boolean;
    exif_gps_present: boolean;
    expected_score_range: [number, number];
  };
}
