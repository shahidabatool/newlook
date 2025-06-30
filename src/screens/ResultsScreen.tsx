import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme, darkTheme } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ResultsScreen({ route }: any) {
  const { score, totalQuestions, questions, userAnswers, mode, chapterName } = route.params;
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const percentage = (score / totalQuestions) * 100;
  const passed = percentage >= 75;

  const getResultMessage = () => {
    if (percentage >= 80) return 'Excellent!';
    if (percentage >= 60) return 'Good job!';
    return 'Keep practicing!';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Quiz Results</Text>
        <Text style={[styles.chapter, { color: theme.colors.textSecondary }]}>{chapterName}</Text>
        <Text style={styles.emoji}>🍁</Text>
        <View style={[styles.scoreContainer, { 
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.cardShadow,
        }]}>
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {score} / {totalQuestions}
          </Text>
          <Text style={[styles.percentage, { color: theme.colors.primary }]}>{percentage.toFixed(0)}%</Text>
          <Text style={[styles.message, { color: passed ? theme.colors.success : theme.colors.error, fontWeight: 'bold' }]}> 
            {passed ? 'Passed' : 'Failed'}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{getResultMessage()}</Text>
        </View>
        {mode === 'mock' && questions && userAnswers && (
          <View style={{ width: '100%' }}>
            <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>Review:</Text>
            {questions.map((q: any, idx: number) => {
              const userAns = userAnswers[idx];
              const isCorrect = userAns === q.correct_answer;
              return (
                <View key={idx} style={[styles.reviewItem, { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.cardShadow,
                }]}>
                  <Text style={[styles.questionText, { color: theme.colors.text }]}>{idx + 1}. {q.question}</Text>
                  <Text style={[styles.answerText, { color: isCorrect ? theme.colors.text : theme.colors.error }]}>
                    Your answer: {userAns || 'No answer'}
                  </Text>
                  <Text style={[styles.correctAnswerText, { color: theme.colors.success }]}>
                    Correct answer: {q.correct_answer}
                  </Text>
                  <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>{q.explanation}</Text>
                </View>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chapter: {
    fontSize: 24,
    marginBottom: 30,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  scoreContainer: {
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  percentage: {
    fontSize: 36,
    marginBottom: 20,
  },
  message: {
    fontSize: 24,
    fontWeight: '500',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 18,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  answerText: {
    fontWeight: 'bold',
  },
  correctAnswerText: {
    fontWeight: 'bold',
  },
  explanationText: {
    marginTop: 4,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 