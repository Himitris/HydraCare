import React from 'react';
import { StyleSheet, Text, TextInput, View, Switch } from 'react-native';
import { FilterOptions } from '@/hooks/useRunningData';

interface NumberRangeFilterProps {
  title: string;
  unit: string;
  filterKey: keyof FilterOptions;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  colors: any;
  placeholder?: {
    min: string;
    max: string;
  };
  minRef?: React.RefObject<TextInput>;
  maxRef?: React.RefObject<TextInput>;
}

const NumberRangeFilter = ({
  title,
  unit,
  filterKey,
  filterOptions,
  setFilterOptions,
  colors,
  placeholder = { min: '0', max: '100' },
  minRef,
  maxRef,
}: NumberRangeFilterProps) => {
  // Cast the filterKey to access the properties
  const filterData = filterOptions[filterKey] as {
    enabled: boolean;
    min: number | null;
    max: number | null;
  };

  const handleTextChange = (
    text: string,
    setValue: (value: number | null) => void,
    inputRef: React.RefObject<TextInput> | undefined
  ) => {
    const value =
      text.trim() === '' ? null : parseFloat(text.replace(',', '.'));
    setValue(value);
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  };

  return (
    <View style={styles.filterSection}>
      <View style={styles.switchRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>
          {`Filtrer par ${title} (${unit})`}
        </Text>
        <Switch
          value={filterData.enabled}
          onValueChange={(value) =>
            setFilterOptions({
              ...filterOptions,
              [filterKey]: {
                ...filterData,
                enabled: value,
              },
            })
          }
          trackColor={{
            false: colors.neutral[300],
            true: colors.secondary[300],
          }}
          thumbColor={
            filterData.enabled ? colors.secondary[500] : colors.neutral[100]
          }
        />
      </View>

      <View
        style={[
          styles.minMaxContainer,
          { opacity: filterData.enabled ? 1 : 0.5 },
        ]}
      >
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
            Min ({unit})
          </Text>
          <TextInput
            ref={minRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.neutral[300],
              },
            ]}
            keyboardType="numeric"
            placeholder={placeholder.min}
            placeholderTextColor={colors.neutral[400]}
            value={filterData.min !== null ? String(filterData.min) : ''}
            onChangeText={(text) =>
              handleTextChange(
                text,
                (value) => {
                  setFilterOptions({
                    ...filterOptions,
                    [filterKey]: {
                      ...filterData,
                      min: value,
                    },
                  });
                },
                minRef
              )
            }
            editable={filterData.enabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
            Max ({unit})
          </Text>
          <TextInput
            ref={maxRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.neutral[300],
              },
            ]}
            keyboardType="decimal-pad"
            placeholder={placeholder.max}
            placeholderTextColor={colors.neutral[400]}
            value={filterData.max !== null ? String(filterData.max) : ''}
            onChangeText={(text) =>
              handleTextChange(
                text,
                (value) => {
                  setFilterOptions({
                    ...filterOptions,
                    [filterKey]: {
                      ...filterData,
                      max: value,
                    },
                  });
                },
                maxRef
              )
            }
            editable={filterData.enabled}
          />
        </View>
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
  minMaxContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});

export default NumberRangeFilter;
