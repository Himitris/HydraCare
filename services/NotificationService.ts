// services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration des notifications pour Expo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  // Clé pour stocker les notifications planifiées
  private static SCHEDULED_NOTIFICATIONS_KEY =
    '@hydracare/scheduled_notifications';
  private static LAST_NOTIFICATION_CHECK_KEY =
    '@hydracare/last_notification_check';

  // Configuration de l'heure de la notification (19h00 par défaut)
  private static EVENING_REMINDER_HOUR = 19;
  private static EVENING_REMINDER_MINUTE = 0;

  // Sauvegarde de la dernière vérification
  private static async saveLastCheck() {
    try {
      await AsyncStorage.setItem(
        this.LAST_NOTIFICATION_CHECK_KEY,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error saving last check:', error);
    }
  }

  // Vérification si c'est un nouveau jour
  private static async isNewDay(): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem(
        this.LAST_NOTIFICATION_CHECK_KEY
      );
      if (!lastCheck) return true;

      const lastDate = new Date(lastCheck);
      const today = new Date();

      return (
        lastDate.getDate() !== today.getDate() ||
        lastDate.getMonth() !== today.getMonth() ||
        lastDate.getFullYear() !== today.getFullYear()
      );
    } catch (error) {
      console.error('Error checking new day:', error);
      return true;
    }
  }

  // Demander la permission pour les notifications
  static async requestPermissions() {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission for notifications not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Envoyer une notification de test
  static async scheduleTestNotification(
    dailyGoal: number,
    currentIntake: number
  ) {
    const remainingWater = dailyGoal - currentIntake;

    let message = '💧 Ceci est une notification de test pour HydraCare !';

    if (remainingWater > 0) {
      message = `💧 Il vous reste ${(remainingWater / 1000).toFixed(
        1
      )}L à boire aujourd'hui ! 🥤`;
    } else {
      message =
        "🎉 Bravo ! Vous avez atteint votre objectif d'hydratation ! 🏆";
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HydraCare - Test de notification',
        body: message,
        data: { type: 'test' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
  }

  // Planifier la notification du soir
  static async scheduleEveningReminder(
    dailyGoal: number,
    currentIntake: number
  ) {
    try {
      // Annuler les notifications existantes d'abord
      await this.cancelAllScheduledNotificationsAsync();

      const remainingWater = dailyGoal - currentIntake;

      // Ne pas planifier de notification si l'objectif est déjà atteint
      if (remainingWater <= 0) {
        console.log('Objectif déjà atteint, pas de notification planifiée');
        return null;
      }

      const now = new Date();
      const notificationDate = new Date();
      notificationDate.setHours(this.EVENING_REMINDER_HOUR);
      notificationDate.setMinutes(this.EVENING_REMINDER_MINUTE);
      notificationDate.setSeconds(0);
      notificationDate.setMilliseconds(0);

      // Si l'heure de la notification est déjà passée pour aujourd'hui, ne pas l'envoyer
      if (notificationDate <= now) {
        console.log("Heure de la notification déjà passée pour aujourd'hui");
        return null;
      }

      // Message adapté en fonction de la quantité restante
      let message = `💧 N'oubliez pas ! Il vous reste ${(
        remainingWater / 1000
      ).toFixed(1)}L à boire aujourd'hui.`;
      if (remainingWater <= 500) {
        message = `💧 Dernier effort ! Plus que ${Math.round(
          remainingWater / 250
        )} verre(s) pour atteindre votre objectif.`;
      }

      // Calculer le délai en secondes
      const delaySeconds = Math.max(
        1,
        Math.floor((notificationDate.getTime() - now.getTime()) / 1000)
      );

      // Planifier la notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'HydraCare - Rappel du soir',
          body: message,
          data: { type: 'evening_reminder', remainingWater },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
        },
      });

      console.log(
        `Notification du soir planifiée pour ${this.EVENING_REMINDER_HOUR}:${this.EVENING_REMINDER_MINUTE} - ID: ${identifier}`
      );

      // Sauvegarder l'identifiant
      await AsyncStorage.setItem(
        this.SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify([identifier])
      );

      return identifier;
    } catch (error) {
      console.error('Error scheduling evening reminder:', error);
      return null;
    }
  }

  // Annuler toutes les notifications planifiées
  static async cancelAllScheduledNotificationsAsync() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.SCHEDULED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Gestion simplifiée de la notification du soir
  static async updateNotificationSchedule(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      // Si les notifications sont désactivées, annuler toutes les notifications
      if (!settings.remindersEnabled) {
        await this.cancelAllScheduledNotificationsAsync();
        console.log(
          'Notifications désactivées, toutes les notifications ont été annulées'
        );
        return null;
      }

      // Si l'objectif est atteint, annuler les notifications
      if (currentIntake >= settings.dailyGoal) {
        await this.cancelAllScheduledNotificationsAsync();
        console.log('Objectif atteint, notifications annulées');
        return null;
      }

      // Planifier la notification du soir
      return await this.scheduleEveningReminder(
        settings.dailyGoal,
        currentIntake
      );
    } catch (error) {
      console.error('Error updating notification schedule:', error);
      return null;
    }
  }

  // Fonction pour vérifier et mettre à jour la notification
  static async checkAndUpdateNotifications(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      if (!settings.remindersEnabled) {
        return;
      }

      // Si l'objectif est atteint, annuler les notifications
      if (currentIntake >= settings.dailyGoal) {
        await this.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Ne pas mettre à jour les notifications trop fréquemment
      const lastCheck = await AsyncStorage.getItem('last_notification_update');
      if (lastCheck) {
        const lastCheckTime = new Date(lastCheck);
        const now = new Date();
        // Limiter à une mise à jour toutes les 30 minutes
        if (now.getTime() - lastCheckTime.getTime() < 1800000) {
          return;
        }
      }

      await AsyncStorage.setItem(
        'last_notification_update',
        new Date().toISOString()
      );

      // Planifier la notification du soir
      await this.updateNotificationSchedule(settings, currentIntake);
    } catch (error) {
      console.error('Error checking and updating notifications:', error);
    }
  }

  // Initialiser les notifications
  static async initialize(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      // S'assurer que les permissions sont accordées
      const hasPermission = await this.requestPermissions();
      if (!hasPermission || !settings.remindersEnabled) {
        console.log('Notifications désactivées ou permissions refusées');
        return null;
      }

      // Annuler toutes les notifications précédentes
      await this.cancelAllScheduledNotificationsAsync();
      console.log('Anciennes notifications annulées');

      // Planifier la notification du soir
      await this.saveLastCheck();
      await this.updateNotificationSchedule(settings, currentIntake);

      // Écouter les notifications reçues
      const subscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification reçue:', notification);
        }
      );

      // Écouter les interactions avec les notifications
      const interactionSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('Interaction avec notification:', response);
        });

      // Retourner les subscriptions pour pouvoir les nettoyer plus tard
      return { subscription, interactionSubscription };
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }
}
