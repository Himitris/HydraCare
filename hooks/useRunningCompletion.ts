// hooks/useRunningCompletion.ts
import { useEffect } from 'react';
import { useRunningContext } from '@/context/RunningContext';
import { useAppContext } from '@/context/AppContext';
import { useTodoContext } from '@/context/TodoContext';
import { useIntegration } from '@/context/IntegrationContext';
import { Alert } from 'react-native';

export function useRunningCompletion() {
  const { sessions } = useRunningContext();
  const { addWaterIntake, settings } = useAppContext();
  const { addTodo } = useTodoContext();
  const { addRunningTaskOnCompletion, reminderForWaterAfterRun } =
    useIntegration();

  // Surveiller les nouvelles sessions de course
  useEffect(() => {
    if (sessions.length === 0) return;

    // Vérifier s'il y a une nouvelle session (moins de 5 minutes)
    const latestSession = sessions[0];
    const sessionTime = new Date(latestSession.date).getTime();
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (now - sessionTime < fiveMinutesInMs) {
      // Nouvelle session détectée

      // 1. Si l'option est activée, créer une tâche de récupération
      if (addRunningTaskOnCompletion) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Créer une tâche de récupération
        addTodo({
          title: 'Récupération après course',
          description: `Suite à votre course de ${
            latestSession.distance?.toFixed(1) || '?'
          } km. Faites des étirements et reposez-vous.`,
          priority: 'medium',
          dueDate: tomorrow,
        });
      }

      // 2. Si l'option est activée, suggérer de s'hydrater
      if (reminderForWaterAfterRun) {
        // Calculer la quantité d'eau recommandée (300ml pour 30min de course)
        const durationInMinutes = latestSession.duration || 30;
        const recommendedWater = Math.round(durationInMinutes * 10); // ~10ml par minute

        Alert.alert(
          'Pensez à vous hydrater!',
          `Après votre course de ${
            latestSession.distance?.toFixed(1) || '?'
          } km, nous vous recommandons de boire au moins ${recommendedWater}ml d'eau. Souhaitez-vous l'ajouter maintenant?`,
          [
            {
              text: 'Non merci',
              style: 'cancel',
            },
            {
              text: 'Ajouter',
              onPress: () => {
                // Ajouter l'hydratation
                addWaterIntake(recommendedWater);

                Alert.alert(
                  'Parfait!',
                  `${recommendedWater}ml d'eau ajoutés. Bonne récupération!`
                );
              },
            },
          ]
        );
      }
    }
  }, [sessions.length]);

  return null; // Ce hook ne renvoie rien, il gère juste les effets secondaires
}
