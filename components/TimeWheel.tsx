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
const WHEEL_SIZE = Math.min(width * 0.75, 380);
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = WHEEL_SIZE / 2 - 20;
const INNER_RADIUS = WHEEL_SIZE / 2 - 90;
const TICK_OUTER = WHEEL_SIZE / 2 - 15;
const TICK_INNER_MAJOR = WHEEL_SIZE / 2 - 35;
const TICK_INNER_MINOR = WHEEL_SIZE / 2 - 25;

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
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth={1}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth={1}
        />
        
        {hourTicks.map(tick => {
          if ('x1' in tick) {
            return (
              <Path
                key={tick.id}
                d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
                stroke={tick.isMajor ? '#444' : '#222'}
                strokeWidth={tick.isMajor ? 2 : 1}
              />
            );
          } else if ('label' in tick) {
            return (
              <SvgText
                key={tick.id}
                x={tick.labelX}
                y={tick.labelY}
                fill="#666"
                fontSize="12"
                fontWeight="500"
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
              opacity={0.9}
            />
            <SvgText
              x={arc.labelX}
              y={arc.labelY}
              fill="#FFF"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
              rotation={arc.labelAngle}
              origin={`${arc.labelX}, ${arc.labelY}`}
            >
              {arc.label}
            </SvgText>
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
    position: 'relative',
  },
  centerInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scheduledText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '400',
  },
});
