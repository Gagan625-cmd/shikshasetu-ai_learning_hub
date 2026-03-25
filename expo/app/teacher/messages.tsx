import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Platform, Animated, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MessageSquare, Bell } from 'lucide-react-native';
import { useMessaging } from '@/contexts/messaging-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

export default function TeacherMessages() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { conversations, sendMessage, markAsRead, getConversationMessages } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [showNotifications, setShowNotifications] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const studentConversations = useMemo(() => {
    return conversations.filter(c => c.participantRole === 'student');
  }, [conversations]);

  const unreadStudentMessages = useMemo(() => {
    if (!user) return [];
    return conversations
      .filter(c => c.participantRole === 'student' && c.unreadCount > 0)
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }, [conversations, user]);

  const conversationMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return getConversationMessages(selectedConversation);
  }, [selectedConversation, getConversationMessages]);

  useEffect(() => {
    if (selectedConversation) {
      void markAsRead(selectedConversation);
    }
  }, [selectedConversation, markAsRead, conversationMessages.length]);

  useEffect(() => {
    if (scrollRef.current && conversationMessages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conversationMessages.length]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !selectedConversation) return;
    void sendMessage(selectedConversation, selectedName, inputText.trim(), 'teacher');
    setInputText('');
  }, [inputText, selectedConversation, selectedName, sendMessage]);

  const openConversation = useCallback((id: string, name: string) => {
    setSelectedConversation(id);
    setSelectedName(name);
    setShowNotifications(false);
  }, []);

  const formatTime = useCallback((ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  if (selectedConversation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#f59e0b', '#d97706', '#b45309']}
          style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{selectedName[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.chatHeaderName}>{selectedName}</Text>
              <Text style={styles.chatHeaderRole}>Student</Text>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.chatBody}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {conversationMessages.length === 0 && (
              <View style={styles.emptyChat}>
                <MessageSquare size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
                  Start a conversation with {selectedName}
                </Text>
              </View>
            )}
            {conversationMessages.map((msg) => {
              const isMine = msg.senderId === user?.email;
              return (
                <View key={msg.id} style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
                  <View style={[styles.msgBubble, isMine ? styles.myBubble : [styles.theirBubble, { backgroundColor: colors.cardBg, borderColor: colors.border }]]}>
                    <Text style={[styles.msgText, isMine ? styles.myMsgText : { color: colors.text }]}>{msg.text}</Text>
                    <Text style={[styles.msgTime, isMine ? styles.myMsgTime : { color: colors.textTertiary }]}>{formatTime(msg.timestamp)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.msgInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.sendBtnGradient}>
                <Send size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#b45309']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)} style={[styles.notifBtn, unreadStudentMessages.length > 0 && styles.notifBtnActive]}>
            <Bell size={22} color="#fff" />
            {unreadStudentMessages.length > 0 && (
              <View style={styles.notifDot} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.convList} contentContainerStyle={[styles.convListContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        {unreadStudentMessages.length > 0 && showNotifications && (
          <Animated.View style={[styles.notifSection, { opacity: fadeAnim }]}>
            <View style={styles.notifHeader}>
              <Bell size={18} color="#f59e0b" />
              <Text style={[styles.notifTitle, { color: colors.text }]}>Student Notifications</Text>
              <View style={styles.notifCountBadge}>
                <Text style={styles.notifCountText}>{unreadStudentMessages.length}</Text>
              </View>
            </View>
            {unreadStudentMessages.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.notifCard, { borderLeftColor: '#f59e0b' }]}
                onPress={() => openConversation(conv.participantId, conv.participantName)}
              >
                <View style={styles.notifCardInner}>
                  <View style={styles.notifAvatar}>
                    <Text style={styles.notifAvatarText}>{conv.participantName[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.notifInfo}>
                    <Text style={[styles.notifName, { color: colors.text }]}>{conv.participantName}</Text>
                    <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>{conv.lastMessage}</Text>
                  </View>
                  <View style={styles.notifMeta}>
                    <Text style={[styles.notifTime, { color: colors.textTertiary }]}>{formatTime(conv.lastMessageTime)}</Text>
                    <View style={styles.notifUnreadBadge}>
                      <Text style={styles.notifUnreadText}>{conv.unreadCount}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Conversations</Text>
        {studentConversations.length === 0 && conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MessageSquare size={56} color="#f59e0b" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Student messages will appear here
            </Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={[styles.convCard, { backgroundColor: colors.cardBg }]}
              onPress={() => openConversation(conv.participantId, conv.participantName)}
              activeOpacity={0.7}
            >
              <View style={[styles.convAvatar, { backgroundColor: '#f59e0b20' }]}>
                <Text style={[styles.convAvatarText, { color: '#f59e0b' }]}>{conv.participantName[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convTopRow}>
                  <Text style={[styles.convName, { color: colors.text }]} numberOfLines={1}>{conv.participantName}</Text>
                  <Text style={[styles.convTime, { color: colors.textTertiary }]}>{formatTime(conv.lastMessageTime)}</Text>
                </View>
                <View style={styles.convBottomRow}>
                  <Text style={[styles.convLastMsg, { color: colors.textSecondary }]} numberOfLines={1}>{conv.lastMessage}</Text>
                  {conv.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700' as const, color: '#fff' },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  notifBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#f59e0b' },
  convList: { flex: 1 },
  convListContent: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 12, marginTop: 8 },
  convCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, gap: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  convAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  convAvatarText: { fontSize: 20, fontWeight: '700' as const },
  convInfo: { flex: 1, gap: 4 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 16, fontWeight: '600' as const, flex: 1, marginRight: 8 },
  convTime: { fontSize: 12 },
  convBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convLastMsg: { fontSize: 14, flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: '#f59e0b', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  unreadBadgeText: { fontSize: 12, fontWeight: '700' as const, color: '#fff' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f59e0b10', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700' as const },
  emptySubtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  notifSection: { marginBottom: 16, gap: 10 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  notifTitle: { fontSize: 17, fontWeight: '700' as const, flex: 1 },
  notifCountBadge: { backgroundColor: '#f59e0b', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  notifCountText: { fontSize: 12, fontWeight: '700' as const, color: '#fff' },
  notifCard: {
    borderLeftWidth: 4, borderRadius: 14, backgroundColor: '#fef3c7', padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(245,158,11,0.1)' },
    }),
  },
  notifCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' },
  notifAvatarText: { fontSize: 17, fontWeight: '700' as const, color: '#fff' },
  notifInfo: { flex: 1, gap: 2 },
  notifName: { fontSize: 15, fontWeight: '600' as const },
  notifMsg: { fontSize: 13, lineHeight: 18 },
  notifMeta: { alignItems: 'flex-end', gap: 6 },
  notifTime: { fontSize: 11 },
  notifUnreadBadge: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  notifUnreadText: { fontSize: 11, fontWeight: '700' as const, color: '#fff' },
  chatHeader: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  chatHeaderName: { fontSize: 17, fontWeight: '700' as const, color: '#fff' },
  chatHeaderRole: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  chatBody: { flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16, gap: 8 },
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyChatText: { fontSize: 15, textAlign: 'center' },
  msgRow: { maxWidth: '80%' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgBubble: { padding: 12, borderRadius: 18 },
  myBubble: { backgroundColor: '#f59e0b', borderBottomRightRadius: 4 },
  theirBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 21 },
  myMsgText: { color: '#fff' },
  msgTime: { fontSize: 11, marginTop: 4, textAlign: 'right' as const },
  myMsgTime: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  msgInput: { flex: 1, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, borderWidth: 1, fontSize: 15 },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
