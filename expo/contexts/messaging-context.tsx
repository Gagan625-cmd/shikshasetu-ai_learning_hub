import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/utils/supabase';

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

export interface Contact {
  email: string;
  name: string;
  role: 'student' | 'teacher';
}

interface DbMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'teacher';
  receiver_id: string;
  receiver_name: string;
  text: string;
  created_at: string;
  read: boolean;
}

function rowToMessage(row: DbMessage): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    text: row.text,
    timestamp: new Date(row.created_at).getTime(),
    read: row.read,
  };
}

const POLL_INTERVAL_MS = 4000;

export const [MessagingProvider, useMessaging] = createContextHook(() => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_contacts')
      .select('email,name,role');
    if (error) {
      console.log('loadContacts error:', error.message);
      return;
    }
    if (data) {
      setContacts(data.map(c => ({ email: c.email, name: c.name, role: c.role as 'student' | 'teacher' })));
    }
  }, []);

  const loadMessages = useCallback(async (email: string) => {
    const { data, error } = await supabase
      .from('app_messages')
      .select('*')
      .or(`sender_id.eq.${email},receiver_id.eq.${email}`)
      .order('created_at', { ascending: true });
    if (error) {
      console.log('loadMessages error:', error.message);
      return;
    }
    if (data) {
      setMessages((data as DbMessage[]).map(rowToMessage));
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      await Promise.all([loadContacts(), loadMessages(user.email)]);
      if (mounted) setIsLoading(false);
    })();
    pollRef.current = setInterval(() => {
      void loadMessages(user.email);
      void loadContacts();
    }, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, loadContacts, loadMessages]);

  const registerContact = useCallback(async (email: string, name: string, role: 'student' | 'teacher') => {
    const { error } = await supabase
      .from('app_contacts')
      .upsert({ email, name, role, updated_at: new Date().toISOString() }, { onConflict: 'email' });
    if (error) {
      console.log('registerContact error:', error.message);
      return;
    }
    setContacts(prev => {
      const exists = prev.find(c => c.email === email);
      if (exists) return prev.map(c => c.email === email ? { email, name, role } : c);
      return [...prev, { email, name, role }];
    });
  }, []);

  const sendMessage = useCallback(async (receiverId: string, receiverName: string, text: string, senderRole: 'student' | 'teacher') => {
    if (!user) return;
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newMsg: ChatMessage = {
      id,
      senderId: user.email,
      senderName: user.name,
      senderRole,
      receiverId,
      receiverName,
      text,
      timestamp: Date.now(),
      read: false,
    };
    setMessages(prev => [...prev, newMsg]);
    const { error } = await supabase.from('app_messages').insert({
      id,
      sender_id: user.email,
      sender_name: user.name,
      sender_role: senderRole,
      receiver_id: receiverId,
      receiver_name: receiverName,
      text,
      read: false,
    });
    if (error) {
      console.log('sendMessage error:', error.message);
      setMessages(prev => prev.filter(m => m.id !== id));
      return;
    }
    console.log('Message sent from', user.email, 'to', receiverId);
  }, [user]);

  const markAsRead = useCallback(async (conversationPartnerId: string) => {
    if (!user) return;
    const ids = messages
      .filter(m => m.senderId === conversationPartnerId && m.receiverId === user.email && !m.read)
      .map(m => m.id);
    if (ids.length === 0) return;
    setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, read: true } : m));
    const { error } = await supabase
      .from('app_messages')
      .update({ read: true })
      .in('id', ids);
    if (error) console.log('markAsRead error:', error.message);
  }, [user, messages]);

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
