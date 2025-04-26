import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Utilitaire pour gérer le stockage et éviter les opérations répétitives
 */
export class StorageManager {
  private static cache: Record<string, any> = {};
  private static pendingWrites: Map<string, [string, any]> = new Map();
  private static writeTimeout: NodeJS.Timeout | null = null;

  /**
   * Obtenir une valeur du stockage avec mise en cache
   */
  static async getItem(key: string): Promise<any> {
    // Vérifier d'abord le cache
    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }

    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          // Mise en cache de la valeur parsée
          this.cache[key] = JSON.parse(value);
        } catch {
          // Si ce n'est pas du JSON, stocker la valeur brute
          this.cache[key] = value;
        }
      } else {
        this.cache[key] = null;
      }
      return this.cache[key];
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Stocker une valeur avec batch processing
   */
  static setItem(key: string, value: any): void {
    // Mettre à jour le cache immédiatement
    this.cache[key] = value;

    // Préparer pour écriture différée
    const serializedValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    this.pendingWrites.set(key, [key, serializedValue]);

    // Programmer une écriture batch
    this.scheduleWrite();
  }

  /**
   * Planifier une écriture batch
   */
  private static scheduleWrite(): void {
    if (this.writeTimeout !== null) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(async () => {
      if (this.pendingWrites.size === 0) return;

      const operations: [string, string][] = Array.from(
        this.pendingWrites.values()
      );
      this.pendingWrites.clear();

      try {
        await AsyncStorage.multiSet(operations);
      } catch (error) {
        console.error('Error in batch storage write:', error);
        // Remettre les opérations échouées dans la file d'attente
        operations.forEach(([key, value]) => {
          this.pendingWrites.set(key, [key, value]);
        });
        // Réessayer plus tard
        this.scheduleWrite();
      }
    }, 300); // 300ms de délai pour batching
  }

  /**
   * Nettoyer le cache pour libérer de la mémoire
   */
  static clearCache(): void {
    this.cache = {};
  }
}
