import React, { useState, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
    Modal,
    TextInput,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Filter,
    Download,
    Calendar,
    X,
    Sliders,
    CheckCircle, Circle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Colors from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useRunningData } from '@/hooks/useRunningData';

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
        getFeelingLabel
    } = useRunningData();

    const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
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

    const distanceMinInputRef = useRef(null);
    const distanceMaxInputRef = useRef(null);
    const durationMinInputRef = useRef(null);
    const durationMaxInputRef = useRef(null);
    const paceMinInputRef = useRef(null);
    const paceMaxInputRef = useRef(null);
    const elevationMinInputRef = useRef(null);
    const elevationMaxInputRef = useRef(null);
    const heartRateMinInputRef = useRef(null);
    const heartRateMaxInputRef = useRef(null);

    const toggleSectionExpand = (section) => {
        setExpandedSections({
            ...expandedSections,
            [section]: !expandedSections[section],
        });
    };

    const toggleFeelingFilter = (feeling) => {
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

    const onDateChange = (event, selectedDate) => {
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

    const getFeelingColor = (feeling) => {
        switch (feeling) {
            case 'great': return colors.success[500];
            case 'good': return colors.secondary[500];
            case 'average': return colors.warning[500];
            case 'bad': return colors.error[500];
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

    const handleTextChange = useCallback((text, setValue, inputRef) => {
        const value = text.trim() === '' ? null : parseFloat(text.replace(',', '.'));
        setValue(value);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const FilterSection = ({ title, section, children }) => {
        const isExpanded = expandedSections[section];

        return (
            <View style={styles.filterSection}>
                <TouchableOpacity
                    style={[styles.sectionHeader, { backgroundColor: colors.secondary[100] }]}
                    onPress={() => toggleSectionExpand(section)}
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

                {isExpanded && (
                    <View style={styles.sectionContent}>
                        {children}
                    </View>
                )}
            </View>
        );
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
                                {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} trouvée{filteredSessions.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.helpButton, { backgroundColor: colors.secondary[100] }]}
                        onPress={() => setShowFilterHelp(true)}
                    >
                        <Sliders size={20} color={colors.secondary[500]} />
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
                                style={[styles.actionButton, { backgroundColor: colors.secondary[500] }]}
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
                                style={[styles.actionButton, { backgroundColor: colors.neutral[300] }]}
                                onPress={handleResetFilters}
                            >
                                <RefreshCw size={18} color={colors.neutral[700]} />
                                <Text style={[styles.actionButtonText, { color: colors.neutral[700] }]}>
                                    Réinitialiser
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sections de filtres */}
                        <FilterSection title="Plage de dates" section="dateRange">
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

                            <View style={[styles.dateContainer, { opacity: filterOptions.dateRange.enabled ? 1 : 0.5 }]}>
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

                        <FilterSection title="Distance" section="distance">
                            <View style={styles.switchRow}>
                                <Text style={[styles.filterLabel, { color: colors.text }]}>
                                    Filtrer par distance (km)
                                </Text>
                                <Switch
                                    value={filterOptions.distance.enabled}
                                    onValueChange={(value) =>
                                        setFilterOptions({
                                            ...filterOptions,
                                            distance: {
                                                ...filterOptions.distance,
                                                enabled: value,
                                            },
                                        })
                                    }
                                    trackColor={{
                                        false: colors.neutral[300],
                                        true: colors.secondary[300],
                                    }}
                                    thumbColor={
                                        filterOptions.distance.enabled
                                            ? colors.secondary[500]
                                            : colors.neutral[100]
                                    }
                                />
                            </View>

                            <View style={[styles.minMaxContainer, { opacity: filterOptions.distance.enabled ? 1 : 0.5 }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Min (km)
                                    </Text>
                                    <TextInput
                                        ref={distanceMinInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 5"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.distance.min !== null ? String(filterOptions.distance.min) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                distance: {
                                                    ...filterOptions.distance,
                                                    min: value,
                                                },
                                            });
                                        }, distanceMinInputRef)}
                                        editable={filterOptions.distance.enabled}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Max (km)
                                    </Text>
                                    <TextInput
                                        ref={distanceMaxInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 10"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.distance.max !== null ? String(filterOptions.distance.max) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                distance: {
                                                    ...filterOptions.distance,
                                                    max: value,
                                                },
                                            });
                                        }, distanceMaxInputRef)}
                                        editable={filterOptions.distance.enabled}
                                    />
                                </View>
                            </View>
                        </FilterSection>

                        <FilterSection title="Durée" section="duration">
                            <View style={styles.switchRow}>
                                <Text style={[styles.filterLabel, { color: colors.text }]}>
                                    Filtrer par durée (minutes)
                                </Text>
                                <Switch
                                    value={filterOptions.duration.enabled}
                                    onValueChange={(value) =>
                                        setFilterOptions({
                                            ...filterOptions,
                                            duration: {
                                                ...filterOptions.duration,
                                                enabled: value,
                                            },
                                        })
                                    }
                                    trackColor={{
                                        false: colors.neutral[300],
                                        true: colors.secondary[300],
                                    }}
                                    thumbColor={
                                        filterOptions.duration.enabled
                                            ? colors.secondary[500]
                                            : colors.neutral[100]
                                    }
                                />
                            </View>

                            <View style={[styles.minMaxContainer, { opacity: filterOptions.duration.enabled ? 1 : 0.5 }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Min (min)
                                    </Text>
                                    <TextInput
                                        ref={durationMinInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 30"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.duration.min !== null ? String(filterOptions.duration.min) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                duration: {
                                                    ...filterOptions.duration,
                                                    min: value,
                                                },
                                            });
                                        }, durationMinInputRef)}
                                        editable={filterOptions.duration.enabled}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Max (min)
                                    </Text>
                                    <TextInput
                                        ref={durationMaxInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 60"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.duration.max !== null ? String(filterOptions.duration.max) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                duration: {
                                                    ...filterOptions.duration,
                                                    max: value,
                                                },
                                            });
                                        }, durationMaxInputRef)}
                                        editable={filterOptions.duration.enabled}
                                    />
                                </View>
                            </View>
                        </FilterSection>

                        <FilterSection title="Allure" section="pace">
                            <View style={styles.switchRow}>
                                <Text style={[styles.filterLabel, { color: colors.text }]}>
                                    Filtrer par allure (min/km)
                                </Text>
                                <Switch
                                    value={filterOptions.pace.enabled}
                                    onValueChange={(value) =>
                                        setFilterOptions({
                                            ...filterOptions,
                                            pace: {
                                                ...filterOptions.pace,
                                                enabled: value,
                                            },
                                        })
                                    }
                                    trackColor={{
                                        false: colors.neutral[300],
                                        true: colors.secondary[300],
                                    }}
                                    thumbColor={
                                        filterOptions.pace.enabled
                                            ? colors.secondary[500]
                                            : colors.neutral[100]
                                    }
                                />
                            </View>

                            <View style={[styles.minMaxContainer, { opacity: filterOptions.pace.enabled ? 1 : 0.5 }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Min (min/km)
                                    </Text>
                                    <TextInput
                                        ref={paceMinInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 4.5"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.pace.min !== null ? String(filterOptions.pace.min) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                pace: {
                                                    ...filterOptions.pace,
                                                    min: value,
                                                },
                                            });
                                        }, paceMinInputRef)}
                                        editable={filterOptions.pace.enabled}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Max (min/km)
                                    </Text>
                                    <TextInput
                                        ref={paceMaxInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 6"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.pace.max !== null ? String(filterOptions.pace.max) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                pace: {
                                                    ...filterOptions.pace,
                                                    max: value,
                                                },
                                            });
                                        }, paceMaxInputRef)}
                                        editable={filterOptions.pace.enabled}
                                    />
                                </View>
                            </View>
                        </FilterSection>

                        <FilterSection title="Dénivelé" section="elevation">
                            <View style={styles.switchRow}>
                                <Text style={[styles.filterLabel, { color: colors.text }]}>
                                    Filtrer par dénivelé (m)
                                </Text>
                                <Switch
                                    value={filterOptions.elevation.enabled}
                                    onValueChange={(value) =>
                                        setFilterOptions({
                                            ...filterOptions,
                                            elevation: {
                                                ...filterOptions.elevation,
                                                enabled: value,
                                            },
                                        })
                                    }
                                    trackColor={{
                                        false: colors.neutral[300],
                                        true: colors.secondary[300],
                                    }}
                                    thumbColor={
                                        filterOptions.elevation.enabled
                                            ? colors.secondary[500]
                                            : colors.neutral[100]
                                    }
                                />
                            </View>

                            <View style={[styles.minMaxContainer, { opacity: filterOptions.elevation.enabled ? 1 : 0.5 }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Min (m)
                                    </Text>
                                    <TextInput
                                        ref={elevationMinInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 100"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.elevation.min !== null ? String(filterOptions.elevation.min) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                elevation: {
                                                    ...filterOptions.elevation,
                                                    min: value,
                                                },
                                            });
                                        }, elevationMinInputRef)}
                                        editable={filterOptions.elevation.enabled}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Max (m)
                                    </Text>
                                    <TextInput
                                        ref={elevationMaxInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 500"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.elevation.max !== null ? String(filterOptions.elevation.max) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                elevation: {
                                                    ...filterOptions.elevation,
                                                    max: value,
                                                },
                                            });
                                        }, elevationMaxInputRef)}
                                        editable={filterOptions.elevation.enabled}
                                    />
                                </View>
                            </View>
                        </FilterSection>

                        <FilterSection title="Fréquence cardiaque" section="heartRate">
                            <View style={styles.switchRow}>
                                <Text style={[styles.filterLabel, { color: colors.text }]}>
                                    Filtrer par FC moyenne (bpm)
                                </Text>
                                <Switch
                                    value={filterOptions.heartRate.enabled}
                                    onValueChange={(value) =>
                                        setFilterOptions({
                                            ...filterOptions,
                                            heartRate: {
                                                ...filterOptions.heartRate,
                                                enabled: value,
                                            },
                                        })
                                    }
                                    trackColor={{
                                        false: colors.neutral[300],
                                        true: colors.secondary[300],
                                    }}
                                    thumbColor={
                                        filterOptions.heartRate.enabled
                                            ? colors.secondary[500]
                                            : colors.neutral[100]
                                    }
                                />
                            </View>

                            <View style={[styles.minMaxContainer, { opacity: filterOptions.heartRate.enabled ? 1 : 0.5 }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Min (bpm)
                                    </Text>
                                    <TextInput
                                        ref={heartRateMinInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 120"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.heartRate.min !== null ? String(filterOptions.heartRate.min) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                heartRate: {
                                                    ...filterOptions.heartRate,
                                                    min: value,
                                                },
                                            });
                                        }, heartRateMinInputRef)}
                                        editable={filterOptions.heartRate.enabled}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.neutral[500] }]}>
                                        Max (bpm)
                                    </Text>
                                    <TextInput
                                        ref={heartRateMaxInputRef}
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                borderColor: colors.neutral[300],
                                            },
                                        ]}
                                        keyboardType="decimal-pad"
                                        placeholder="Ex: 170"
                                        placeholderTextColor={colors.neutral[400]}
                                        value={filterOptions.heartRate.max !== null ? String(filterOptions.heartRate.max) : ''}
                                        onChangeText={(text) => handleTextChange(text, (value) => {
                                            setFilterOptions({
                                                ...filterOptions,
                                                heartRate: {
                                                    ...filterOptions.heartRate,
                                                    max: value,
                                                },
                                            });
                                        }, heartRateMaxInputRef)}
                                        editable={filterOptions.heartRate.enabled}
                                    />
                                </View>
                            </View>
                        </FilterSection>

                        <FilterSection title="Ressenti" section="feeling">
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

                            <View style={[styles.feelingContainer, { opacity: filterOptions.feeling.enabled ? 1 : 0.5 }]}>
                                {(['great', 'good', 'average', 'bad'] as const).map((feeling) => (
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
                                ))}
                            </View>
                        </FilterSection>

                        {/* Résumé des résultats */}
                        <View style={[styles.resultsCard, { backgroundColor: colors.cardBackground }]}>
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
                                            {filteredSessions.reduce((total, session) =>
                                                total + (session.distance || 0), 0).toFixed(1)} km
                                        </Text>
                                        <Text style={[styles.resultsStatLabel, { color: colors.neutral[500] }]}>
                                            Distance totale
                                        </Text>
                                    </View>

                                    <View style={styles.resultsStat}>
                                        <Text style={[styles.resultsStatValue, { color: colors.text }]}>
                                            {Math.round(filteredSessions.reduce((total, session) =>
                                                total + (session.duration || 0), 0))} min
                                        </Text>
                                        <Text style={[styles.resultsStatLabel, { color: colors.neutral[500] }]}>
                                            Durée totale
                                        </Text>
                                    </View>

                                    <View style={styles.resultsStat}>
                                        <Text style={[styles.resultsStatValue, { color: colors.text }]}>
                                            {(filteredSessions.length > 0 ?
                                                filteredSessions.filter(s => s.feeling === 'great' || s.feeling === 'good').length / filteredSessions.length * 100 :
                                                0).toFixed(0)}%
                                        </Text>
                                        <Text style={[styles.resultsStatLabel, { color: colors.neutral[500] }]}>
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
                                onPress={handleExportToCSV}
                                disabled={isExporting || filteredSessions.length === 0}
                            >
                                {isExporting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Download size={18} color="#fff" />
                                        <Text style={styles.exportButtonText}>
                                            Exporter en CSV
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
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
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.cardBackground }]}>
                                <View style={styles.datePickerHeader}>
                                    <Text style={[styles.datePickerTitle, { color: colors.text }]}>
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
                                    style={[styles.datePickerButton, { backgroundColor: colors.secondary[500] }]}
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
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showFilterHelp}
                    onRequestClose={() => setShowFilterHelp(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={[styles.helpModalContent, { backgroundColor: colors.cardBackground }]}>
                            <View style={styles.helpModalHeader}>
                                <Text style={[styles.helpModalTitle, { color: colors.text }]}>
                                    Comment utiliser les filtres
                                </Text>
                                <TouchableOpacity onPress={() => setShowFilterHelp(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.helpScrollView}>
                                <View style={styles.helpSection}>
                                    <Text style={[styles.helpSectionTitle, { color: colors.secondary[500] }]}>
                                        Filtres disponibles
                                    </Text>
                                    <Text style={[styles.helpText, { color: colors.text }]}>
                                        Vous pouvez combiner plusieurs filtres pour affiner votre recherche.
                                        Activez ou désactivez chaque filtre avec les interrupteurs.
                                    </Text>
                                </View>

                                <View style={styles.helpSection}>
                                    <Text style={[styles.helpSectionTitle, { color: colors.secondary[500] }]}>
                                        Plage de dates
                                    </Text>
                                    <Text style={[styles.helpText, { color: colors.text }]}>
                                        Filtrez vos séances entre deux dates spécifiques. Par défaut, les 3 derniers mois sont affichés.
                                    </Text>
                                </View>

                                <View style={styles.helpSection}>
                                    <Text style={[styles.helpSectionTitle, { color: colors.secondary[500] }]}>
                                        Distance, durée et allure
                                    </Text>
                                    <Text style={[styles.helpText, { color: colors.text }]}>
                                        Définissez des valeurs minimales et/ou maximales pour chaque critère.
                                        Laissez un champ vide pour ne pas avoir de limite.
                                    </Text>
                                </View>

                                <View style={styles.helpSection}>
                                    <Text style={[styles.helpSectionTitle, { color: colors.secondary[500] }]}>
                                        Ressenti
                                    </Text>
                                    <Text style={[styles.helpText, { color: colors.text }]}>
                                        Sélectionnez un ou plusieurs ressentis pour filtrer vos séances.
                                    </Text>
                                </View>

                                <View style={styles.helpSection}>
                                    <Text style={[styles.helpSectionTitle, { color: colors.secondary[500] }]}>
                                        Exportation CSV
                                    </Text>
                                    <Text style={[styles.helpText, { color: colors.text }]}>
                                        Le bouton d'exportation CSV vous permet de télécharger toutes les données des séances filtrées.
                                        Ce fichier peut être ouvert dans Excel ou tout autre tableur.
                                    </Text>
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.helpModalButton, { backgroundColor: colors.secondary[500] }]}
                                onPress={() => setShowFilterHelp(false)}
                            >
                                <Text style={styles.helpModalButtonText}>J'ai compris</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
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
    filterSection: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
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
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    resultsCard: {
        marginTop: 24,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultsTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
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
    helpModalContent: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
    },
    helpModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    helpModalTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
    },
    helpScrollView: {
        maxHeight: 400,
    },
    helpSection: {
        marginBottom: 16,
    },
    helpSectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        marginBottom: 4,
    },
    helpText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        lineHeight: 20,
    },
    helpModalButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    helpModalButtonText: {
        color: '#fff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
});
