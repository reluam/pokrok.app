import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CourseMap } from '@/components/map/CourseMap';
import { colors } from '@/lib/constants';

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
