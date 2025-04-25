/**
 * Convertit une allure en minutes décimales (ex: 5.67) en format min:sec (ex: 5:40)
 * @param pace L'allure en minutes décimales par kilomètre
 * @param showSeconds Si true, affiche toujours les secondes même si elles sont à 0
 * @returns Une chaîne formatée au format min:sec/km ou simplement min/km si secondes = 0 et showSeconds = false
 */
export const formatPace = (
  pace: number | undefined,
  showSeconds = true
): string => {
  if (pace === undefined || isNaN(pace) || pace <= 0) {
    return '-';
  }

  // Extraire les minutes (partie entière)
  const minutes = Math.floor(pace);

  // Convertir la partie décimale en secondes (ex: 0.75 * 60 = 45 secondes)
  const seconds = Math.round((pace - minutes) * 60);

  // Gérer le cas où les secondes sont 60 (passer à la minute suivante)
  if (seconds === 60) {
    return `${minutes + 1}:00`;
  }

  // Format avec les secondes sur 2 chiffres (ex: 5:05)
  const formattedSeconds = seconds.toString().padStart(2, '0');

  // Si pas de secondes et showSeconds = false, n'afficher que les minutes
  if (seconds === 0 && !showSeconds) {
    return `${minutes}`;
  }

  return `${minutes}:${formattedSeconds}`;
};

/**
 * Formate une durée en minutes en format hh:mm:ss
 * @param durationMinutes Durée en minutes
 * @returns Durée formatée en texte
 */
export const formatDuration = (durationMinutes: number | undefined): string => {
  if (
    durationMinutes === undefined ||
    isNaN(durationMinutes) ||
    durationMinutes < 0
  ) {
    return '-';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.floor(durationMinutes % 60);
  const seconds = Math.round((durationMinutes * 60) % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds > 0 ? seconds + 's' : ''}`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Formate une distance en kilomètres
 * @param distance Distance en kilomètres
 * @param decimals Nombre de décimales à afficher
 * @returns Distance formatée
 */
export const formatDistance = (
  distance: number | undefined,
  decimals = 1
): string => {
  if (distance === undefined || isNaN(distance)) {
    return '-';
  }

  return distance.toFixed(decimals) + ' km';
};
