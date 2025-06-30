import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme, darkTheme } from '../theme/theme';
import questions from '../../assets/uk_questions_extended.json';

const UKQuizScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode, chapterName } = route.params as { 
    mode: 'practice' | 'mock' | 'quiz',
    chapterName: string 
  };

  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let selectedQuestions: any[] = [];

    if (mode === 'practice') {
      // For practice mode, get questions from specific chapter
      const chapter = questions[0].chapters.find(
        (ch: any) => ch.chapterName === chapterName
      );
      selectedQuestions = chapter ? chapter.questions : [];
    } else {
      // For mock/quiz mode, get random questions from all chapters
      const allQuestions = questions[0].chapters.reduce((acc: any[], chapter: any) => {
        return [...acc, ...chapter.questions];
      }, []);

      // Randomly select 24 questions
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, 24);
    }

    setQuizQuestions(selectedQuestions);
    setUserAnswers(new Array(selectedQuestions.length).fill(''));
    setLoading(false);
    
    // Start timer for mock and quiz modes
    if (mode === 'mock' || mode === 'quiz') {
      setTimerActive(true);
    }
  }, [mode, chapterName]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeLeft > 0 && !quizCompleted) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setTimerActive(false);
            setQuizCompleted(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerActive, timeLeft, quizCompleted]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (currentQuestionIndex / quizQuestions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    
    // Store user's answer
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newUserAnswers);
    
    // For mock mode, don't show explanation immediately
    if (mode === 'mock') {
      if (answer === quizQuestions[currentQuestionIndex].correct_answer) {
        setScore(score + 1);
      }
    } else {
      // For practice mode, show explanation immediately
      setShowExplanation(true);
      if (answer === quizQuestions[currentQuestionIndex].correct_answer) {
        setScore(score + 1);
      }
    }
  };

  const handleNext = () => {
    if (mode === 'mock') {
      // For mock mode, just move to next question without showing explanation
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || null);
        setShowExplanation(false);
      } else {
        setQuizCompleted(true);
        setTimerActive(false);
      }
    } else {
      // For practice mode, show explanation first
      if (!showExplanation) return;
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || null);
        setShowExplanation(false);
      } else {
        setQuizCompleted(true);
        setTimerActive(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || null);
      setShowExplanation(false);
    }
  };

  const handleFinish = () => {
    navigation.navigate('Results', {
      score,
      total: quizQuestions.length,
      mode,
      chapterName
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Error</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>No questions available</Text>
      </View>
    );
  }

  if (quizCompleted) {
    const percent = (score / quizQuestions.length) * 100;
    const passed = score >= 18;
    const timeExpired = timeLeft === 0;
    
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.title}>Quiz Completed!</Text>
          {timeExpired && (
            <Text style={[styles.scoreText, { color: theme.colors.error, fontWeight: 'bold' }]}>
              Time's up!
            </Text>
          )}
          <Text style={[styles.scoreText, { color: '#fff' }]}>
            Your Score: {score} out of {quizQuestions.length}
            ({percent.toFixed(1)}%)
          </Text>
          <Text style={[styles.scoreText, { color: passed ? theme.colors.success : theme.colors.error, fontWeight: 'bold' }]}> 
            {passed ? 'Passed' : 'Failed'}
          </Text>
        </View>

        {/* Show all questions with answers for mock mode */}
        {mode === 'mock' && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>Question Review:</Text>
            {quizQuestions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correct_answer;
              const isAnswered = userAnswer !== '';
              
              return (
                <View key={index} style={[styles.questionReviewContainer, { 
                  backgroundColor: theme.colors.card,
                  shadowColor: theme.colors.cardShadow,
                }]}>
                  <Text style={[styles.questionReviewText, { color: theme.colors.text }]}>
                    <Text style={[styles.questionNumber, { color: theme.colors.primary }]}>Q{index + 1}: </Text>
                    {question.question}
                  </Text>
                  
                  <View style={styles.optionsReviewContainer}>
                    {question.options.map((option: string, optionIndex: number) => {
                      const isUserAnswer = userAnswer === option;
                      const isCorrectAnswer = option === question.correct_answer;
                      
                      let optionStyle = [styles.optionReviewButton, { 
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderColor: theme.colors.border,
                      }];
                      let textStyle = [styles.optionReviewText, { color: theme.colors.textSecondary }];
                      
                      if (isCorrectAnswer) {
                        optionStyle = [styles.optionReviewButton, styles.correctOptionReview];
                        textStyle = [styles.optionReviewText, styles.correctOptionReviewText];
                      } else if (isUserAnswer && !isCorrect) {
                        optionStyle = [styles.optionReviewButton, styles.incorrectOptionReview];
                        textStyle = [styles.optionReviewText, styles.incorrectOptionReviewText];
                      }
                      
                      return (
                        <View key={optionIndex} style={optionStyle}>
                          <Text style={textStyle}>
                            {option}
                            {isCorrectAnswer && ' ✓'}
                            {isUserAnswer && !isCorrect && ' ✗'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  
                  {!isAnswered && (
                    <Text style={[styles.notAnsweredText, { color: theme.colors.textSecondary }]}>Not answered</Text>
                  )}
                  
                  {question.explanation && (
                    <View style={[styles.explanationReviewContainer, { 
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderLeftColor: theme.colors.primary,
                    }]}>
                      <Text style={[styles.explanationReviewTitle, { color: theme.colors.text }]}>Explanation:</Text>
                      <Text style={[styles.explanationReviewText, { color: theme.colors.textSecondary }]}>{question.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.finishButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleFinish}
        >
          <Text style={styles.finishButtonText}>View Results</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.title}>{chapterName}</Text>
        
        {/* Timer and Progress Bar for Mock/Quiz modes */}
        {(mode === 'mock' || mode === 'quiz') && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, timeLeft <= 300 && styles.timerWarning]}>
              Time: {formatTime(timeLeft)}
            </Text>
          </View>
        )}
        
        <Text style={styles.progress}>
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progressPercentage.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: theme.colors.text }]}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: theme.colors.card,
                  shadowColor: theme.colors.cardShadow,
                },
                selectedAnswer === option && { backgroundColor: theme.colors.primary },
                // Only show correct/incorrect for practice mode
                mode !== 'mock' && showExplanation && option === currentQuestion.correct_answer && { backgroundColor: theme.colors.success },
                mode !== 'mock' && showExplanation && selectedAnswer === option && 
                option !== currentQuestion.correct_answer && { backgroundColor: theme.colors.error },
              ]}
              onPress={() => handleAnswerSelect(option)}
              disabled={mode !== 'mock' && showExplanation}
            >
              <Text style={[
                styles.optionText,
                { color: theme.colors.text },
                selectedAnswer === option && styles.selectedOptionText,
                // Only show correct/incorrect text for practice mode
                mode !== 'mock' && showExplanation && option === currentQuestion.correct_answer && styles.correctOptionText,
                mode !== 'mock' && showExplanation && selectedAnswer === option && 
                option !== currentQuestion.correct_answer && styles.incorrectOptionText,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Only show explanation for practice mode */}
        {mode !== 'mock' && showExplanation && currentQuestion.explanation && (
          <View style={[styles.explanationContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.explanationTitle, { color: theme.colors.text }]}>Explanation:</Text>
            <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>{currentQuestion.explanation}</Text>
          </View>
        )}

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton, 
              { backgroundColor: theme.colors.primary },
              currentQuestionIndex === 0 && styles.disabledButton
            ]}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton, 
              { backgroundColor: theme.colors.primary },
              mode !== 'mock' && !showExplanation && styles.disabledButton,
              mode === 'mock' && !selectedAnswer && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={mode !== 'mock' ? !showExplanation : !selectedAnswer}
          >
            <Text style={styles.navButtonText}>
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  timerContainer: {
    marginBottom: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  timerWarning: {
    color: '#ff6b6b',
  },
  progress: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  questionContainer: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#fff',
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  explanationContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
  },
  finishButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // New styles for mock test results
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionReviewContainer: {
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
  },
  questionReviewText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  questionNumber: {
    fontWeight: 'bold',
  },
  optionsReviewContainer: {
    gap: 8,
    marginBottom: 12,
  },
  optionReviewButton: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  correctOptionReview: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  incorrectOptionReview: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  optionReviewText: {
    fontSize: 14,
  },
  correctOptionReviewText: {
    color: '#155724',
    fontWeight: '600',
  },
  incorrectOptionReviewText: {
    color: '#721c24',
    fontWeight: '600',
  },
  notAnsweredText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  explanationReviewContainer: {
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  explanationReviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  explanationReviewText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default UKQuizScreen; 