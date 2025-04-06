import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function getRelativeTime(date: string | Date): string {
  try {
    const now = new Date();
    
    // Handle SQL date format (YYYY-MM-DD HH:MM:SS.SSS)
    const past = typeof date === 'string' && date.includes(' ') 
      ? new Date(date.replace(' ', 'T')) 
      : new Date(date);
    
    if (isNaN(past.getTime())) {
      return 'Unknown date';
    }
    
    const diffMs = now.getTime() - past.getTime();
    
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(past);
    }
  } catch (error) {
    console.error("Error parsing date:", date, error);
    return "Invalid date";
  }
}

export function generateOrderId(): string {
  return `#${Math.floor(10000 + Math.random() * 90000)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
