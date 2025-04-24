import Colors from '@/constants/Colors';
import { useAppContext } from '@/context/AppContext';
import {
  RunningData,
  useRunningData
} from '@/hooks/useRunningData';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle, Calendar, Download, Filter, RefreshCw, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Import des composants extraits
import FeelingFilter from '@/components/running/filters/FeelingFilter';
import FilterSection from '@/components/running/filters/FilterSection';
import NumberRangeFilter from '@/components/running/filters/NumberRangeFilter';
import ResultsSummary from '@/components/running/filters/ResultsSummary';

// Import des éléments pour la modal d'aide
import FilterHelpModal from '@/components/running/modals/FilterHelpModal';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function RunningFiltersScreen() {
  const { isDarkMode } = useAppContext();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const {
    filteredSessions,
    isLoading,
    isExporting,
    filterOptions,
    setFilterOptions,
    resetFilters,
    exportToCSV,
    getFeelingLabel,
  }: RunningData = useRunningData();

  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(
    null
  );
  const [showFilterHelp, setShowFilterHelp] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dateRange: false,
    distance: false,
    duration: false,
    pace: false,
    elevation: false,
    heartRate: false,
    feeling: false,
  });

  // Refs for TextInputs
  const distanceMinInputRef = useRef<TextInput | null>(null);
  const distanceMaxInputRef = useRef<TextInput | null>(null);
  const durationMinInputRef = useRef<TextInput | null>(null);
  const durationMaxInputRef = useRef<TextInput | null>(null);
  const paceMinInputRef = useRef<TextInput | null>(null);
  const paceMaxInputRef = useRef<TextInput | null>(null);
  const elevationMinInputRef = useRef<TextInput | null>(null);
  const elevationMaxInputRef = useRef<TextInput | null>(null);
  const heartRateMinInputRef = useRef<TextInput | null>(null);
  const heartRateMaxInputRef = useRef<TextInput | null>(null);

  const toggleSectionExpand = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    if (selectedDate) {
      setFilterOptions({
        ...filterOptions,
        dateRange: {
          ...filterOptions.dateRange,
          [showDatePicker === 'start' ? 'startDate' : 'endDate']: selectedDate,
        },
      });
    }
  };

  const getFeelingColor = (
    feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile'
  ): string => {
    switch (feeling) {
      case 'Excellent':
        return colors.success[500];
      case 'Bien':
        return colors.secondary[500];
      case 'Moyen':
        return colors.warning[500];
      case 'Difficile':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  const handleResetFilters = () => {
    resetFilters();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleExportToCSV = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    exportToCSV();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDarkMode
            ? [colors.background, colors.secondary[50]]
            : [colors.secondary[50], colors.background]
        }
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Filter size={28} color={colors.secondary[500]} />
            <View style={styles.titleTextContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Filtres avancés
              </Text>
              <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
                {filteredSessions.length} session
                {filteredSessions.length !== 1 ? 's' : ''} trouvée
                {filteredSessions.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.helpButton,
              { backgroundColor: colors.secondary[100] },
            ]}
            onPress={() => setShowFilterHelp(true)}
          >
            <AlertCircle size={20} color={colors.secondary[500]} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary[500]} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Chargement des données...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Actions rapides */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.secondary[500] },
                ]}
                onPress={handleExportToCSV}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      Exporter ({filteredSessions.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.neutral[300] },
                ]}
                onPress={handleResetFilters}
              >
                <RefreshCw size={18} color={colors.neutral[700]} />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.neutral[700] },
                  ]}
                >
                  Réinitialiser
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sections de filtres */}
            <FilterSection
              title="Plage de dates"
              isExpanded={expandedSections.dateRange}
              onToggle={() => toggleSectionExpand('dateRange')}
              colors={colors}
            >
              <View style={styles.switchRow}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  Activer le filtre par dates
                </Text>
                <Switch
                  value={filterOptions.dateRange.enabled}
                  onValueChange={(value) =>
                    setFilterOptions({
                      ...filterOptions,
                      dateRange: {
                        ...filterOptions.dateRange,
                        enabled: value,
                      },
                    })
                  }
                  trackColor={{
                    false: colors.neutral[300],
                    true: colors.secondary[300],
                  }}
                  thumbColor={
                    filterOptions.dateRange.enabled
                      ? colors.secondary[500]
                      : colors.neutral[100]
                  }
                />
              </View>

              <View
                style={[
                  styles.dateContainer,
                  { opacity: filterOptions.dateRange.enabled ? 1 : 0.5 },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => setShowDatePicker('start')}
                  disabled={!filterOptions.dateRange.enabled}
                >
                  <Calendar size={16} color={colors.neutral[500]} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    Du {format(filterOptions.dateRange.startDate, 'dd/MM/yyyy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => setShowDatePicker('end')}
                  disabled={!filterOptions.dateRange.enabled}
                >
                  <Calendar size={16} color={colors.neutral[500]} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    Au {format(filterOptions.dateRange.endDate, 'dd/MM/yyyy')}
                  </Text>
                </TouchableOpacity>
              </View>
            </FilterSection>

            <FilterSection
              title="Distance"
              isExpanded={expandedSections.distance}
              onToggle={() => toggleSectionExpand('distance')}
              colors={colors}
            >
              <NumberRangeFilter
                title="distance"
                unit="km"
                filterKey="distance"
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                colors={colors}
                placeholder={{ min: 'Ex: 5', max: 'Ex: 10' }}
                minRef={distanceMinInputRef}
                maxRef={distanceMaxInputRef}
              />
            </FilterSection>

            <FilterSection
              title="Durée"
              isExpanded={expandedSections.duration}
              onToggle={() => toggleSectionExpand('duration')}
              colors={colors}
            >
              <NumberRangeFilter
                title="durée"
                unit="min"
                filterKey="duration"
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                colors={colors}
                placeholder={{ min: 'Ex: 30', max: 'Ex: 60' }}
                minRef={durationMinInputRef}
                maxRef={durationMaxInputRef}
              />
            </FilterSection>

            <FilterSection
              title="Allure"
              isExpanded={expandedSections.pace}
              onToggle={() => toggleSectionExpand('pace')}
              colors={colors}
            >
              <NumberRangeFilter
                title="allure"
                unit="min/km"
                filterKey="pace"
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                colors={colors}
                placeholder={{ min: 'Ex: 4.5', max: 'Ex: 6' }}
                minRef={paceMinInputRef}
                maxRef={paceMaxInputRef}
              />
            </FilterSection>

            <FilterSection
              title="Dénivelé"
              isExpanded={expandedSections.elevation}
              onToggle={() => toggleSectionExpand('elevation')}
              colors={colors}
            >
              <NumberRangeFilter
                title="dénivelé"
                unit="m"
                filterKey="elevation"
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                colors={colors}
                placeholder={{ min: 'Ex: 100', max: 'Ex: 500' }}
                minRef={elevationMinInputRef}
                maxRef={elevationMaxInputRef}
              />
            </FilterSection>

            <FilterSection
              title="Fréquence cardiaque"
              isExpanded={expandedSections.heartRate}
              onToggle={() => toggleSectionExpand('heartRate')}
              colors={colors}
            >
              <NumberRangeFilter
                title="FC moyenne"
                unit="bpm"
                filterKey="heartRate"
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                colors={colors}
                placeholder={{ min: 'Ex: 120', max: 'Ex: 170' }}
                minRef={heartRateMinInputRef}
                maxRef={heartRateMaxInputRef}
              />
            </FilterSection>

            <FilterSection
              title="Ressenti"
              isExpanded={expandedSections.feeling}
              onToggle={() => toggleSectionExpand('feeling')}
              colors={colors}
            >
              <FeelingFilter
                filterOptions={filterOptions}
                setFilterOptions={setFilterOptions}
                getFeelingColor={getFeelingColor}
                getFeelingLabel={getFeelingLabel}
                colors={colors}
              />
            </FilterSection>

            {/* Résumé des résultats */}
            <ResultsSummary
              filteredSessions={filteredSessions}
              isExporting={isExporting}
              exportToCSV={handleExportToCSV}
              colors={colors}
            />
          </ScrollView>
        )}

        {/* Date picker modal pour iOS */}
        {Platform.OS === 'ios' && showDatePicker && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showDatePicker !== null}
            onRequestClose={() => setShowDatePicker(null)}
          >
            <View style={styles.modalContainer}>
              <View
                style={[
                  styles.datePickerContainer,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <View style={styles.datePickerHeader}>
                  <Text
                    style={[styles.datePickerTitle, { color: colors.text }]}
                  >
                    Sélectionner une date
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={
                    showDatePicker === 'start'
                      ? filterOptions.dateRange.startDate
                      : filterOptions.dateRange.endDate
                  }
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  style={{ width: '100%' }}
                  locale="fr"
                />

                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    { backgroundColor: colors.secondary[500] },
                  ]}
                  onPress={() => setShowDatePicker(null)}
                >
                  <Text style={styles.datePickerButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Date picker pour Android (inline) */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={
              showDatePicker === 'start'
                ? filterOptions.dateRange.startDate
                : filterOptions.dateRange.endDate
            }
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Modale d'aide sur les filtres */}
        <FilterHelpModal
          visible={showFilterHelp}
          onClose={() => setShowFilterHelp(false)}
          colors={colors}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  dateContainer: {
    gap: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  datePickerContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  datePickerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  datePickerButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
