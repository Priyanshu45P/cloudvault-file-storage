export function formatBytes(bytes: number | string, decimals = 1): string {
  const value = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!value || value <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** exponent;

  return `${size.toFixed(exponent === 0 ? 0 : decimals)} ${units[exponent]}`;
}

export function storagePercentage(used: number | string, limit: number | string): number {
  const usedNum = typeof used === 'string' ? Number(used) : used;
  const limitNum = typeof limit === 'string' ? Number(limit) : limit;
  if (!limitNum) return 0;
  return Math.min(100, Math.round((usedNum / limitNum) * 100));
}
