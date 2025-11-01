import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, BarChart3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '@/contexts/TaskContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getWeekStart, getWeekDays, getShortDayName, formatDate } from '@/utils/dateHelpers';
import { logAnalyticsEvent } from '@/lib/firebase';

const CHART_HEIGHT = 300;

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks } = useTasks();
  const { isPremium } = useSubscription();
  const [selectedWeekStart] = useState<Date>(getWeekStart(new Date()));

  useEffect(() => {
    logAnalyticsEvent('screen_view', {
      screen_name: 'statistics',
      screen_class: 'StatisticsScreen',
      is_premium: isPremium,
    });
  }, [isPremium]);

  const weekDays = useMemo(() => getWeekDays(selectedWeekStart), [selectedWeekStart]);

  const weekStats = useMemo(() => {
    return weekDays.map(day => {
      const dateStr = formatDate(day);
      const dayTasks = tasks.filter(task => task.date === dateStr);
      const completed = dayTasks.filter(t => t.completed).length;
      const notCompleted = dayTasks.length - completed;
      return {
        day,
        total: dayTasks.length,
        completed,
        notCompleted,
      };
    });
  }, [tasks, weekDays]);

  const maxValue = Math.max(...weekStats.map(s => s.total), 1);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistics</Text>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.premiumPrompt}>
          <BarChart3 size={64} color="#FFD700" />
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumDescription}>
            Unlock statistics to visualize your productivity and track task completion over time
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          
          <View style={styles.overallStats}>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue}>
                {weekStats.reduce((sum, s) => sum + s.total, 0)}
              </Text>
              <Text style={styles.overallStatLabel}>Total Tasks</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: '#7AC79B' }]}>
                {weekStats.reduce((sum, s) => sum + s.completed, 0)}
              </Text>
              <Text style={styles.overallStatLabel}>Completed</Text>
            </View>
            <View style={styles.overallStatItem}>
              <Text style={[styles.overallStatValue, { color: '#C75B6E' }]}>
                {weekStats.reduce((sum, s) => sum + s.notCompleted, 0)}
              </Text>
              <Text style={styles.overallStatLabel}>Not Done</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {weekStats.map((stat, index) => {
                const completedHeight = (stat.completed / maxValue) * CHART_HEIGHT;
                const notCompletedHeight = (stat.notCompleted / maxValue) * CHART_HEIGHT;
                
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      {stat.total > 0 ? (
                        <>
                          <View 
                            style={[
                              styles.barSegment, 
                              { 
                                height: notCompletedHeight,
                                backgroundColor: '#C75B6E',
                              }
                            ]} 
                          />
                          <View 
                            style={[
                              styles.barSegment, 
                              { 
                                height: completedHeight,
                                backgroundColor: '#7AC79B',
                              }
                            ]} 
                          />
                        </>
                      ) : (
                        <View style={[styles.barSegment, { height: 4, backgroundColor: '#1A1A1A' }]} />
                      )}
                    </View>
                    <Text style={styles.barLabel}>{getShortDayName(stat.day)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#7AC79B' }]} />
              <Text style={styles.legendLabel}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#C75B6E' }]} />
              <Text style={styles.legendLabel}>Not Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.dailyBreakdown}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {weekStats.map((stat, index) => (
            <View key={index} style={styles.dailyItem}>
              <Text style={styles.dailyDay}>{getShortDayName(stat.day)}</Text>
              <View style={styles.dailyProgress}>
                <View style={styles.dailyProgressBar}>
                  {stat.total > 0 && (
                    <View 
                      style={[
                        styles.dailyProgressFill, 
                        { 
                          width: `${(stat.completed / stat.total) * 100}%`,
                          backgroundColor: '#7AC79B',
                        }
                      ]} 
                    />
                  )}
                </View>
                <Text style={styles.dailyStats}>
                  {stat.completed}/{stat.total}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  premiumPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 16,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  statsCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  overallStatItem: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8B7AC7',
    marginBottom: 4,
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    gap: 12,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: CHART_HEIGHT,
    gap: 2,
  },
  barSegment: {
    width: 32,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  dailyBreakdown: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  dailyDay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    width: 40,
  },
  dailyProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#0A0A0A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dailyProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  dailyStats: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B7AC7',
    minWidth: 40,
    textAlign: 'right',
  },
});
