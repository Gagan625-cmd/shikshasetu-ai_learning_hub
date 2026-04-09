import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="content" />
      <Stack.Screen name="icse-content" />
      <Stack.Screen name="generate" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="interview" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="performance" />
      <Stack.Screen name="useful-link" />
      <Stack.Screen name="voice-assistant" />
      <Stack.Screen name="about" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="handwritten-notes" />
      <Stack.Screen name="quick-revision" />
      <Stack.Screen name="exam-scanner" />
      <Stack.Screen name="comic-learn" />
    </Stack>
  );
}
