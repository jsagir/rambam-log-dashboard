import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const sec = (ms / 1000).toFixed(1)
  return `${sec}s (${ms}ms)`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

export function getLatencyColor(ms: number): string {
  if (ms <= 2000) return '#4A8F6F'
  if (ms <= 3000) return '#D4A843'
  return '#C75B3A'
}

export function extractTime(timeStr: string): string {
  // "2026/2/15 6:53:43" → "6:53"
  const parts = timeStr.split(' ')
  if (parts.length < 2) return timeStr
  const time = parts[1]
  const timeParts = time.split(':')
  return `${timeParts[0]}:${timeParts[1]}`
}
