
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function todayISO() { 
  const d = new Date(); 
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; 
}

export function formatDate(dateStr: string, locale = 'es-ES') {
  const date = new Date(dateStr + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return date.toLocaleDateString(locale, options);
}

export const calculateICC = (originalIntensity?: number | null, finalCredibility?: number | null) => {
    if (typeof originalIntensity !== 'number' || typeof finalCredibility !== 'number' || originalIntensity === null || finalCredibility === null || isNaN(originalIntensity) || isNaN(finalCredibility)) {
        return null;
    }
    const icc = (originalIntensity - finalCredibility) / 10;
    return Math.max(0, icc).toFixed(2);
};

export const normalizeText = (text?: string | null): string => {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function escapeHtml(s: string | undefined): string {
    if(!s) return ''; 
    return String(s)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
