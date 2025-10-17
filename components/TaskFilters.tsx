import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { TaskCategory, CATEGORY_CONFIGS, TaskPriority } from '@/constants/types';

export interface FilterState {
  search: string;
  categories: TaskCategory[];
  priorities: TaskPriority[];
  showCompleted: boolean;
}

interface TaskFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, search: text });
  };

  const toggleCategory = (category: TaskCategory) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories });
  };

  const togglePriority = (priority: TaskPriority) => {
    const priorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      priorities: [],
      showCompleted: true,
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.priorities.length > 0 ||
    !filters.showCompleted;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#666"
            value={filters.search}
            onChangeText={handleSearchChange}
          />
          {filters.search.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearchChange('')}
              style={styles.clearButton}
            >
              <X size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showAdvanced && styles.filterButtonActive,
          ]}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal size={18} color={showAdvanced ? '#8B7AC7' : '#888'} />
        </TouchableOpacity>
      </View>

      {showAdvanced && (
        <View style={styles.advancedFilters}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {Object.entries(CATEGORY_CONFIGS).map(([key, config]) => {
                const category = key as TaskCategory;
                const isSelected = filters.categories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      isSelected && {
                        backgroundColor: config.color,
                        borderColor: config.color,
                      },
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Priority</Text>
            <View style={styles.filterRow}>
              {(['high', 'medium', 'low'] as TaskPriority[]).map((priority) => {
                const isSelected = filters.priorities.includes(priority);
                const color =
                  priority === 'high'
                    ? '#C75B6E'
                    : priority === 'medium'
                    ? '#A88E4F'
                    : '#7AC79B';
                return (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.filterChip,
                      isSelected && {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                    onPress={() => togglePriority(priority)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() =>
                onFiltersChange({
                  ...filters,
                  showCompleted: !filters.showCompleted,
                })
              }
            >
              <Text style={styles.filterLabel}>Show Completed</Text>
              <View
                style={[
                  styles.toggle,
                  filters.showCompleted && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    filters.showCompleted && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFF',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: '#8B7AC720',
  },
  advancedFilters: {
    marginTop: 16,
    gap: 16,
  },
  filterSection: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterScroll: {
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    borderWidth: 1.5,
    borderColor: '#333',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: '#8B7AC7',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  clearFiltersButton: {
    backgroundColor: '#C75B6E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
