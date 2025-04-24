import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Download } from 'lucide-react-native';

interface ResultsSummaryProps {
  filteredSessions: any[];
  isExporting: boolean;
  exportToCSV: () => void;
  colors: any;
}

const ResultsSummary = ({
  filteredSessions,
  isExporting,
  exportToCSV,
  colors,
}: ResultsSummaryProps) => {
  return (
    <View
      style={[styles.resultsCard, { backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          Résultats
        </Text>
        <View style={styles.resultsBadge}>
          <Text style={styles.resultsBadgeText}>{filteredSessions.length}</Text>
        </View>
      </View>

      {filteredSessions.length === 0 ? (
        <Text style={[styles.noResultsText, { color: colors.neutral[500] }]}>
          Aucune session ne correspond à vos critères de filtre
        </Text>
      ) : (
        <View style={styles.resultsStats}>
          <View style={styles.resultsStat}>
            <Text style={[styles.resultsStatValue, { color: colors.text }]}>
              {filteredSessions
                .reduce((total, session) => total + (session.distance || 0), 0)
                .toFixed(1)}{' '}
              km
            </Text>
            <Text
              style={[styles.resultsStatLabel, { color: colors.neutral[500] }]}
            >
              Distance totale
            </Text>
          </View>

          <View style={styles.resultsStat}>
            <Text style={[styles.resultsStatValue, { color: colors.text }]}>
              {Math.round(
                filteredSessions.reduce(
                  (total, session) => total + (session.duration || 0),
                  0
                )
              )}{' '}
              min
            </Text>
            <Text
              style={[styles.resultsStatLabel, { color: colors.neutral[500] }]}
            >
              Durée totale
            </Text>
          </View>

          <View style={styles.resultsStat}>
            <Text style={[styles.resultsStatValue, { color: colors.text }]}>
              {(filteredSessions.length > 0
                ? (filteredSessions.filter(
                    (s) => s.feeling === 'Excellent' || s.feeling === 'Bien'
                  ).length /
                    filteredSessions.length) *
                  100
                : 0
              ).toFixed(0)}
              %
            </Text>
            <Text
              style={[styles.resultsStatLabel, { color: colors.neutral[500] }]}
            >
              Satisfaction
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.exportButton,
          { backgroundColor: colors.secondary[500] },
          filteredSessions.length === 0 && { opacity: 0.5 },
        ]}
        onPress={exportToCSV}
        disabled={isExporting || filteredSessions.length === 0}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Download size={18} color="#fff" />
            <Text style={styles.exportButtonText}>Exporter en CSV</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  resultsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  resultsBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  resultsBadgeText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  noResultsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultsStat: {
    alignItems: 'center',
  },
  resultsStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  resultsStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});

export default ResultsSummary;
