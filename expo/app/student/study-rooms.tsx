import { useRouter } from 'expo-router';
import { ChevronLeft, Users, Plus, Lock, Unlock, Crown, MessageSquare, Trophy, BookOpen, Loader2, Send, Copy, LogOut, UserPlus, Share2, Brain } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, TextInput, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/contexts/subscription-context';
import PremiumGate from '@/components/PremiumGate';
import { useMutation } from '@tanstack/react-query';
import { robustGenerateObject } from '@/lib/ai-generate';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  createdBy: string;
  createdByName: string;
  isPrivate: boolean;
  code: string;
  members: RoomMember[];
  messages: RoomMessage[];
  quizChallenges: QuizChallenge[];
  sharedNotes: SharedNote[];
  createdAt: string;
}

interface RoomMember {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  joinedAt: string;
  isOnline: boolean;
  lastActive: string;
}

interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'note' | 'quiz-challenge' | 'system';
  timestamp: string;
}

interface QuizChallenge {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  createdBy: string;
  createdByName: string;
  answers: Record<string, number>;
  createdAt: string;
}

interface SharedNote {
  id: string;
  title: string;
  content: string;
  sharedBy: string;
  sharedByName: string;
  sharedAt: string;
}

const QuizChallengeSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
});

const AVATAR_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function MemberAvatar({ member, size = 40 }: { member: RoomMember; size?: number }) {
  const color = getAvatarColor(member.name);
  return (
    <View style={[avatarStyles.container, { width: size, height: size, borderRadius: size / 3, backgroundColor: color }]}>
      <Text style={[avatarStyles.text, { fontSize: size * 0.38 }]}>{getInitials(member.name)}</Text>
      {member.isOnline && <View style={[avatarStyles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} />}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', position: 'relative' as const },
  text: { color: '#ffffff', fontWeight: '800' as const },
  onlineDot: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

function QuizChallengeCard({ challenge, userId, onAnswer, isDark }: {
  challenge: QuizChallenge;
  userId: string;
  onAnswer: (challengeId: string, answer: number) => void;
  isDark: boolean;
}) {
  const hasAnswered = userId in challenge.answers;
  const userAnswer = challenge.answers[userId];
  const totalAnswers = Object.keys(challenge.answers).length;

  return (
    <View style={[quizStyles.card, { backgroundColor: isDark ? '#132640' : '#f0f7ff', borderColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
      <View style={quizStyles.header}>
        <Trophy size={16} color="#f59e0b" />
        <Text style={[quizStyles.label, { color: isDark ? '#fcd34d' : '#92400e' }]}>Quiz Challenge by {challenge.createdByName}</Text>
      </View>
      <Text style={[quizStyles.question, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{challenge.question}</Text>
      {challenge.options.map((opt, i) => {
        const isCorrect = i === challenge.correctAnswer;
        const isUserAnswer = userAnswer === i;
        let optStyle = {};
        if (hasAnswered) {
          if (isCorrect) optStyle = { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: '#22c55e' };
          else if (isUserAnswer && !isCorrect) optStyle = { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' };
        }
        return (
          <TouchableOpacity
            key={i}
            style={[quizStyles.option, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : '#e2e8f0' }, optStyle]}
            onPress={() => { if (!hasAnswered) onAnswer(challenge.id, i); }}
            disabled={hasAnswered}
          >
            <Text style={[quizStyles.optionText, { color: isDark ? '#b8d0e8' : '#475569' }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
      {hasAnswered && (
        <Text style={[quizStyles.resultText, { color: userAnswer === challenge.correctAnswer ? '#22c55e' : '#ef4444' }]}>
          {userAnswer === challenge.correctAnswer ? 'Correct! +2 XP' : 'Wrong answer!'} ({totalAnswers} answered)
        </Text>
      )}
    </View>
  );
}

const quizStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginVertical: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700' as const },
  question: { fontSize: 15, fontWeight: '700' as const, marginBottom: 12, lineHeight: 22 },
  option: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  optionText: { fontSize: 14, fontWeight: '500' as const },
  resultText: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' as const, marginTop: 6 },
});

const STUDY_ROOMS_PREMIUM_FEATURES = [
  { text: 'Create & join study rooms with friends' },
  { text: 'Real-time chat & note sharing' },
  { text: 'AI-generated quiz challenges for groups' },
  { text: 'Leaderboard & XP rewards' },
  { text: 'Private rooms with invite codes' },
];

export default function StudyRooms() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProgress, addXP, selectedLanguage } = useApp();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isPremium } = useSubscription();

  if (!isPremium) {
    return (
      <PremiumGate
        title="Study Rooms"
        description="Collaborate with friends, share notes, and challenge each other with AI quizzes."
        features={STUDY_ROOMS_PREMIUM_FEATURES}
      />
    );
  }

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomSubject, setRoomSubject] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'notes'>('chat');
  const scrollRef = useRef<ScrollView>(null);

  const currentUserId = user?.email || 'guest';
  const currentUserName = user?.name || 'Student';

  useEffect(() => {
    AsyncStorage.getItem('studyRooms').then(data => {
      if (data) {
        try { setRooms(JSON.parse(data)); } catch (e) { console.log('Error parsing rooms:', e); }
      }
    }).catch(e => console.log('Error loading rooms:', e));
  }, []);

  const saveRooms = useCallback(async (updatedRooms: StudyRoom[]) => {
    setRooms(updatedRooms);
    try { await AsyncStorage.setItem('studyRooms', JSON.stringify(updatedRooms)); } catch (e) { console.log('Error saving rooms:', e); }
  }, []);

  const handleCreateRoom = useCallback(() => {
    if (!roomName.trim()) { Alert.alert('Error', 'Please enter a room name.'); return; }
    if (!roomSubject.trim()) { Alert.alert('Error', 'Please enter a subject.'); return; }

    const code = generateRoomCode();
    const newRoom: StudyRoom = {
      id: Date.now().toString(),
      name: roomName.trim(),
      subject: roomSubject.trim(),
      createdBy: currentUserId,
      createdByName: currentUserName,
      isPrivate,
      code,
      members: [{
        id: currentUserId,
        name: currentUserName,
        email: currentUserId,
        xp: userProgress.totalXP,
        streak: userProgress.currentStreak,
        joinedAt: new Date().toISOString(),
        isOnline: true,
        lastActive: new Date().toISOString(),
      }],
      messages: [{
        id: Date.now().toString(),
        senderId: 'system',
        senderName: 'System',
        content: `${currentUserName} created the room. Share code ${code} with friends to join!`,
        type: 'system',
        timestamp: new Date().toISOString(),
      }],
      quizChallenges: [],
      sharedNotes: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...rooms, newRoom];
    void saveRooms(updated);
    setActiveRoom(newRoom);
    setShowCreateModal(false);
    setRoomName('');
    setRoomSubject('');
    setIsPrivate(false);
    addXP(5, 'Created a study room');
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [roomName, roomSubject, isPrivate, currentUserId, currentUserName, userProgress, rooms, saveRooms, addXP]);

  const handleJoinRoom = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { Alert.alert('Error', 'Please enter a valid 6-character room code.'); return; }

    const room = rooms.find(r => r.code === code);
    if (!room) { Alert.alert('Not Found', 'No room found with this code. Please check and try again.'); return; }

    if (room.members.some(m => m.id === currentUserId)) {
      setActiveRoom(room);
      setShowJoinModal(false);
      setJoinCode('');
      return;
    }

    const updatedRoom = {
      ...room,
      members: [...room.members, {
        id: currentUserId,
        name: currentUserName,
        email: currentUserId,
        xp: userProgress.totalXP,
        streak: userProgress.currentStreak,
        joinedAt: new Date().toISOString(),
        isOnline: true,
        lastActive: new Date().toISOString(),
      }],
      messages: [...room.messages, {
        id: Date.now().toString(),
        senderId: 'system',
        senderName: 'System',
        content: `${currentUserName} joined the room!`,
        type: 'system' as const,
        timestamp: new Date().toISOString(),
      }],
    };

    const updated = rooms.map(r => r.id === room.id ? updatedRoom : r);
    void saveRooms(updated);
    setActiveRoom(updatedRoom);
    setShowJoinModal(false);
    setJoinCode('');
    addXP(3, 'Joined a study room');
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [joinCode, rooms, currentUserId, currentUserName, userProgress, saveRooms, addXP]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !activeRoom) return;

    const msg: RoomMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserName,
      content: messageInput.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
    };

    const updatedRoom = { ...activeRoom, messages: [...activeRoom.messages, msg] };
    setActiveRoom(updatedRoom);
    const updated = rooms.map(r => r.id === activeRoom.id ? updatedRoom : r);
    void saveRooms(updated);
    setMessageInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messageInput, activeRoom, currentUserId, currentUserName, rooms, saveRooms]);

  const generateChallengeMutation = useMutation({
    mutationFn: async () => {
      if (!activeRoom) throw new Error('No active room');
      const prompt = `Generate a single challenging quiz question for a study group studying ${activeRoom.subject}.
Make it interesting and test real understanding. Language: ${selectedLanguage}.
Provide 4 options. correctAnswer is the 0-based index of the correct option.`;

      const result = await robustGenerateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: QuizChallengeSchema,
      });
      return result;
    },
    onSuccess: (data) => {
      if (!activeRoom) return;
      const challenge: QuizChallenge = {
        id: Date.now().toString(),
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        createdBy: currentUserId,
        createdByName: currentUserName,
        answers: {},
        createdAt: new Date().toISOString(),
      };

      const systemMsg: RoomMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'system',
        senderName: 'System',
        content: `${currentUserName} sent a Quiz Challenge! Answer it above.`,
        type: 'quiz-challenge',
        timestamp: new Date().toISOString(),
      };

      const updatedRoom = {
        ...activeRoom,
        quizChallenges: [...activeRoom.quizChallenges, challenge],
        messages: [...activeRoom.messages, systemMsg],
      };
      setActiveRoom(updatedRoom);
      const updated = rooms.map(r => r.id === activeRoom.id ? updatedRoom : r);
      void saveRooms(updated);
      addXP(3, 'Created a quiz challenge');
    },
    onError: () => Alert.alert('Error', 'Failed to generate quiz challenge.'),
  });

  const handleAnswerChallenge = useCallback((challengeId: string, answer: number) => {
    if (!activeRoom) return;
    const updatedChallenges = activeRoom.quizChallenges.map(c => {
      if (c.id === challengeId) {
        const newAnswers = { ...c.answers, [currentUserId]: answer };
        if (answer === c.correctAnswer) addXP(2, 'Correct quiz challenge answer');
        return { ...c, answers: newAnswers };
      }
      return c;
    });

    const updatedRoom = { ...activeRoom, quizChallenges: updatedChallenges };
    setActiveRoom(updatedRoom);
    const updated = rooms.map(r => r.id === activeRoom.id ? updatedRoom : r);
    void saveRooms(updated);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [activeRoom, currentUserId, rooms, saveRooms, addXP]);

  const handleShareNote = useCallback(() => {
    if (!activeRoom) return;
    const noteTitle = 'Quick Note';
    const noteContent = messageInput.trim() || 'Shared study note';
    if (!messageInput.trim()) {
      Alert.alert('Share Note', 'Type your note content in the message field first, then tap Share Note.');
      return;
    }
    const note: SharedNote = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      sharedBy: currentUserId,
      sharedByName: currentUserName,
      sharedAt: new Date().toISOString(),
    };
    const msg: RoomMessage = {
      id: (Date.now() + 1).toString(),
      senderId: 'system',
      senderName: 'System',
      content: `${currentUserName} shared a note: "${noteTitle}"`,
      type: 'note',
      timestamp: new Date().toISOString(),
    };
    const updatedRoom = {
      ...activeRoom,
      sharedNotes: [...activeRoom.sharedNotes, note],
      messages: [...activeRoom.messages, msg],
    };
    setActiveRoom(updatedRoom);
    const updated = rooms.map(r => r.id === activeRoom.id ? updatedRoom : r);
    void saveRooms(updated);
    setMessageInput('');
    addXP(2, 'Shared a note');
  }, [activeRoom, currentUserId, currentUserName, rooms, saveRooms, addXP, messageInput]);

  const handleLeaveRoom = useCallback(() => {
    if (!activeRoom) return;
    Alert.alert('Leave Room', 'Are you sure you want to leave this room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: () => {
          const updatedRoom = {
            ...activeRoom,
            members: activeRoom.members.filter(m => m.id !== currentUserId),
            messages: [...activeRoom.messages, {
              id: Date.now().toString(),
              senderId: 'system',
              senderName: 'System',
              content: `${currentUserName} left the room.`,
              type: 'system' as const,
              timestamp: new Date().toISOString(),
            }],
          };
          if (updatedRoom.members.length === 0) {
            const updated = rooms.filter(r => r.id !== activeRoom.id);
            void saveRooms(updated);
          } else {
            const updated = rooms.map(r => r.id === activeRoom.id ? updatedRoom : r);
            void saveRooms(updated);
          }
          setActiveRoom(null);
        },
      },
    ]);
  }, [activeRoom, currentUserId, currentUserName, rooms, saveRooms]);

  if (activeRoom) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#0a0520', '#0d1a2d'] : ['#eef2ff', '#f0f7ff']}
          style={styles.roomHeader}
        >
          <View style={styles.roomHeaderRow}>
            <TouchableOpacity onPress={() => setActiveRoom(null)} style={styles.backBtn}>
              <ChevronLeft size={22} color={isDark ? '#f1f5f9' : '#1a1a2e'} />
            </TouchableOpacity>
            <View style={styles.roomHeaderCenter}>
              <Text style={[styles.roomHeaderTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]} numberOfLines={1}>{activeRoom.name}</Text>
              <Text style={[styles.roomHeaderSub, { color: isDark ? '#7ea3c4' : '#64748b' }]}>
                {activeRoom.members.length} member{activeRoom.members.length > 1 ? 's' : ''} · {activeRoom.subject}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLeaveRoom} style={styles.leaveBtn}>
              <LogOut size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.roomCodeRow}>
            <Lock size={12} color={isDark ? '#7ea3c4' : '#94a3b8'} />
            <Text style={[styles.roomCodeLabel, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>Code: </Text>
            <Text style={[styles.roomCodeText, { color: isDark ? '#38bdf8' : '#0077b6' }]}>{activeRoom.code}</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert('Room Code', `Share this code with friends: ${activeRoom.code}`);
            }}>
              <Copy size={14} color={isDark ? '#38bdf8' : '#0077b6'} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            {(['chat', 'members', 'notes'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'chat' ? 'Chat' : tab === 'members' ? 'Members' : 'Notes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {activeTab === 'chat' ? (
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {activeRoom.messages.map(msg => {
                const isMe = msg.senderId === currentUserId;
                const isSystem = msg.type === 'system' || msg.type === 'note' || msg.type === 'quiz-challenge';

                if (isSystem) {
                  return (
                    <View key={msg.id} style={styles.systemMsg}>
                      <Text style={[styles.systemMsgText, { color: isDark ? '#4a6a8a' : '#94a3b8' }]}>{msg.content}</Text>
                    </View>
                  );
                }

                return (
                  <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                    {!isMe && (
                      <View style={[styles.msgAvatar, { backgroundColor: getAvatarColor(msg.senderName) }]}>
                        <Text style={styles.msgAvatarText}>{getInitials(msg.senderName)}</Text>
                      </View>
                    )}
                    <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : [styles.msgBubbleOther, { backgroundColor: isDark ? '#132640' : '#f1f5f9' }]]}>
                      {!isMe && <Text style={[styles.msgSender, { color: isDark ? '#38bdf8' : '#0077b6' }]}>{msg.senderName}</Text>}
                      <Text style={[styles.msgText, isMe ? styles.msgTextMe : { color: isDark ? '#b8d0e8' : '#475569' }]}>{msg.content}</Text>
                      <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.6)' : (isDark ? '#4a6a8a' : '#94a3b8') }]}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {activeRoom.quizChallenges.slice(-3).map(challenge => (
                <QuizChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userId={currentUserId}
                  onAnswer={handleAnswerChallenge}
                  isDark={isDark}
                />
              ))}
            </ScrollView>

            <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8, backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderTopColor: isDark ? '#152a45' : '#e2e8f0' }]}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDark ? '#132640' : '#f0f7ff' }]}
                onPress={() => generateChallengeMutation.mutate()}
                disabled={generateChallengeMutation.isPending}
              >
                {generateChallengeMutation.isPending ? (
                  <Loader2 size={18} color="#f59e0b" />
                ) : (
                  <Trophy size={18} color="#f59e0b" />
                )}
              </TouchableOpacity>
              <TextInput
                style={[styles.chatInput, { backgroundColor: isDark ? '#132640' : '#f1f5f9', color: isDark ? '#f1f5f9' : '#1a1a2e', borderColor: isDark ? '#1e3a5f' : '#e2e8f0' }]}
                placeholder="Type a message..."
                placeholderTextColor={isDark ? '#4a6a8a' : '#94a3b8'}
                value={messageInput}
                onChangeText={setMessageInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !messageInput.trim() && styles.sendBtnDisabled]}
                onPress={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                <LinearGradient
                  colors={messageInput.trim() ? ['#3b82f6', '#2563eb'] : ['#94a3b8', '#94a3b8']}
                  style={styles.sendBtnGradient}
                >
                  <Send size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'members' ? (
          <ScrollView style={styles.membersArea} contentContainerStyle={[styles.membersContent, { paddingBottom: insets.bottom + 30 }]}>
            <View style={styles.leaderboardHeader}>
              <Trophy size={18} color="#f59e0b" />
              <Text style={[styles.leaderboardTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Room Leaderboard</Text>
            </View>
            {[...activeRoom.members].sort((a, b) => b.xp - a.xp).map((member, idx) => (
              <View key={member.id} style={[styles.memberCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
                <View style={[styles.rankBadge, { backgroundColor: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : (isDark ? '#152a45' : '#f1f5f9') }]}>
                  <Text style={[styles.rankText, { color: idx < 3 ? '#ffffff' : (isDark ? '#7ea3c4' : '#64748b') }]}>#{idx + 1}</Text>
                </View>
                <MemberAvatar member={member} size={44} />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{member.name}</Text>
                    {member.id === activeRoom.createdBy && <Crown size={14} color="#f59e0b" />}
                  </View>
                  <Text style={[styles.memberStats, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>
                    {member.xp.toLocaleString()} XP · {member.streak} day streak
                  </Text>
                </View>
                <View style={[styles.onlineIndicator, { backgroundColor: member.isOnline ? '#22c55e' : '#94a3b8' }]} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.membersArea} contentContainerStyle={[styles.membersContent, { paddingBottom: insets.bottom + 30 }]}>
            <TouchableOpacity
              style={[styles.shareNoteBtn, { backgroundColor: isDark ? '#132640' : '#f0f7ff', borderColor: isDark ? '#1e3a5f' : '#dbeafe' }]}
              onPress={handleShareNote}
            >
              <Share2 size={18} color={isDark ? '#38bdf8' : '#3b82f6'} />
              <Text style={[styles.shareNoteBtnText, { color: isDark ? '#38bdf8' : '#3b82f6' }]}>Share a Note</Text>
            </TouchableOpacity>

            {activeRoom.sharedNotes.length === 0 ? (
              <View style={styles.emptyNotes}>
                <BookOpen size={40} color={isDark ? '#4a6a8a' : '#94a3b8'} />
                <Text style={[styles.emptyNotesText, { color: isDark ? '#4a6a8a' : '#94a3b8' }]}>No notes shared yet</Text>
              </View>
            ) : (
              activeRoom.sharedNotes.map(note => (
                <View key={note.id} style={[styles.noteCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
                  <Text style={[styles.noteTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{note.title}</Text>
                  <Text style={[styles.noteContent, { color: isDark ? '#b8d0e8' : '#475569' }]}>{note.content}</Text>
                  <Text style={[styles.noteMeta, { color: isDark ? '#4a6a8a' : '#94a3b8' }]}>
                    By {note.sharedByName} · {new Date(note.sharedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#050a20', '#0d1a2d'] : ['#eef2ff', '#e0e7ff', '#f0f7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={isDark ? '#f1f5f9' : '#1a1a2e'} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Users size={20} color="#3b82f6" />
              <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Study Rooms</Text>
            </View>
            <Text style={[styles.headerSub, { color: isDark ? '#7ea3c4' : '#64748b' }]}>Learn together, grow together</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={[styles.mainContentContainer, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionIconBg}>
              <Plus size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.actionCardTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Create Room</Text>
            <Text style={[styles.actionCardDesc, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>Start a new study group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}
            onPress={() => setShowJoinModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.actionIconBg}>
              <UserPlus size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.actionCardTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Join Room</Text>
            <Text style={[styles.actionCardDesc, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>Enter room code</Text>
          </TouchableOpacity>
        </View>

        {rooms.length === 0 ? (
          <View style={[styles.emptyStateBox, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff' }]}>
            <Users size={48} color={isDark ? '#4a6a8a' : '#cbd5e1'} />
            <Text style={[styles.emptyStateTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>No rooms yet</Text>
            <Text style={[styles.emptyStateDesc, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>
              Create a study room or join one with a code to start collaborating with friends!
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>Your Rooms</Text>
            {rooms.filter(r => r.members.some(m => m.id === currentUserId)).map(room => (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, { backgroundColor: isDark ? '#0d1a2d' : '#ffffff', borderColor: isDark ? '#152a45' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => setActiveRoom(room)}
                activeOpacity={0.8}
              >
                <View style={styles.roomCardHeader}>
                  <View style={[styles.roomIconBg, { backgroundColor: isDark ? '#132640' : '#eef2ff' }]}>
                    <BookOpen size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.roomCardInfo}>
                    <Text style={[styles.roomCardName, { color: isDark ? '#f1f5f9' : '#1a1a2e' }]}>{room.name}</Text>
                    <Text style={[styles.roomCardMeta, { color: isDark ? '#7ea3c4' : '#94a3b8' }]}>
                      {room.subject} · {room.members.length} member{room.members.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.roomCardRight}>
                    {room.isPrivate ? <Lock size={14} color="#94a3b8" /> : <Unlock size={14} color="#22c55e" />}
                    <View style={styles.msgCountBadge}>
                      <MessageSquare size={12} color="#ffffff" />
                      <Text style={styles.msgCountText}>{room.messages.length}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.roomMemberAvatars}>
                  {room.members.slice(0, 5).map((m, i) => (
                    <View key={m.id} style={[styles.miniAvatar, { backgroundColor: getAvatarColor(m.name), marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }]}>
                      <Text style={styles.miniAvatarText}>{getInitials(m.name)}</Text>
                    </View>
                  ))}
                  {room.members.length > 5 && (
                    <View style={[styles.miniAvatar, { backgroundColor: '#94a3b8', marginLeft: -8, zIndex: 0 }]}>
                      <Text style={styles.miniAvatarText}>+{room.members.length - 5}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={[styles.featureInfo, { backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#eef2ff', borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#c7d2fe' }]}>
          <Brain size={18} color="#3b82f6" />
          <View style={styles.featureInfoCol}>
            <Text style={[styles.featureInfoTitle, { color: isDark ? '#93c5fd' : '#1e40af' }]}>Study Better Together</Text>
            <Text style={[styles.featureInfoDesc, { color: isDark ? '#60a5fa' : '#3b82f6' }]}>
              Create rooms, share notes, and challenge friends with AI-generated quizzes. Track everyone&apos;s progress on the leaderboard!
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateModal(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top + 20, backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Study Room</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.modalClose, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#38bdf8' : '#0077b6' }]}>Room Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: isDark ? '#0d1a2d' : '#f1f5f9', color: colors.text, borderColor: isDark ? '#152a45' : '#e2e8f0' }]}
              placeholder="e.g. Physics Study Group"
              placeholderTextColor={isDark ? '#4a6a8a' : '#94a3b8'}
              value={roomName}
              onChangeText={setRoomName}
              maxLength={40}
            />

            <Text style={[styles.fieldLabel, { color: isDark ? '#38bdf8' : '#0077b6', marginTop: 16 }]}>Subject</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: isDark ? '#0d1a2d' : '#f1f5f9', color: colors.text, borderColor: isDark ? '#152a45' : '#e2e8f0' }]}
              placeholder="e.g. Physics, Mathematics"
              placeholderTextColor={isDark ? '#4a6a8a' : '#94a3b8'}
              value={roomSubject}
              onChangeText={setRoomSubject}
              maxLength={30}
            />

            <TouchableOpacity
              style={[styles.privacyToggle, { backgroundColor: isDark ? '#0d1a2d' : '#f1f5f9' }]}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              {isPrivate ? <Lock size={18} color="#f59e0b" /> : <Unlock size={18} color="#22c55e" />}
              <Text style={[styles.privacyText, { color: colors.text }]}>{isPrivate ? 'Private Room' : 'Open Room'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateRoom}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.createBtnGradient}>
                <Plus size={20} color="#ffffff" />
                <Text style={styles.createBtnText}>Create Room</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showJoinModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowJoinModal(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top + 20, backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Join Study Room</Text>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Text style={[styles.modalClose, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#38bdf8' : '#0077b6' }]}>Room Code</Text>
            <TextInput
              style={[styles.codeInput, { backgroundColor: isDark ? '#0d1a2d' : '#f1f5f9', color: colors.text, borderColor: isDark ? '#152a45' : '#e2e8f0' }]}
              placeholder="Enter 6-digit code"
              placeholderTextColor={isDark ? '#4a6a8a' : '#94a3b8'}
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.joinBtn} onPress={handleJoinRoom}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.createBtnGradient}>
                <UserPlus size={20} color="#ffffff" />
                <Text style={styles.createBtnText}>Join Room</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' as const },
  headerSub: { fontSize: 12, fontWeight: '600' as const, marginTop: 2 },
  mainContent: { flex: 1 },
  mainContentContainer: { padding: 20 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1, borderRadius: 18, padding: 18, alignItems: 'center', gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  actionIconBg: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionCardTitle: { fontSize: 15, fontWeight: '700' as const },
  actionCardDesc: { fontSize: 11, fontWeight: '500' as const },
  emptyStateBox: {
    borderRadius: 20, padding: 40, alignItems: 'center', gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '800' as const },
  emptyStateDesc: { fontSize: 13, lineHeight: 20, textAlign: 'center' as const, fontWeight: '500' as const },
  sectionTitle: { fontSize: 18, fontWeight: '800' as const, marginBottom: 14 },
  roomCard: {
    borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
    }),
  },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roomCardInfo: { flex: 1 },
  roomCardName: { fontSize: 16, fontWeight: '700' as const },
  roomCardMeta: { fontSize: 12, fontWeight: '500' as const, marginTop: 2 },
  roomCardRight: { alignItems: 'flex-end', gap: 6 },
  msgCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  msgCountText: { fontSize: 10, fontWeight: '700' as const, color: '#ffffff' },
  roomMemberAvatars: { flexDirection: 'row', marginTop: 12, paddingLeft: 4 },
  miniAvatar: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  miniAvatarText: { fontSize: 10, fontWeight: '800' as const, color: '#ffffff' },
  featureInfo: { flexDirection: 'row', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, marginTop: 12 },
  featureInfoCol: { flex: 1, gap: 4 },
  featureInfoTitle: { fontSize: 14, fontWeight: '700' as const },
  featureInfoDesc: { fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  roomHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  roomHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomHeaderCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  roomHeaderTitle: { fontSize: 18, fontWeight: '800' as const },
  roomHeaderSub: { fontSize: 12, fontWeight: '500' as const, marginTop: 2 },
  leaveBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },
  roomCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  roomCodeLabel: { fontSize: 12, fontWeight: '500' as const },
  roomCodeText: { fontSize: 14, fontWeight: '800' as const, letterSpacing: 2 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '700' as const, color: '#94a3b8' },
  tabTextActive: { color: '#ffffff' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8 },
  systemMsg: { alignItems: 'center', marginVertical: 8 },
  systemMsgText: { fontSize: 12, fontWeight: '500' as const, fontStyle: 'italic' as const },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end', gap: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgAvatar: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { fontSize: 11, fontWeight: '800' as const, color: '#ffffff' },
  msgBubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  msgBubbleMe: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  msgBubbleOther: { borderBottomLeftRadius: 4 },
  msgSender: { fontSize: 11, fontWeight: '700' as const, marginBottom: 4 },
  msgText: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  msgTextMe: { color: '#ffffff' },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' as const },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  actionBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  chatInput: { flex: 1, minHeight: 42, maxHeight: 100, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  sendBtn: { borderRadius: 14, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  membersArea: { flex: 1 },
  membersContent: { padding: 16 },
  leaderboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  leaderboardTitle: { fontSize: 18, fontWeight: '800' as const },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  rankBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: '800' as const },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 15, fontWeight: '700' as const },
  memberStats: { fontSize: 12, fontWeight: '500' as const, marginTop: 2 },
  onlineIndicator: { width: 10, height: 10, borderRadius: 5 },
  shareNoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginBottom: 18 },
  shareNoteBtnText: { fontSize: 15, fontWeight: '700' as const },
  emptyNotes: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyNotesText: { fontSize: 14, fontWeight: '500' as const },
  noteCard: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    }),
  },
  noteTitle: { fontSize: 15, fontWeight: '700' as const, marginBottom: 6 },
  noteContent: { fontSize: 13, lineHeight: 20, fontWeight: '500' as const },
  noteMeta: { fontSize: 11, fontWeight: '500' as const, marginTop: 10 },
  modalContainer: { flex: 1, paddingHorizontal: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 22, fontWeight: '800' as const },
  modalClose: { fontSize: 16, fontWeight: '600' as const },
  modalBody: {},
  fieldLabel: { fontSize: 13, fontWeight: '700' as const, marginBottom: 8, letterSpacing: 0.3 },
  fieldInput: { height: 50, borderRadius: 14, paddingHorizontal: 18, fontSize: 15, borderWidth: 1.5 },
  privacyToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, marginTop: 20 },
  privacyText: { fontSize: 15, fontWeight: '600' as const },
  createBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  createBtnText: { fontSize: 16, fontWeight: '800' as const, color: '#ffffff' },
  joinBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  codeInput: { height: 60, borderRadius: 16, paddingHorizontal: 24, fontSize: 24, fontWeight: '800' as const, textAlign: 'center' as const, letterSpacing: 6, borderWidth: 1.5 },
});
