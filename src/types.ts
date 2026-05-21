export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface TableSchema {
  tableName: string;
  rowCount: number;
  columns: string[];
  status: "pending" | "migrating" | "completed" | "failed";
  migratedCount: number;
  error?: string;
  dependencies: string[];
}

export interface BucketSchema {
  id: string;
  name: string;
  isPublic: boolean;
  status: "pending" | "migrating" | "completed" | "failed";
  fileCount: number;
  migratedCount: number;
  error?: string;
}

export interface MigrationLog {
  timestamp: string;
  type: "info" | "success" | "warn" | "error";
  message: string;
  table?: string;
}

export interface GitHubMigrationFile {
  name: string;
  path: string;
  downloadUrl: string;
  githubUrl: string;
  content?: string;
  arabicTitle: string;
  englishTitle: string;
}
