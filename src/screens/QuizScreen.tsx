import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme, darkTheme } from '../theme/theme';
import FuturisticButton from '../components/FuturisticButton';
import { questions as canadaQuestions } from '../data/questions';
import { ukQuestions, getRandomUKQuestions } from '../data/uk-questions';

const { width, height } = Dimensions.get('window');

interface Question {
  id: string;
  moduleId: string | number;
  question: string;
  answers?: string[];
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizScreenProps {
  navigation: any;
  route: {
    params: {
      country?: 'canada' | 'uk';
      mode: 'mock' | 'quiz' | 'practice';
      chapterName?: string;
      questions?: Question[];
      moduleTitle?: string;
    };
  };
}

const QuizScreen: React.FC<QuizScreenProps> = ({ navigation, route }) => {
  const { country = 'canada', mode, chapterName, moduleTitle } = route.params;
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  // Load questions based on country and mode
  const getQuestions = (): Question[] => {
    if (country === 'canada') {
      if (mode === 'mock') {
        // Random 20 questions for mock test
        const shuffled = [...canadaQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 20);
      } else {
        // All questions for practice
        return canadaQuestions;
      }
    } else {
      if (mode === 'mock') {
        return getRandomUKQuestions(24); // UK mock test has 24 questions
      } else {
        return ukQuestions;
      }
    }
  };

  const questions = getQuestions();
  const isMockTest = mode === 'mock';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes for mock test
  const [isTimerRunning, setIsTimerRunning] = useState(isMockTest);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Glow animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestionIndex + 1) / questions.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const glowStyle = {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 20],
    }),
  };

  const progressStyle = {
    width: progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);

    if (!isMockTest) {
      // Show immediate feedback for practice mode
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          setShowResults(true);
        }
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinishQuiz = () => {
    setIsTimerRunning(false);
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswerSelected = selectedAnswers[currentQuestionIndex] !== '';
  const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer;
  const score = calculateScore();

  if (showResults) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />

        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Animated.View
            style={[
              styles.resultsHeader,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
              QUIZ COMPLETE
            </Text>
            <Text style={[styles.resultsSubtitle, { color: theme.colors.neonPurple }]}>
              {moduleTitle}
            </Text>
          </Animated.View>

          {/* Score Display */}
          <Animated.View
            style={[
              styles.scoreContainer,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.neonBlue,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
              glowStyle,
            ]}
          >
            <View style={styles.scoreHeader}>
              <Text style={[styles.scoreLabel, { color: theme.colors.text }]}>
                FINAL SCORE
              </Text>
              <Text style={[styles.scoreValue, { color: theme.colors.neonBlue }]}>
                {score.correct}/{score.total}
              </Text>
              <Text style={[styles.scorePercentage, { color: theme.colors.neonGreen }]}>
                {score.percentage}%
              </Text>
            </View>

            {/* Progress bar */}
            <View style={[
              styles.scoreProgressBar,
              { backgroundColor: theme.colors.backgroundSecondary }
            ]}>
              <Animated.View
                style={[
                  styles.scoreProgressFill,
                  {
                    backgroundColor: score.percentage >= 80 ? theme.colors.neonGreen :
                                   score.percentage >= 60 ? theme.colors.neonBlue :
                                   theme.colors.error,
                  },
                  progressStyle,
                ]}
              />
            </View>
          </Animated.View>

          {/* Question Review */}
          <View style={styles.reviewContainer}>
            <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
              DETAILED REVIEW
            </Text>
            
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrectAnswer = userAnswer === question.correctAnswer;
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.reviewItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: isCorrectAnswer ? theme.colors.neonGreen : theme.colors.error,
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.questionNumber, { color: theme.colors.text }]}>
                      Q{index + 1}
                    </Text>
                    <View style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: isCorrectAnswer ? theme.colors.neonGreen : theme.colors.error,
                      }
                    ]}>
                      <Text style={styles.statusText}>
                        {isCorrectAnswer ? '✓' : '✗'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reviewQuestion, { color: theme.colors.text }]}>
                    {question.question}
                  </Text>

                  <View style={styles.reviewOptions}>
                    {(question.answers || question.options || []).map((option, optionIndex) => {
                      const isSelected = userAnswer === option;
                      const isCorrect = option === question.correctAnswer;
                      
                      return (
                        <View
                          key={optionIndex}
                          style={[
                            styles.reviewOption,
                            {
                              backgroundColor: isCorrect ? theme.colors.neonGreen :
                                             isSelected && !isCorrect ? theme.colors.error :
                                             theme.colors.backgroundSecondary,
                              borderColor: isCorrect ? theme.colors.neonGreen :
                                         isSelected && !isCorrect ? theme.colors.error :
                                         theme.colors.border,
                            }
                          ]}
                        >
                          <Text style={[
                            styles.reviewOptionText,
                            {
                              color: isCorrect || (isSelected && !isCorrect) ? theme.colors.text :
                                     theme.colors.textSecondary,
                            }
                          ]}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Text>
                          {isCorrect && (
                            <Text style={[styles.correctIndicator, { color: theme.colors.neonGreen }]}>
                              ✓ CORRECT
                            </Text>
                          )}
                          {isSelected && !isCorrect && (
                            <Text style={[styles.incorrectIndicator, { color: theme.colors.error }]}>
                              ✗ YOUR ANSWER
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {question.explanation && (
                    <View style={[
                      styles.explanationContainer,
                      { backgroundColor: theme.colors.backgroundSecondary }
                    ]}>
                      <Text style={[styles.explanationLabel, { color: theme.colors.neonBlue }]}>
                        EXPLANATION:
                      </Text>
                      <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
                        {question.explanation}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <FuturisticButton
              title="Try Again"
              onPress={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswers(new Array(questions.length).fill(-1));
                setShowResults(false);
                setTimeLeft(30 * 60);
                setIsTimerRunning(isMockTest);
              }}
              variant="secondary"
              style={styles.actionButton}
            />
            <FuturisticButton
              title="Back to Home"
              onPress={() => navigation.navigate('Home')}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.neonBlue,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          glowStyle,
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
            {moduleTitle}
          </Text>
          <Text style={[styles.questionCounter, { color: theme.colors.neonBlue }]}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[
          styles.progressContainer,
          { backgroundColor: theme.colors.backgroundSecondary }
        ]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.neonBlue,
              },
              progressStyle,
            ]}
          />
        </View>

        {/* Timer for mock test */}
        {isMockTest && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
              TIME REMAINING
            </Text>
            <Text style={[
              styles.timerValue,
              {
                color: timeLeft < 300 ? theme.colors.error : theme.colors.neonGreen,
              }
            ]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Question Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.questionContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.neonPurple,
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
            glowStyle,
          ]}
        >
          <Text style={[styles.questionText, { color: theme.colors.text }]}>
            {currentQuestion.question}
          </Text>
        </Animated.View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {(currentQuestion.answers || currentQuestion.options || []).map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const showFeedback = !isMockTest && isAnswerSelected;

            let optionStyle = {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            };

            if (showFeedback) {
              if (isCorrect) {
                optionStyle = {
                  backgroundColor: theme.colors.neonGreen,
                  borderColor: theme.colors.neonGreen,
                };
              } else if (isSelected && !isCorrect) {
                optionStyle = {
                  backgroundColor: theme.colors.error,
                  borderColor: theme.colors.error,
                };
              }
            } else if (isSelected) {
              optionStyle = {
                backgroundColor: theme.colors.neonBlue,
                borderColor: theme.colors.neonBlue,
              };
            }

            return (
              <Animated.View
                key={index}
                style={[
                  styles.optionContainer,
                  optionStyle,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: pulseAnim },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={showFeedback}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionIndicator,
                      {
                        backgroundColor: isSelected ? theme.colors.text : theme.colors.cyberGray,
                        borderColor: theme.colors.neonGreen,
                      }
                    ]}>
                      <Text style={[
                        styles.optionLetter,
                        {
                          color: isSelected ? theme.colors.card : theme.colors.textSecondary,
                        }
                      ]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      {
                        color: showFeedback ? theme.colors.text : theme.colors.text,
                      }
                    ]}>
                      {option}
                    </Text>
                  </View>

                  {/* Feedback indicators */}
                  {showFeedback && (
                    <View style={styles.feedbackContainer}>
                      {isCorrect && (
                        <Text style={[styles.feedbackText, { color: theme.colors.neonGreen }]}>
                          ✓ CORRECT
                        </Text>
                      )}
                      {isSelected && !isCorrect && (
                        <Text style={[styles.feedbackText, { color: theme.colors.error }]}>
                          ✗ INCORRECT
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <FuturisticButton
            title="Previous"
            onPress={handlePreviousQuestion}
            variant="secondary"
            disabled={currentQuestionIndex === 0}
            style={styles.navButton}
          />
          
          <FuturisticButton
            title={currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            onPress={handleNextQuestion}
            variant="primary"
            disabled={!isAnswerSelected}
            style={styles.navButton}
          />
        </View>

        {/* Finish Quiz Button for Mock Test */}
        {isMockTest && (
          <View style={styles.finishContainer}>
            <FuturisticButton
              title="Finish Quiz Now"
              onPress={handleFinishQuiz}
              variant="danger"
              style={styles.finishButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 5,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  questionContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  optionContainer: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  optionButton: {
    padding: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  feedbackContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 20,
  },
  navButton: {
    flex: 1,
  },
  finishContainer: {
    alignItems: 'center',
  },
  finishButton: {
    minWidth: 200,
  },
  // Results styles
  resultsContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  scoreContainer: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    borderWidth: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scoreProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  reviewContainer: {
    marginBottom: 30,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  reviewQuestion: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 15,
  },
  reviewOptions: {
    gap: 10,
    marginBottom: 15,
  },
  reviewOption: {
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  reviewOptionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  correctIndicator: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 5,
  },
  incorrectIndicator: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 5,
  },
  explanationContainer: {
    borderRadius: 12,
    padding: 15,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
  },
});

export default QuizScreen; 