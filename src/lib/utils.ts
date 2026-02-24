import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export function getSeverityColor(severity: 'critical' | 'warning' | 'operational'): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warning':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'operational':
      return 'text-green-600 bg-green-50 border-green-200';
  }
}

export function getHealthStatus(
  criticalCount: number,
  warningCount: number
): '🟢 Healthy' | '🟡 Issues Found' | '🔴 Critical Issues' {
  if (criticalCount > 0) return '🔴 Critical Issues';
  if (warningCount > 0) return '🟡 Issues Found';
  return '🟢 Healthy';
}
