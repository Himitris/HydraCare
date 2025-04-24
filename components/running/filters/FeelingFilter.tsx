import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { FilterOptions } from '@/hooks/useRunningData';

interface FeelingFilterProps {
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  getFeelingColor: (
    feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile'
  ) => string;
  getFeelingLabel: (
    feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile'
  ) => string;
  colors: any;
}

const FeelingFilter = ({
  filterOptions,
  setFilterOptions,
  getFeelingColor,
  getFeelingLabel,
  colors,
}: FeelingFilterProps) => {
  const toggleFeelingFilter = (
    feeling: 'Excellent' | 'Bien' | 'Moyen' | 'Difficile'
  ) => {
    const currentValues = [...filterOptions.feeling.values];
    const index = currentValues.indexOf(feeling);

    if (index >= 0) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(feeling);
    }

    setFilterOptions({
      ...filterOptions,
      feeling: {
        ...filterOptions.feeling,
        values: currentValues,
      },
    });
  };

  return (
    <View style={styles.filterSection}>
      <View style={styles.switchRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>
          Filtrer par ressenti
        </Text>
        <Switch
          value={filterOptions.feeling.enabled}
          onValueChange={(value) =>
            setFilterOptions({
              ...filterOptions,
              feeling: {
                ...filterOptions.feeling,
                enabled: value,
              },
            })
          }
          trackColor={{
            false: colors.neutral[300],
            true: colors.secondary[300],
          }}
          thumbColor={
            filterOptions.feeling.enabled
              ? colors.secondary[500]
              : colors.neutral[100]
          }
        />
      </View>

      <View
        style={[
          styles.feelingContainer,
          { opacity: filterOptions.feeling.enabled ? 1 : 0.5 },
        ]}
      >
        {(['Excellent', 'Bien', 'Moyen', 'Difficile'] as const).map(
          (feeling) => (
            <TouchableOpacity
              key={feeling}
              style={[
                styles.feelingButton,
                {
                  borderColor: filterOptions.feeling.values.includes(feeling)
                    ? getFeelingColor(feeling)
                    : colors.neutral[300],
                  opacity: filterOptions.feeling.enabled ? 1 : 0.5,
                },
              ]}
              onPress={() => {
                if (filterOptions.feeling.enabled) {
                  toggleFeelingFilter(feeling);
                }
              }}
              disabled={!filterOptions.feeling.enabled}
            >
              {filterOptions.feeling.values.includes(feeling) ? (
                <CheckCircle size={18} color={getFeelingColor(feeling)} />
              ) : (
                <Circle size={18} color={colors.neutral[400]} />
              )}
              <Text
                style={[
                  styles.feelingButtonText,
                  {
                    color: filterOptions.feeling.values.includes(feeling)
                      ? getFeelingColor(feeling)
                      : colors.neutral[500],
                  },
                ]}
              >
                {getFeelingLabel(feeling)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    marginBottom: 16,
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
  feelingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feelingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  feelingButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default FeelingFilter;
