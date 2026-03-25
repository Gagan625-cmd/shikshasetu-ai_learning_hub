import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher';
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'student' | 'teacher';
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

const MESSAGES_KEY = 'app_messages';
const CONTACTS_KEY = 'app_contacts';

export interface Contact {
  email: string;
  name: string;
  role: 'student' | 'teacher';
}

export const [MessagingProvider, useMessaging] = createContextHook(() => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [msgData, contactData] = await Promise.all([
        AsyncStorage.getItem(MESSAGES_KEY),
        AsyncStorage.getItem(CONTACTS_KEY),
      ]);
      if (msgData) setMessages(JSON.parse(msgData));
      if (contactData) setContacts(JSON.parse(contactData));
    } catch (error) {
      console.log('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const registerContact = useCallback(async (email: string, name: string, role: 'student' | 'teacher') => {
    setContacts(prev => {
      const exists = prev.find(c => c.email === email);
      if (exists) {
        if (exists.role === role && exists.name === name) return prev;
        const updated = prev.map(c => c.email === email ? { ...c, name, role } : c);
        void AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
        return updated;
      }
      const updated = [...prev, { email, name, role }];
      void AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (receiverId: string, receiverName: string, text: string, senderRole: 'student' | 'teacher') => {
    if (!user) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      senderId: user.email,
      senderName: user.name,
      senderRole,
      receiverId,
      receiverName,
      text,
      timestamp: Date.now(),
      read: false,
    };
    setMessages(prev => {
      const updated = [...prev, newMsg];
      void AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
      return updated;
    });
    console.log('Message sent from', user.email, 'to', receiverId);
  }, [user]);

  const markAsRead = useCallback(async (conversationPartnerId: string) => {
    if (!user) return;
    setMessages(prev => {
      const updated = prev.map(m =>
        m.senderId === conversationPartnerId && m.receiverId === user.email && !m.read
          ? { ...m, read: true }
          : m
      );
      void AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [user]);

  const conversations = useMemo(() => {
    if (!user) return [];
    const userMessages = messages.filter(m => m.senderId === user.email || m.receiverId === user.email);
    const convMap = new Map<string, Conversation>();

    for (const msg of userMessages) {
      const partnerId = msg.senderId === user.email ? msg.receiverId : msg.senderId;
      const partnerName = msg.senderId === user.email ? msg.receiverName : msg.senderName;
      const partnerRole = msg.senderId === user.email
        ? (msg.senderRole === 'student' ? 'teacher' : 'student')
        : msg.senderRole;

      const existing = convMap.get(partnerId);
      const isUnread = msg.receiverId === user.email && !msg.read;

      if (!existing || msg.timestamp > existing.lastMessageTime) {
        convMap.set(partnerId, {
          id: partnerId,
          participantId: partnerId,
          participantName: partnerName,
          participantRole: partnerRole,
          lastMessage: msg.text,
          lastMessageTime: msg.timestamp,
          unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
        });
      } else if (isUnread) {
        existing.unreadCount += 1;
      }
    }

    return Array.from(convMap.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  }, [messages, user]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return messages.filter(m => m.receiverId === user.email && !m.read).length;
  }, [messages, user]);

  const getConversationMessages = useCallback((partnerId: string) => {
    if (!user) return [];
    return messages
      .filter(m =>
        (m.senderId === user.email && m.receiverId === partnerId) ||
        (m.senderId === partnerId && m.receiverId === user.email)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, user]);

  const getTeachers = useCallback(() => {
    return contacts.filter(c => c.role === 'teacher' && c.email !== user?.email);
  }, [contacts, user]);

  const getStudents = useCallback(() => {
    return contacts.filter(c => c.role === 'student' && c.email !== user?.email);
  }, [contacts, user]);

  return useMemo(() => ({
    messages,
    conversations,
    unreadCount,
    contacts,
    isLoading,
    sendMessage,
    markAsRead,
    getConversationMessages,
    registerContact,
    getTeachers,
    getStudents,
  }), [messages, conversations, unreadCount, contacts, isLoading, sendMessage, markAsRead, getConversationMessages, registerContact, getTeachers, getStudents]);
});
