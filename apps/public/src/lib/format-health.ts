export type HealthTier = 'active' | 'stable' | 'slowing' | 'at-risk';

/**
 * Compute a health tier from a maintenance_score (0–1).
 *   active   ≥ 0.8
 *   stable   0.6 – 0.79
 *   slowing  0.4 – 0.59
 *   at-risk  < 0.4
 */
export function getHealthTier(maintenanceScore: number): HealthTier {
  if (maintenanceScore >= 0.8) return 'active';
  if (maintenanceScore >= 0.6) return 'stable';
  if (maintenanceScore >= 0.4) return 'slowing';
  return 'at-risk';
}

/**
 * Format a last_commit_date ISO string as a human-readable "X days ago".
 */
export function formatLastCommit(lastCommitDate: string): string {
  if (!lastCommitDate) return 'Unknown';
  const diff = Date.now() - new Date(lastCommitDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
