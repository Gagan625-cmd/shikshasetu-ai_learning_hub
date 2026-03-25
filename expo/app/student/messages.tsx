import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Platform, Animated, KeyboardAvoidingView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MessageSquare, Plus, Search, User, ChevronRight } from 'lucide-react-native';
import { useMessaging, type Contact } from '@/contexts/messaging-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

export default function StudentMessages() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { conversations, sendMessage, markAsRead, getConversationMessages, getTeachers, getStudents, unreadCount } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('teacher');
  const [inputText, setInputText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'teachers' | 'students'>('all');
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const teachers = useMemo(() => getTeachers(), [getTeachers]);
  const students = useMemo(() => getStudents(), [getStudents]);

  const filteredContacts = useMemo(() => {
    let list: Contact[] = [];
    if (contactFilter === 'teachers') list = teachers;
    else if (contactFilter === 'students') list = students;
    else list = [...teachers, ...students];
    if (!searchText.trim()) return list;
    return list.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [teachers, students, searchText, contactFilter]);

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
    void sendMessage(selectedConversation, selectedName, inputText.trim(), 'student');
    setInputText('');
  }, [inputText, selectedConversation, selectedName, sendMessage]);

  const openConversation = useCallback((id: string, name: string, role?: 'student' | 'teacher') => {
    setSelectedConversation(id);
    setSelectedName(name);
    setSelectedRole(role || 'teacher');
    setShowNewChat(false);
  }, []);

  const startNewChat = useCallback((contact: Contact) => {
    setSelectedConversation(contact.email);
    setSelectedName(contact.name);
    setSelectedRole(contact.role);
    setShowNewChat(false);
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
          colors={['#0ea5e9', '#0284c7', '#0369a1']}
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
              <Text style={styles.chatHeaderRole}>{selectedRole === 'student' ? 'Student' : 'Teacher'}</Text>
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
              <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.sendBtnGradient}>
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
        colors={['#0ea5e9', '#0284c7', '#0369a1']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity onPress={() => setShowNewChat(true)} style={styles.newChatBtn}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Text style={styles.unreadBannerText}>{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</Text>
          </View>
        )}
      </LinearGradient>

      {showNewChat ? (
        <Animated.View style={[styles.newChatPanel, { opacity: fadeAnim }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search contacts..."
              placeholderTextColor={colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <View style={styles.filterRow}>
            {(['all', 'teachers', 'students'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, contactFilter === f && styles.filterChipActive]}
                onPress={() => setContactFilter(f)}
              >
                <Text style={[styles.filterChipText, contactFilter === f && styles.filterChipTextActive]}>
                  {f === 'all' ? 'All' : f === 'teachers' ? 'Teachers' : 'Students'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {contactFilter === 'students' ? 'Available Students' : contactFilter === 'teachers' ? 'Available Teachers' : 'Available Contacts'}
          </Text>
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyContacts}>
              <User size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyContactsText, { color: colors.textSecondary }]}>
                No {contactFilter === 'all' ? 'contacts' : contactFilter} registered yet. They need to sign in first.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={item => item.email}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.cardBg }]} onPress={() => startNewChat(item)}>
                  <View style={[styles.contactAvatar, { backgroundColor: item.role === 'student' ? '#10b98120' : '#0ea5e920' }]}>
                    <Text style={[styles.contactAvatarText, { color: item.role === 'student' ? '#10b981' : '#0ea5e9' }]}>{item.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.contactRole, { color: colors.textSecondary }]}>{item.role === 'student' ? 'Student' : 'Teacher'}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={styles.cancelNewChat} onPress={() => setShowNewChat(false)}>
            <Text style={styles.cancelNewChatText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <ScrollView style={styles.convList} contentContainerStyle={[styles.convListContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <MessageSquare size={56} color="#0ea5e9" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Start a conversation with teachers or classmates
              </Text>
              <TouchableOpacity style={styles.startChatBtn} onPress={() => setShowNewChat(true)}>
                <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.startChatGradient}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.startChatText}>New Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.convCard, { backgroundColor: colors.cardBg }]}
                onPress={() => openConversation(conv.participantId, conv.participantName, conv.participantRole)}
                activeOpacity={0.7}
              >
                <View style={[styles.convAvatar, { backgroundColor: '#0ea5e920' }]}>
                  <Text style={[styles.convAvatarText, { color: '#0ea5e9' }]}>{conv.participantName[0]?.toUpperCase()}</Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700' as const, color: '#fff' },
  newChatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  unreadBanner: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  unreadBannerText: { fontSize: 13, color: '#fff', fontWeight: '600' as const },
  convList: { flex: 1 },
  convListContent: { padding: 16, gap: 10 },
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
  unreadBadge: { backgroundColor: '#0ea5e9', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  unreadBadgeText: { fontSize: 12, fontWeight: '700' as const, color: '#fff' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0ea5e910', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700' as const },
  emptySubtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  startChatBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  startChatGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14 },
  startChatText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
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
  myBubble: { backgroundColor: '#0ea5e9', borderBottomRightRadius: 4 },
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
  newChatPanel: { flex: 1, padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginBottom: 16 },
  searchInput: { flex: 1, height: 46, fontSize: 15 },
  sectionLabel: { fontSize: 14, fontWeight: '600' as const, marginBottom: 12, marginLeft: 4 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 14, marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    }),
  },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  contactAvatarText: { fontSize: 18, fontWeight: '700' as const },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { fontSize: 16, fontWeight: '600' as const },
  contactRole: { fontSize: 13 },
  emptyContacts: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
  emptyContactsText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  cancelNewChat: { alignItems: 'center', paddingVertical: 14, marginTop: 10 },
  cancelNewChatText: { fontSize: 16, fontWeight: '600' as const, color: '#ef4444' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(14,165,233,0.08)', borderWidth: 1, borderColor: 'rgba(14,165,233,0.15)' },
  filterChipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: '#0ea5e9' },
  filterChipTextActive: { color: '#ffffff' },
});
