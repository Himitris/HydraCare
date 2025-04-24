import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: any;
}

const FilterSection = ({
  title,
  isExpanded,
  onToggle,
  children,
  colors,
}: FilterSectionProps) => {
  return (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          { backgroundColor: colors.secondary[100] },
        ]}
        onPress={onToggle}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {isExpanded ? (
          <ChevronUp size={20} color={colors.text} />
        ) : (
          <ChevronDown size={20} color={colors.text} />
        )}
      </TouchableOpacity>

      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  sectionContent: {
    padding: 12,
  },
});

export default FilterSection;
