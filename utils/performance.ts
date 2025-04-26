/**
 * Fonction de debounce pour limiter la fréquence des appels à une fonction
 * @param func La fonction à debouncer
 * @param wait Le temps d'attente en millisecondes
 * @returns Une fonction debounced
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
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

/**
 * Fonction de throttle pour limiter la fréquence des appels à une fonction
 * @param func La fonction à throttler
 * @param limit Le temps limite en millisecondes
 * @returns Une fonction throttled
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
}
