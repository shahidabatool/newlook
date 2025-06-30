import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ChapterSelectionScreen from '../screens/ChapterSelectionScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsScreen from '../screens/ResultsScreen';
import UKCitizenshipScreen from '../screens/UKCitizenshipScreen';
import CanadianModulesScreen from '../screens/CanadianModulesScreen';
import { theme } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  UKCitizenship: undefined;
  CanadianModules: undefined;
  ChapterSelection: undefined;
  Quiz: {
    mode: 'practice' | 'test' | 'mock';
    moduleId?: number | string;
    chapterId?: string;
  };
  Results: {
    score: number;
    totalQuestions: number;
    chapter: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UKCitizenship"
          component={UKCitizenshipScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CanadianModules"
          component={CanadianModulesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChapterSelection"
          component={ChapterSelectionScreen}
          options={{ title: 'Select Chapter' }}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
          options={({ route }) => ({
            title: route.params.mode === 'practice' 
              ? 'Practice Quiz'
              : route.params.mode === 'test'
              ? 'Test Mode'
              : 'Mock Exam',
            headerLeft: () => null // Prevent going back during quiz
          })}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ 
            title: 'Quiz Results',
            headerLeft: () => null // Prevent going back from results
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 