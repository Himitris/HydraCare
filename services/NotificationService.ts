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

export class NotificationService {
  // Configuration des créneaux intelligents de notification
  static notificationSchedules: NotificationSchedule[] = [
    // Notifications matinales (léger rappel)
    {
      timeSlot: '09:00',
      waterRemaining: 2000, // Si presque rien n'a été bu
      message:
        "🌅 Bonjour ! N'oubliez pas de commencer votre journée en vous hydratant 💧",
      icon: '🌅',
    },

    // Notifications de mi-journée
    {
      timeSlot: '12:30',
      waterRemaining: 1500, // Si moins d'1/4 bu
      message:
        "🍽️ L'heure du déjeuner ! C'est le moment parfait pour boire de l'eau 💦",
      icon: '🍽️',
    },

    // Notifications d'après-midi
    {
      timeSlot: '15:00',
      waterRemaining: 1000, // Si moins de la moitié bu
      message: "☀️ Pause hydratation ! Il vous reste 1L à boire aujourd'hui 🥤",
      icon: '☀️',
    },

    // Notifications de fin d'après-midi
    {
      timeSlot: '17:00',
      waterRemaining: 500, // Si presque atteint
      message:
        '🏆 Vous y êtes presque ! Plus que 2 verres pour atteindre votre objectif 🌟',
      icon: '🏆',
    },

    // Notification du soir (dernière chance)
    {
      timeSlot: '19:00',
      waterRemaining: 250, // Si très proche
      message: "🌙 Dernier effort ! Un petit verre d'eau avant la soirée ? 🥤",
      icon: '🌙',
    },

    // Notification de félicitations
    {
      timeSlot: '20:00',
      waterRemaining: 0, // Objectif atteint
      message:
        "🎉 Bravo ! Vous avez atteint votre objectif d'hydratation aujourd'hui ! 🏆",
      icon: '🎉',
    },
  ];

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
      // Annuler toutes les notifications existantes
      await Notifications.cancelAllScheduledNotificationsAsync();

      const remainingWater = dailyGoal - currentIntake;
      const currentHour = new Date().getHours();
      const currentMinutes = new Date().getMinutes();

      // Parcourir les créneaux de notification
      for (const schedule of this.notificationSchedules) {
        const [hour, minute] = schedule.timeSlot.split(':').map(Number);

        // Ne pas planifier les notifications pour les heures déjà passées
        if (
          hour < currentHour ||
          (hour === currentHour && minute <= currentMinutes)
        ) {
          continue;
        }

        // Logique intelligente basée sur l'eau restante
        if (remainingWater >= schedule.waterRemaining) {
          // Adapter le message en fonction de la quantité restante
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

          const notificationDate = new Date();
          notificationDate.setHours(hour);
          notificationDate.setMinutes(minute);
          notificationDate.setSeconds(0);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'HydraCare - Restez hydraté !',
              body: adaptedMessage,
              data: { type: 'hydration', remainingWater },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: notificationDate,
            },
          });
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

  // Gestion intelligente des notifications
  static async updateNotificationSchedule(
    settings: { dailyGoal: number; remindersEnabled: boolean },
    currentIntake: number
  ) {
    try {
      // Si les notifications sont désactivées, annuler toutes les notifications
      if (!settings.remindersEnabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Si l'objectif est atteint, envoyer une notification de félicitations
      if (currentIntake >= settings.dailyGoal) {
        await this.sendCongratulationsNotification();
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Sinon, planifier des notifications intelligentes
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
      // Logique intelligente pour ajuster les notifications
      const remainingWater = settings.dailyGoal - currentIntake;
      const currentHour = new Date().getHours();

      // Si l'utilisateur boit régulièrement, réduire la fréquence des notifications
      if (remainingWater < settings.dailyGoal * 0.25 && currentHour < 15) {
        // L'utilisateur est en bonne voie, moins de notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Ajuster les notifications en fonction du progrès
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
      const hasPermission = await this.requestPermissions();

      if (!hasPermission || !settings.remindersEnabled) {
        return;
      }

      // Planifier les notifications initiales
      await this.updateNotificationSchedule(settings, currentIntake);

      // Écouter les notifications reçues
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification reçue:', notification);
      });

      // Écouter les interactions avec les notifications
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Interaction avec notification:', response);
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }
}
