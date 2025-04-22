// services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration des notifications pour Expo Go
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationSchedule {
  timeSlot: string;
  waterRemaining: number;
  message: string;
  icon: string;
}

interface ScheduledNotification {
  identifier: string;
  date: Date;
}

export class NotificationService {
  // Clé pour stocker les notifications déjà planifiées
  private static SCHEDULED_NOTIFICATIONS_KEY =
    '@hydracare/scheduled_notifications';
  private static LAST_NOTIFICATION_CHECK_KEY =
    '@hydracare/last_notification_check';

  // Configuration des créneaux intelligents de notification
  static notificationSchedules: NotificationSchedule[] = [
    {
      timeSlot: '09:00',
      waterRemaining: 2000,
      message:
        "🌅 Bonjour ! N'oubliez pas de commencer votre journée en vous hydratant 💧",
      icon: '🌅',
    },
    {
      timeSlot: '12:30',
      waterRemaining: 1500,
      message:
        "🍽️ L'heure du déjeuner ! C'est le moment parfait pour boire de l'eau 💦",
      icon: '🍽️',
    },
    {
      timeSlot: '15:00',
      waterRemaining: 1000,
      message: "☀️ Pause hydratation ! Il vous reste 1L à boire aujourd'hui 🥤",
      icon: '☀️',
    },
    {
      timeSlot: '17:00',
      waterRemaining: 500,
      message:
        '🏆 Vous y êtes presque ! Plus que 2 verres pour atteindre votre objectif 🌟',
      icon: '🏆',
    },
    {
      timeSlot: '19:00',
      waterRemaining: 250,
      message: "🌙 Dernier effort ! Un petit verre d'eau avant la soirée ? 🥤",
      icon: '🌙',
    },
    {
      timeSlot: '20:00',
      waterRemaining: 0,
      message:
        "🎉 Bravo ! Vous avez atteint votre objectif d'hydratation aujourd'hui ! 🏆",
      icon: '🎉',
    },
  ];

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

  // Planifier les notifications intelligentes
  static async scheduleSmartNotifications(
    dailyGoal: number,
    currentIntake: number
  ) {
    try {
      const remainingWater = dailyGoal - currentIntake;
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      // Parcourir les créneaux de notification
      for (const schedule of this.notificationSchedules) {
        const [hour, minute] = schedule.timeSlot.split(':').map(Number);

        // Ne planifier que les notifications futures
        if (
          hour > currentHour ||
          (hour === currentHour && minute > currentMinutes)
        ) {
          const notificationDate = new Date();
          notificationDate.setHours(hour);
          notificationDate.setMinutes(minute);
          notificationDate.setSeconds(0);
          notificationDate.setMilliseconds(0);

          // Vérifier si c'est une notification pertinente
          if (remainingWater >= schedule.waterRemaining) {
            let adaptedMessage = schedule.message;

            if (remainingWater > 1500) {
              adaptedMessage = `💧 Pensez à boire ! Il vous reste ${(
                remainingWater / 1000
              ).toFixed(1)}L à boire aujourd'hui 🥤`;
            } else if (remainingWater > 750) {
              adaptedMessage = `💪 Courage ! Plus que ${(
                remainingWater / 1000
              ).toFixed(1)}L pour atteindre votre objectif 🎯`;
            } else if (remainingWater > 0) {
              adaptedMessage = `✨ Vous y êtes presque ! Encore ${Math.round(
                remainingWater / 250
              )} verre(s) à boire 🥤`;
            }

            // Calculer le délai en secondes
            const delaySeconds = Math.max(
              1,
              Math.floor((notificationDate.getTime() - now.getTime()) / 1000)
            );

            // Planifier la notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'HydraCare - Restez hydraté !',
                body: adaptedMessage,
                data: { type: 'hydration', remainingWater },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: delaySeconds,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  // Notification immédiate de félicitations
  static async sendCongratulationsNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Félicitations !',
          body: "🏆 Vous avez atteint votre objectif d'hydratation aujourd'hui ! Continuez comme ça ! 💪",
          data: { type: 'goal_achieved' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Notification immédiate
      });
    } catch (error) {
      console.error('Error sending congratulations notification:', error);
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

  // Gestion intelligente des notifications
  static async updateNotificationSchedule(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      // Si les notifications sont désactivées, annuler toutes les notifications
      if (!settings.remindersEnabled) {
        await this.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Si l'objectif est atteint, envoyer une notification de félicitations
      if (currentIntake >= settings.dailyGoal) {
        await this.sendCongratulationsNotification();
        await this.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Annuler les notifications existantes avant d'en planifier de nouvelles
      await this.cancelAllScheduledNotificationsAsync();

      // Planifier des notifications intelligentes
      await this.scheduleSmartNotifications(settings.dailyGoal, currentIntake);
    } catch (error) {
      console.error('Error updating notification schedule:', error);
    }
  }

  // Fonction pour vérifier et mettre à jour les notifications après chaque ajout d'eau
  static async checkAndUpdateNotifications(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      if (!settings.remindersEnabled) {
        return;
      }

      // Ne mettre à jour que si c'est nécessaire
      const remainingWater = settings.dailyGoal - currentIntake;
      const currentHour = new Date().getHours();

      // Si l'utilisateur boit régulièrement, réduire la fréquence des notifications
      if (remainingWater < settings.dailyGoal * 0.25 && currentHour < 15) {
        // L'utilisateur est en bonne voie, moins de notifications
        await this.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Ne pas mettre à jour les notifications trop fréquemment
      const lastCheck = await AsyncStorage.getItem('last_notification_update');
      if (lastCheck) {
        const lastCheckTime = new Date(lastCheck);
        const now = new Date();
        if (now.getTime() - lastCheckTime.getTime() < 300000) {
          // 5 minutes
          return;
        }
      }

      await AsyncStorage.setItem(
        'last_notification_update',
        new Date().toISOString()
      );
      await this.updateNotificationSchedule(settings, currentIntake);
    } catch (error) {
      console.error('Error checking and updating notifications:', error);
    }
  }

  // Initialiser les notifications avec une logique intelligente
  static async initialize(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      // Vérifier si c'est un nouveau jour
      const newDay = await this.isNewDay();

      const hasPermission = await this.requestPermissions();
      if (!hasPermission || !settings.remindersEnabled) {
        return;
      }

      // Ne planifier les notifications qu'une fois par jour
      if (newDay) {
        await this.saveLastCheck();
        await this.updateNotificationSchedule(settings, currentIntake);
      }

      // Écouter les notifications reçues (pour debugging)
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
