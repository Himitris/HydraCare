// components/integration/AchievementsWidget.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ColorValue,
} from 'react-native';
import { useIntegration } from '@/context/IntegrationContext';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import {
  Award,
  ChevronRight,
  Lock,
  Droplet,
  Activity,
  CheckSquare,
  Trophy,
  X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  date?: string;
  icon: string;
}

export default function AchievementsWidget() {
  const { isDarkMode } = useAppContext();
  const { achievements } = useIntegration();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  // Fonction pour obtenir l'icône à partir de la valeur 'icon' dans les données d'achievement
  const getIconComponent = (
    iconName: string,
    size: string | number | undefined,
    color: ColorValue | undefined
  ) => {
    switch (iconName) {
      case 'droplet':
        return <Droplet size={size} color={color} />;
      case 'activity':
        return <Activity size={size} color={color} />;
      case 'check-square':
        return <CheckSquare size={size} color={color} />;
      case 'trophy':
        return <Trophy size={size} color={color} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };

  return (
    <>
      <View
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Award size={20} color={colors.accent[500]} />
            <Text style={[styles.title, { color: colors.text }]}>
              Récompenses
            </Text>
          </View>

          <Text style={[styles.count, { color: colors.neutral[500] }]}>
            {unlockedCount}/{totalCount}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accent[500],
                width: `${(unlockedCount / totalCount) * 100}%`,
              },
            ]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.achievementsScroll}
        >
          {achievements.map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              style={[
                styles.achievementItem,
                {
                  backgroundColor: achievement.unlocked
                    ? colors.accent[100]
                    : colors.neutral[200],
                  opacity: achievement.unlocked ? 1 : 0.7,
                },
              ]}
              onPress={() =>
                handleAchievementPress({
                  ...achievement,
                  date: achievement.date?.toISOString(),
                })
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: achievement.unlocked
                      ? colors.accent[500]
                      : colors.neutral[400],
                  },
                ]}
              >
                {achievement.unlocked ? (
                  getIconComponent(achievement.icon, 24, '#fff')
                ) : (
                  <Lock size={20} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.achievementTitle,
                  {
                    color: achievement.unlocked
                      ? colors.accent[700]
                      : colors.neutral[600],
                  },
                ]}
                numberOfLines={2}
              >
                {achievement.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal des détails de récompense */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>

            {selectedAchievement && (
              <View style={styles.achievementDetails}>
                <View
                  style={[
                    styles.modalIconContainer,
                    {
                      backgroundColor: selectedAchievement.unlocked
                        ? colors.accent[500]
                        : colors.neutral[400],
                    },
                  ]}
                >
                  {selectedAchievement.unlocked ? (
                    getIconComponent(selectedAchievement.icon, 40, '#fff')
                  ) : (
                    <Lock size={32} color="#fff" />
                  )}
                </View>

                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedAchievement.title}
                </Text>

                <Text
                  style={[
                    styles.modalDescription,
                    { color: colors.neutral[600] },
                  ]}
                >
                  {selectedAchievement.description}
                </Text>

                {selectedAchievement.unlocked && selectedAchievement.date && (
                  <Text
                    style={[styles.modalDate, { color: colors.neutral[500] }]}
                  >
                    Débloqué le{' '}
                    {format(
                      new Date(selectedAchievement.date),
                      'dd MMMM yyyy',
                      { locale: fr }
                    )}
                  </Text>
                )}

                {!selectedAchievement.unlocked && (
                  <View
                    style={[
                      styles.lockedMessage,
                      { backgroundColor: colors.neutral[200] },
                    ]}
                  >
                    <Lock size={16} color={colors.neutral[600]} />
                    <Text
                      style={[
                        styles.lockedText,
                        { color: colors.neutral[600] },
                      ]}
                    >
                      Continuez à utiliser l'application pour débloquer cette
                      récompense
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  count: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementsScroll: {
    marginHorizontal: -4,
  },
  achievementItem: {
    width: 100,
    height: 120,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  achievementDetails: {
    alignItems: 'center',
    width: '100%',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 12,
    fontFamily: 'Inter-Italic',
    marginTop: 8,
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  lockedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
    flex: 1,
  },
});
