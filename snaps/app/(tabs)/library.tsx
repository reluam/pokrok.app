import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { CourseMap } from '@/components/map/CourseMap';
import { colors } from '@/lib/constants';

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <CourseMap />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
