import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { CATEGORY_CONFIGS, type TaskCategory } from '@/constants/types';

interface OnboardingMiniWheelProps {
  task?: {
    category: TaskCategory;
    startHour: number;
    startMinute: number;
    duration: number;
  };
}

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.6, 240);
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = WHEEL_SIZE / 2 - 10;
const INNER_RADIUS = WHEEL_SIZE / 2 - 50;

export function OnboardingMiniWheel({ task }: OnboardingMiniWheelProps) {
  // Generate time ticks (every 3 hours for mini wheel)
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const hour = i * 3;
    const angle = (hour * 15 - 90) * (Math.PI / 180);
    const x1 = CENTER + Math.cos(angle) * (OUTER_RADIUS - 5);
    const y1 = CENTER + Math.sin(angle) * (OUTER_RADIUS - 5);
    const x2 = CENTER + Math.cos(angle) * (INNER_RADIUS + 5);
    const y2 = CENTER + Math.sin(angle) * (INNER_RADIUS + 5);
    const textX = CENTER + Math.cos(angle) * (OUTER_RADIUS + 15);
    const textY = CENTER + Math.sin(angle) * (OUTER_RADIUS + 15);

    return { hour, x1, y1, x2, y2, textX, textY };
  });

  // Generate task arc if task exists
  const getTaskArc = () => {
    if (!task) return null;

    const startMinutes = task.startHour * 60 + task.startMinute;
    const endMinutes = startMinutes + task.duration;

    const startAngle = (startMinutes / 4 - 90) * (Math.PI / 180);
    const endAngle = (endMinutes / 4 - 90) * (Math.PI / 180);

    const config = CATEGORY_CONFIGS[task.category];

    // Calculate arc path
    const x1 = CENTER + Math.cos(startAngle) * OUTER_RADIUS;
    const y1 = CENTER + Math.sin(startAngle) * OUTER_RADIUS;
    const x2 = CENTER + Math.cos(endAngle) * OUTER_RADIUS;
    const y2 = CENTER + Math.sin(endAngle) * OUTER_RADIUS;
    const x3 = CENTER + Math.cos(endAngle) * INNER_RADIUS;
    const y3 = CENTER + Math.sin(endAngle) * INNER_RADIUS;
    const x4 = CENTER + Math.cos(startAngle) * INNER_RADIUS;
    const y4 = CENTER + Math.sin(startAngle) * INNER_RADIUS;

    const largeArc = task.duration > 720 ? 1 : 0;

    return (
      <Path
        d={`
          M ${x1} ${y1}
          A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `}
        fill={config.color}
        opacity={0.9}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        {/* Outer circle */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />

        {/* Inner circle */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />

        {/* Ticks */}
        <G>
          {ticks.map(({ hour, x1, y1, x2, y2, textX, textY }) => (
            <G key={hour}>
              <Path
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={1.5}
              />
              <SvgText
                x={textX}
                y={textY}
                fill="rgba(255, 255, 255, 0.5)"
                fontSize="10"
                fontWeight="400"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}
              </SvgText>
            </G>
          ))}
        </G>

        {/* Task arc */}
        {getTaskArc()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
