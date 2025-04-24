import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Switch,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FilterOptions } from '@/hooks/useRunningData';

interface DateRangeFilterProps {
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  onOpenDatePicker: (type: 'start' | 'end') => void;
  colors: any;
}

const DateRangeFilter = ({
  filterOptions,
  setFilterOptions,
  onOpenDatePicker,
  colors,
}: DateRangeFilterProps) => {
  return (
    <View style={styles.filterSection}>
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
          style={[styles.dateButton, { backgroundColor: colors.background }]}
          onPress={() => onOpenDatePicker('start')}
          disabled={!filterOptions.dateRange.enabled}
        >
          <Calendar size={16} color={colors.neutral[500]} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            Du {format(filterOptions.dateRange.startDate, 'dd/MM/yyyy')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: colors.background }]}
          onPress={() => onOpenDatePicker('end')}
          disabled={!filterOptions.dateRange.enabled}
        >
          <Calendar size={16} color={colors.neutral[500]} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            Au {format(filterOptions.dateRange.endDate, 'dd/MM/yyyy')}
          </Text>
        </TouchableOpacity>
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
});

export default DateRangeFilter;
