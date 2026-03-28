import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText, Defs, LinearGradient, Stop, ForeignObject } from 'react-native-svg';
import { Users, Briefcase, Palette, Hammer, Target, User } from 'lucide-react-native';
import { Task, CATEGORY_CONFIGS, TaskCategory } from '@/constants/types';
import { formatDuration } from '@/utils/dateHelpers';
import { COLORS } from '@/constants/theme';

interface TimeWheelProps {
  tasks: Task[];
  scheduledMinutes: number;
  dayName: string;
}

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.85, 380);
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = WHEEL_SIZE / 2 - 20;
const INNER_RADIUS = WHEEL_SIZE / 2 - 90;
const TICK_OUTER = WHEEL_SIZE / 2 - 16;
const TICK_INNER_MAJOR = WHEEL_SIZE / 2 - 32;
const TICK_INNER_MINOR = WHEEL_SIZE / 2 - 24;

// Category icon mapping
const getCategoryIcon = (category: TaskCategory) => {
  switch (category) {
    case 'meeting': return Users;
    case 'working': return Briefcase;
    case 'creative': return Palette;
    case 'building': return Hammer;
    case 'focus': return Target;
    case 'personal': return User;
    default: return Target;
  }
};

export const TimeWheel: React.FC<TimeWheelProps> = React.memo(({ tasks, scheduledMinutes, dayName }) => {
  const taskArcs = useMemo(() => {
    return tasks.map(task => {
      const startAngle = (task.startTime / 1440) * 360 - 90;
      const endAngle = ((task.startTime + task.duration) / 1440) * 360 - 90;
      const config = CATEGORY_CONFIGS[task.category];
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const outerStartX = CENTER + OUTER_RADIUS * Math.cos(startRad);
      const outerStartY = CENTER + OUTER_RADIUS * Math.sin(startRad);
      const outerEndX = CENTER + OUTER_RADIUS * Math.cos(endRad);
      const outerEndY = CENTER + OUTER_RADIUS * Math.sin(endRad);
      
      const innerStartX = CENTER + INNER_RADIUS * Math.cos(startRad);
      const innerStartY = CENTER + INNER_RADIUS * Math.sin(startRad);
      const innerEndX = CENTER + INNER_RADIUS * Math.cos(endRad);
      const innerEndY = CENTER + INNER_RADIUS * Math.sin(endRad);
      
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${outerStartX} ${outerStartY}`,
        `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
        `L ${innerEndX} ${innerEndY}`,
        `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
        'Z',
      ].join(' ');
      
      const labelAngle = (startAngle + endAngle) / 2;
      const labelRad = (labelAngle * Math.PI) / 180;
      const labelRadius = (OUTER_RADIUS + INNER_RADIUS) / 2;
      const labelX = CENTER + labelRadius * Math.cos(labelRad);
      const labelY = CENTER + labelRadius * Math.sin(labelRad);
      
      // Calculate if task is large enough to show icon (minimum 30 minutes)
      const showIcon = task.duration >= 30;

      return {
        id: task.id,
        path: pathData,
        color: config.color,
        gradient: config.gradient,
        category: task.category,
        label: task.title,
        labelX,
        labelY,
        labelAngle: labelAngle + 90,
        showIcon,
        duration: task.duration,
      };
    });
  }, [tasks]);

  const hourTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      
      const isMajor = i % 3 === 0;
      const tickInner = isMajor ? TICK_INNER_MAJOR : TICK_INNER_MINOR;
      
      const x1 = CENTER + TICK_OUTER * Math.cos(rad);
      const y1 = CENTER + TICK_OUTER * Math.sin(rad);
      const x2 = CENTER + tickInner * Math.cos(rad);
      const y2 = CENTER + tickInner * Math.sin(rad);
      
      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isMajor,
      });
      
      if (isMajor) {
        const labelRadius = TICK_INNER_MAJOR - 20;
        const labelX = CENTER + labelRadius * Math.cos(rad);
        const labelY = CENTER + labelRadius * Math.sin(rad);
        
        ticks.push({
          id: `label-${i}`,
          labelX,
          labelY,
          label: i.toString().padStart(2, '0'),
        });
      }
    }
    return ticks;
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        <Defs>
          {taskArcs.map(arc => (
            <LinearGradient
              key={`gradient-${arc.id}`}
              id={`gradient-${arc.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={arc.gradient[0]} stopOpacity="0.95" />
              <Stop offset="100%" stopColor={arc.gradient[1]} stopOpacity="0.95" />
            </LinearGradient>
          ))}
        </Defs>

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />
        
        {hourTicks.map(tick => {
          if ('x1' in tick) {
            return (
              <Path
                key={tick.id}
                d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
                stroke={tick.isMajor ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth={tick.isMajor ? 2.5 : 1}
              />
            );
          } else if ('label' in tick) {
            return (
              <SvgText
                key={tick.id}
                x={tick.labelX}
                y={tick.labelY}
                fill="rgba(255, 255, 255, 0.7)"
                fontSize="13"
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {tick.label}
              </SvgText>
            );
          }
          return null;
        })}
        
        {taskArcs.map(arc => {
          const Icon = getCategoryIcon(arc.category);
          return (
            <G key={arc.id}>
              {/* Task arc with gradient */}
              <Path
                d={arc.path}
                fill={`url(#gradient-${arc.id})`}
              />
              {/* Stroke for depth */}
              <Path
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={2}
                opacity={0.4}
              />
              {/* Category icon */}
              {arc.showIcon && (
                <G
                  x={arc.labelX - 12}
                  y={arc.labelY - 12}
                  rotation={arc.labelAngle}
                  origin={`${arc.labelX}, ${arc.labelY}`}
                >
                  <Icon
                    x={arc.labelX - 12}
                    y={arc.labelY - 12}
                    width={24}
                    height={24}
                    color="rgba(255, 255, 255, 0.9)"
                    strokeWidth={2.5}
                  />
                </G>
              )}
            </G>
          );
        })}
      </Svg>
      
      <View style={styles.centerInfo}>
        <Text style={styles.dayLabel}>{dayName}</Text>
        <Text style={styles.scheduledText}>{formatDuration(scheduledMinutes)} scheduled</Text>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if tasks array changed or scheduledMinutes changed
  return (
    prevProps.tasks.length === nextProps.tasks.length &&
    prevProps.scheduledMinutes === nextProps.scheduledMinutes &&
    prevProps.dayName === nextProps.dayName &&
    prevProps.tasks.every((task, index) =>
      task.id === nextProps.tasks[index]?.id &&
      task.startTime === nextProps.tasks[index]?.startTime &&
      task.duration === nextProps.tasks[index]?.duration &&
      task.category === nextProps.tasks[index]?.category
    )
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  centerInfo: {
    position: 'absolute' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  scheduledText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
