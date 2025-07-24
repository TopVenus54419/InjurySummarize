export const APP_CONFIG = {
  name: "Zinda Raw Analysis",
  version: "1.0.0",
  description: "AI-powered Incident Analysis and Legal Reporting Platform",
  maxFileSize: "32MB",
  supportedFileTypes: ["application/pdf"],
  maxTextLength: 3000,
  defaultTemperature: 0.3,
  maxTokens: 1000,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FILE_NOT_FOUND: "File not found",
  INVALID_FILE_TYPE: "Invalid file type. Please upload a PDF file.",
  UPLOAD_FAILED: "Upload failed",
  PROCESSING_FAILED: "Failed to process PDF file for incident analysis.",
  ANALYSIS_FAILED: "Failed to analyze incident report.",
  NETWORK_ERROR: "Network error occurred",
  VALIDATION_ERROR: "Validation error",
} as const;

export const SUCCESS_MESSAGES = {
  UPLOAD_COMPLETE: "Upload complete!",
  PDF_PROCESSED: "PDF processed successfully! Incident details extracted.",
  GENERATION_COMPLETE: "Incident analysis generated successfully!",
} as const;

// Sample data for Step One
export const SAMPLE_EPISODES = [
  "Law And Order CI S01E05",
  "Law And Order CI S01E06",
  "Law And Order CI S01E07",
  "Law And Order CI S01E08",
  "Law And Order CI S01E09",
  "Law And Order CI S01E10",
  "Law And Order CI S02E01",
  "Law And Order CI S02E02",
  "Law And Order CI S02E03",
  "Law And Order CI S02E04",
  "Law And Order CI S02E05",
  "Law And Order CI S02E06",
];

export const SAMPLE_GOALS = [
  "Attract new audience to legacy IP",
  "Increase brand awareness",
  "Drive engagement",
  "Generate leads",
  "Boost conversions",
  "Improve brand sentiment",
  "Expand market reach",
  "Strengthen brand loyalty",
];

export const SAMPLE_KPIS = [
  "Grow follow count",
  "Increase awareness",
  "Boost engagement rate",
  "Improve click-through rate",
  "Increase conversion rate",
  "Reduce cost per acquisition",
  "Improve brand sentiment score",
  "Increase time spent on content",
];

// Sample data for Step Two
export const GENDER_OPTIONS = ["Women", "Men", "All genders"];

export const ETHNICITY_OPTIONS = [
  "All ethnicities",
  "White",
  "Black or African American",
  "Hispanic or Latino",
  "Asian",
  "Native American",
  "Pacific Islander",
  "Middle Eastern",
  "Mixed race",
];

export const AGE_OPTIONS = [
  "13 to 17 years old",
  "18 to 24 years old",
  "25 to 34 years old",
  "35 to 44 years old",
  "45 to 54 years old",
  "55 to 64 years old",
  "65+ years old",
];

export const FANS_OF_OPTIONS = [
  "Drama",
  "Romance",
  "News",
  "Comedy",
  "Action",
  "Thriller",
  "Horror",
  "Sci-Fi",
  "Fantasy",
  "Documentary",
  "Reality TV",
  "Sports",
  "Music",
  "Gaming",
  "Technology",
  "Fashion",
  "Food",
  "Travel",
  "Health & Fitness",
  "Education",
];
