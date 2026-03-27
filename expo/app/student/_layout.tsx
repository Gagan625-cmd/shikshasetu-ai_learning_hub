import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="content" />
      <Stack.Screen name="icse-content" />
      <Stack.Screen name="generate" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="interview" />
      <Stack.Screen name="performance" />
      <Stack.Screen name="exam-scanner" />
      <Stack.Screen name="study-os" />
      <Stack.Screen name="useful-link" />
      <Stack.Screen name="competition" />
      <Stack.Screen name="fun-learning" />
      <Stack.Screen name="comic-learn" />
      <Stack.Screen name="about" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="flashcards" />
    </Stack>
  );
}
