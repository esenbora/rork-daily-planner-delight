import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { Task, CATEGORY_CONFIGS } from '@/constants/types';
import { formatDuration } from '@/utils/dateHelpers';

interface TimeWheelProps {
  tasks: Task[];
  scheduledMinutes: number;
  dayName: string;
}

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.8, 360);
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = WHEEL_SIZE / 2 - 24;
const INNER_RADIUS = WHEEL_SIZE / 2 - 80;
const TICK_OUTER = WHEEL_SIZE / 2 - 18;
const TICK_INNER_MAJOR = WHEEL_SIZE / 2 - 38;
const TICK_INNER_MINOR = WHEEL_SIZE / 2 - 28;

export const TimeWheel: React.FC<TimeWheelProps> = ({ tasks, scheduledMinutes, dayName }) => {
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
      
      return {
        id: task.id,
        path: pathData,
        color: config.color,
        label: task.title,
        labelX,
        labelY,
        labelAngle: labelAngle + 90,
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
      <View style={styles.wheelShadow} />
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS + 4}
          fill="none"
          stroke="rgba(139, 122, 199, 0.15)"
          strokeWidth={8}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="#1A1A2E"
          strokeWidth={2}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="#1A1A2E"
          strokeWidth={2}
        />
        
        {hourTicks.map(tick => {
          if ('x1' in tick) {
            return (
              <Path
                key={tick.id}
                d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
                stroke={tick.isMajor ? 'rgba(139, 122, 199, 0.5)' : 'rgba(139, 122, 199, 0.2)'}
                strokeWidth={tick.isMajor ? 2.5 : 1.5}
              />
            );
          } else if ('label' in tick) {
            return (
              <SvgText
                key={tick.id}
                x={tick.labelX}
                y={tick.labelY}
                fill="#8B7AC7"
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
        
        {taskArcs.map(arc => (
          <G key={arc.id}>
            <Path
              d={arc.path}
              fill={arc.color}
              opacity={0.85}
            />
            <Path
              d={arc.path}
              fill="url(#gradient)"
              opacity={0.3}
            />
          </G>
        ))}
      </Svg>
      
      <View style={styles.centerInfo}>
        <Text style={styles.dayLabel}>{dayName}</Text>
        <Text style={styles.scheduledText}>{formatDuration(scheduledMinutes)} scheduled</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  wheelShadow: {
    position: 'absolute' as const,
    width: WHEEL_SIZE - 40,
    height: WHEEL_SIZE - 40,
    borderRadius: (WHEEL_SIZE - 40) / 2,
    backgroundColor: 'rgba(139, 122, 199, 0.1)',
    shadowColor: '#8B7AC7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  centerInfo: {
    position: 'absolute' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 60,
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: 'rgba(139, 122, 199, 0.3)',
  },
  dayLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  scheduledText: {
    fontSize: 12,
    color: '#8B7AC7',
    fontWeight: '600',
  },
});
