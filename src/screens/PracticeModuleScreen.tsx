import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme, darkTheme } from '../theme/theme';
import { getChapters, getQuestionsForChapter } from '../utils/questionUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PracticeModuleScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChapters().then(chapters => {
      setChapters(chapters);
      setLoading(false);
    });
  }, []);

  const handleChapterSelect = async (chapterName: string) => {
    const chapterQuestions = await getQuestionsForChapter(chapterName);
    navigation.navigate('Quiz', {
      questions: chapterQuestions,
      mode: 'practice',
      chapterName
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.title}>Practice Modules</Text>
      </View>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Select a chapter to practice questions from that topic.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 40}} />
      ) : (
        <View style={styles.chaptersContainer}>
          {chapters.map((chapterName, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.chapterButton, { 
                backgroundColor: theme.colors.card,
                shadowColor: theme.colors.cardShadow,
              }]}
              onPress={() => handleChapterSelect(chapterName)}
            >
              <Text style={styles.emoji}>🍁</Text>
              <Text style={[styles.chapterName, { color: theme.colors.text }]}>{chapterName}</Text>
              {/* Optionally, you can show question count if needed by fetching questions here */}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  chaptersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  chapterButton: {
    padding: 20,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chapterName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  questionCount: {
    fontSize: 14,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
});

export default PracticeModuleScreen; 