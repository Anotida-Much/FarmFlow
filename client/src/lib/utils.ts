import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-gray-400 text-white';
    case 'overdue':
      return 'bg-red-500 text-white';
    case 'today':
      return 'bg-yellow-500 text-white';
    case 'upcoming':
      return 'bg-green-500 text-white';
    case 'low':
      return 'bg-red-500 text-white';
    case 'good':
      return 'bg-green-500 text-white';
    case 'available':
      return 'bg-green-500 text-white';
    case 'in-use':
      return 'bg-blue-500 text-white';
    case 'maintenance-due':
      return 'bg-yellow-500 text-white';
    case 'out-of-service':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-blue-500 text-white';
    case 'low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
