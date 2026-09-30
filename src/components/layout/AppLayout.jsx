import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatList from '../chat/ChatList';
import ChatWindow from '../chat/ChatWindow';
import ChannelList from '../channels/ChannelList';
import ChannelWindow from '../channels/ChannelWindow';
import CreateChannelModal from '../channels/CreateChannelModal';
import ContactList from '../contacts/ContactList';
import EmptyState from '../common/EmptyState';
import AdminDashboard from '../../pages/AdminDashboard';
import TodoPage from '../todos/TodoPage';
import TodoModal from '../todos/TodoModal';
import ReminderPage from '../reminders/ReminderPage';
import DueReminderModal from '../reminders/DueReminderModal';
import NotesPage from '../notes/NotesPage';
import SavedMessagesPage from '../saved/SavedMessagesPage';
import GoogleCalendarPanel from '../calendar/GoogleCalendarPanel';
import { getGoogleCalendarStatus } from '../../services/googleCalendarService';
import JoinRequestAcceptModal from '../common/JoinRequestAcceptModal';
import InvitationAcceptModal from '../common/InvitationAcceptModal';
import ProfileModal from '../common/ProfileModal';
import SettingsModal from '../common/SettingsModal';
import CompanyModal from '../organization/CompanyModal';
import MobileBottomNav from './MobileBottomNav';
import { SuspensionBanner } from '../common/OrgStatusBadge';
import CallOverlay from '../calling/CallOverlay';

import {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteMessageForMe,
  forwardMessage,
  getTeamUsers,
  getMessage,
  addReaction,
  removeReaction,
  markMessagesAsRead,
} from '../../services/messageService';
import { markConversationAsRead, updateConversationSetting } from '../../services/conversationService';
import { getPinnedMessages, pinMessage, unpinMessage } from '../../services/pinnedMessageService';
import { getSavedMessages, saveMessage, unsaveMessage } from '../../services/savedMessageService';
import { pinItem, unpinItem } from '../../services/pinService';
import { registerFCMToken } from '../../services/settingsService';

import {
  getChannels,
  createChannel,
  updateChannel,
  promoteChannelAdmin,
  joinChannel,
  leaveChannel,
  addChannelMembers,
  getChannelMessages,
  sendChannelMessage,
  updateChannelSetting,
} from '../../services/channelService';

import { createTodo } from '../../services/todoService';

import { messaging } from '../../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// Helper to detect if a conversation is a self-conversation for the current user
const isSelfConversation = (conv, userId) => {
  if (!conv || conv.isChannel || conv.itemType === 'channel') return false;
  if (conv.isMe) return true;
  const targetId = userId?.toString();
  if (!targetId) return false;
  if (conv.participants && Array.isArray(conv.participants) && conv.participants.length > 0) {
    return conv.participants.every((p) => {
      const pId = (p?._id || p?.id || p)?.toString();
      return pId && pId === targetId;
    });
  }
  return false;
};

// Deduplicates conversations ensuring the current user's self-chat appears exactly ONCE at index 0
const deduplicateConversations = (list, userId) => {
  if (!Array.isArray(list)) return [];
  const myId = userId?.toString();

  const selfConvs = [];
  const otherConvs = [];

  for (const c of list) {
    if (isSelfConversation(c, myId)) {
      selfConvs.push(c);
    } else {
      otherConvs.push(c);
    }
  }

  // Deduplicate other direct conversations by unique ID
  const seenIds = new Set();
  const uniqueOtherConvs = otherConvs.filter((c) => {
    const id = (c._id || c.id)?.toString();
    if (!id || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

  // Pick exactly ONE self-conversation (prioritizing isMe: true, then newest activity)
  let primarySelf = null;
  if (selfConvs.length > 0) {
    selfConvs.sort((a, b) => {
      if (a.isMe && !b.isMe) return -1;
      if (!a.isMe && b.isMe) return 1;
      const tA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return tB - tA;
    });
    primarySelf = { ...selfConvs[0], isMe: true };
  }

  return primarySelf ? [primarySelf, ...uniqueOtherConvs] : uniqueOtherConvs;
};

function AppLayout() {
  const { user, updateUser } = useAuth();
  const currentUserId = (user?.id || user?._id)?.toString();

  const {
    socket,
    onlineUserIds,
    lastSeenByUserId,
    joinConversation,
    leaveConversation,
    emitTyping,
    emitStopTyping,
    joinChannelRoom,
    leaveChannelRoom,
    emitChannelTyping,
    emitChannelStopTyping,
  } = useSocket();

  // Navigation and Workspace States
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'channels' | 'contacts' | 'calendar'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarPrefill, setCalendarPrefill] = useState(null);

  // Live Database States
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messagesMap, setMessagesMap] = useState({}); // { [convId]: Message[] }

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelMessagesMap, setChannelMessagesMap] = useState({}); // { [channelId]: Message[] }

  const [contacts, setContacts] = useState([]);
  const [typingUsersMap, setTypingUsersMap] = useState({}); // { [convId]: { [userId]: userName } }
  const [channelTypingMap, setChannelTypingMap] = useState({}); // { [channelId]: { [userId]: userName } }
  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const [pinnedMessagesMap, setPinnedMessagesMap] = useState({}); // { [conversationId|channelId]: PinnedMessage[] }
  const [pinnedChats, setPinnedChats] = useState(() => (user?.pinnedChats || []).map((id) => (id._id || id.id || id)?.toString()));
  const [pinnedChannels, setPinnedChannels] = useState(() => (user?.pinnedChannels || []).map((id) => (id._id || id.id || id)?.toString()));

  useEffect(() => {
    if (user?.pinnedChats) {
      setPinnedChats(user.pinnedChats.map((id) => (id._id || id.id || id)?.toString()));
    }
    if (user?.pinnedChannels) {
      setPinnedChannels(user.pinnedChannels.map((id) => (id._id || id.id || id)?.toString()));
    }
  }, [user?.pinnedChats, user?.pinnedChannels]);

  // Check Google Calendar connection status on mount
  useEffect(() => {
    const checkCalendarStatus = async () => {
      try {
        const data = await getGoogleCalendarStatus();
        setCalendarConnected(Boolean(data?.connected));
      } catch {
        // Silently fail - calendar status is non-critical
      }
    };
    checkCalendarStatus();

    // Handle the OAuth redirect callback: ?google_calendar=connected
    const params = new URLSearchParams(window.location.search);
    const gcParam = params.get('google_calendar');
    if (gcParam) {
      // Clean the URL without a full reload
      window.history.replaceState({}, document.title, window.location.pathname);
      if (gcParam === 'connected') {
        // Refresh status and switch to calendar tab
        checkCalendarStatus().then(() => setActiveTab('calendar'));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleFcmNavigation = (e) => {
      const data = e.detail || e.data;
      if (!data) return;
      if (data.type === 'channel' && data.channelId) {
        setActiveTab('channels');
        setChannels(prev => {
          const ch = prev.find(c => (c._id || c.id)?.toString() === data.channelId);
          if (ch) {
            setSelectedChannel(ch);
          } else {
            setSelectedChannel({ _id: data.channelId });
          }
          return prev;
        });
      } else if (data.type === 'dm' && data.conversationId) {
        setActiveTab('chats');
        setConversations(prev => {
          const cv = prev.find(c => (c._id || c.id)?.toString() === data.conversationId);
          if (cv) {
            setSelectedChat(cv);
          } else {
            setSelectedChat({ _id: data.conversationId });
          }
          return prev;
        });
      }
    };
    
    window.addEventListener('fcm-notification-click', handleFcmNavigation);
    const handleServiceWorkerMessage = (e) => {
      if (e.data && e.data.type === 'fcm-notification-click') {
        handleFcmNavigation({ detail: e.data.data });
      }
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('fcm-notification-click', handleFcmNavigation);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Handle "Add to Calendar" from TodoItem or other sources
  const handleAddToCalendar = (todo) => {
    // Pre-fill the Create Event form using todo fields
    const toLocalInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const toLocalDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const prefill = {
      summary: todo.title || '',
      description: todo.description || '',
      allDay: Boolean(todo.dueDate && !todo.dueTime),
      startDate: todo.dueDate ? toLocalDate(new Date(todo.dueDate)) : toLocalDate(new Date()),
      endDate: todo.dueDate ? toLocalDate(new Date(todo.dueDate)) : toLocalDate(new Date()),
      start: todo.dueDate ? toLocalInput(new Date(todo.dueDate)) : '',
      end: todo.dueDate ? toLocalInput(new Date(new Date(todo.dueDate).getTime() + 3600000)) : '',
    };
    setCalendarPrefill(prefill);
    setActiveTab('calendar');
  };

  // Level 9: Advanced Search & Pagination States
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [hasMoreMap, setHasMoreMap] = useState({}); // { [id]: boolean }
  const [loadingOlderMap, setLoadingOlderMap] = useState({}); // { [id]: boolean }

  // Level 13: Global To-Do Modal State (triggered from ChatWindow, ChannelWindow, or MessageBubble)
  const [isGlobalTodoModalOpen, setIsGlobalTodoModalOpen] = useState(false);
  const [globalTodoContext, setGlobalTodoContext] = useState(null);

  // Join Request Approval Popup State
  const [joinApprovalModal, setJoinApprovalModal] = useState({
    isOpen: false,
    companyName: '',
    orgId: null,
  });

  // Organization Invitation Modal State
  const [invitationModal, setInvitationModal] = useState({
    isOpen: false,
    invitation: null,
  });

  // Due Reminder Notification Popup State
  const [dueReminder, setDueReminder] = useState(null);

  // Listen for real-time reminder:due events
  useEffect(() => {
    if (!socket) return;
    const handleReminderDue = (data) => {
      if (data?.reminder) {
        setDueReminder(data.reminder);
      }
    };
    socket.on('reminder:due', handleReminderDue);
    return () => {
      socket.off('reminder:due', handleReminderDue);
    };
  }, [socket]);


  // Loading & Error States
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingChannelMessages, setLoadingChannelMessages] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [apiError, setApiError] = useState(null);

  const org = user?.currentOrganization;
  const subExpiresAt = org?.subscription?.expiresAt;
  const isDateExpired = Boolean(subExpiresAt && new Date() > new Date(subExpiresAt));
  const rawOrgStatus = (
    org?.status ||
    org?.subscription?.status ||
    user?.organizationStatus ||
    ''
  ).toLowerCase();

  const [liveStatus, setLiveStatus] = useState(null); // 'active' | 'suspended' | 'expired' | null
  const effectiveStatus = (liveStatus || (isDateExpired ? 'expired' : rawOrgStatus) || '').toLowerCase();
  const isExpired = effectiveStatus === 'expired';
  const isSuspended = effectiveStatus === 'suspended' && !isExpired;
  const isPlanDisabled = isExpired || isSuspended;

  // Listen for real-time organization status updates
  useEffect(() => {
    if (!socket) return;
    const handleStatusChanged = (payload) => {
      if (payload?.status) {
        setLiveStatus(payload.status.toLowerCase());
      }
    };
    socket.on('org:statusChanged', handleStatusChanged);
    return () => {
      socket.off('org:statusChanged', handleStatusChanged);
    };
  }, [socket]);

  const currentOrgId = (user?.currentOrganization?._id || user?.currentOrganizationId || user?.currentOrganization)?.toString();

  // Helper to update a message in direct messages and channel messages maps
  const updateMessage = useCallback((messageId, patch) => {
    if (!messageId) return;
    const msgId = messageId.toString();
    setMessagesMap((prev) => {
      let changed = false;
      const next = {};
      for (const [key, list] of Object.entries(prev)) {
        if (Array.isArray(list) && list.some((m) => (m._id || m.id)?.toString() === msgId)) {
          changed = true;
          next[key] = list.map((m) => ((m._id || m.id)?.toString() === msgId ? { ...m, ...patch } : m));
        } else {
          next[key] = list;
        }
      }
      return changed ? next : prev;
    });
    setChannelMessagesMap((prev) => {
      let changed = false;
      const next = {};
      for (const [key, list] of Object.entries(prev)) {
        if (Array.isArray(list) && list.some((m) => (m._id || m.id)?.toString() === msgId)) {
          changed = true;
          next[key] = list.map((m) => ((m._id || m.id)?.toString() === msgId ? { ...m, ...patch } : m));
        } else {
          next[key] = list;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // 1. Fetch Conversations from MongoDB
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      if (data.success) {
        let list = data.conversations || [];
        // Ensure "Me" self-conversation exists in the workspace
        let meConv = list.find((c) => isSelfConversation(c, currentUserId));
        if (!meConv && currentUserId) {
          try {
            const selfRes = await createOrGetConversation(currentUserId);
            if (selfRes.success && selfRes.conversation) {
              meConv = { ...selfRes.conversation, isMe: true };
              list = [meConv, ...list];
            }
          } catch (e) {
            console.warn('Failed to ensure Me self-conversation:', e.message);
          }
        }
        setConversations(deduplicateConversations(list, currentUserId));
      }
    } catch (err) {
      console.error('Failed to load conversations:', err.message);
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUserId]);

  // 2. Fetch Channels from MongoDB
  const loadChannels = useCallback(async () => {
    try {
      setLoadingChannels(true);
      const data = await getChannels();
      if (data.success) {
        const fetchedChannels = data.channels || [];
        setChannels(fetchedChannels);
      }
    } catch (err) {
      console.error('Failed to load channels:', err.message);
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      }
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  // 3. Fetch Team Contacts from MongoDB
  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const data = await getTeamUsers();
      if (data.success) {
        setContacts(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load team contacts:', err.message);
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      }
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Reset and load workspace state whenever the active organization changes or user logs out/switches
  useEffect(() => {
    setConversations([]);
    setSelectedChat(null);
    setMessagesMap({});
    setChannels([]);
    setSelectedChannel(null);
    setChannelMessagesMap({});
    setContacts([]);
    setTypingUsersMap({});
    setChannelTypingMap({});
    setSavedMessageIds(new Set());
    setPinnedMessagesMap({});
    setHighlightedMessageId(null);
    setHasMoreMap({});
    setLoadingOlderMap({});

    if (currentOrgId) {
      loadConversations();
      loadChannels();
      loadContacts();
      getSavedMessages({ limit: 100 })
        .then((data) => setSavedMessageIds(new Set((data.savedMessages || []).map((item) => (item.messageId?._id || item.messageId)?.toString()))))
        .catch((error) => console.error('Failed to load saved messages:', error.message));
    }
  }, [currentOrgId, currentUserId, loadConversations, loadChannels, loadContacts]);

  // Ensure active tab data is fresh whenever the user switches tabs
  useEffect(() => {
    if (activeTab === 'contacts') {
      loadContacts();
    } else if (activeTab === 'channels') {
      loadChannels();
    } else if (activeTab === 'chats') {
      loadConversations();
    }
  }, [activeTab, loadContacts, loadChannels, loadConversations]);

  // Firebase Cloud Messaging (FCM) Token Generation
  useEffect(() => {
    if (!user) return;

    const requestFCMToken = async () => {
      try {
        // Do not request if the user explicitly denied permissions previously
        if (Notification.permission === 'denied') {
          console.log('[FCM] Notification permission is denied.');
          return;
        }

        // Register the service worker with the dynamic Vite environment variables
        const swUrl = `/firebase-messaging-sw.js?apiKey=${import.meta.env.VITE_FIREBASE_API_KEY}&projectId=${import.meta.env.VITE_FIREBASE_PROJECT_ID}&messagingSenderId=${import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID}&appId=${import.meta.env.VITE_FIREBASE_APP_ID}&authDomain=${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}&storageBucket=${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}`;
        const registration = await navigator.serviceWorker.register(swUrl);

        // Retrieve the FCM registration token (prompts the user if permission is 'default')
        const currentToken = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY, 
          serviceWorkerRegistration: registration 
        });

        if (currentToken) {
          // Log the token only for development/testing
          console.log('[FCM Integration] Generated Registration Token:', currentToken);
          
          // Send to backend if it's new/changed for THIS specific user
          const cacheKey = `fcm_token_${user._id}`;
          const cachedToken = localStorage.getItem(cacheKey);
          if (cachedToken !== currentToken) {
            try {
              await registerFCMToken(currentToken);
              localStorage.setItem(cacheKey, currentToken);
              console.log('[FCM Integration] Token successfully registered with backend.');
            } catch (apiErr) {
              console.error('[FCM Integration] Failed to register token with backend:', apiErr.message);
            }
          }
          
          // Set up foreground message handler
          onMessage(messaging, (payload) => {
            console.log('[FCM Integration] Received foreground message:', payload);
            if (Notification.permission === 'granted') {
              const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
              const notificationOptions = {
                body: payload.notification?.body || payload.data?.body || '',
                icon: '/favicon.ico',
                data: payload.data
              };
              const n = new Notification(notificationTitle, notificationOptions);
              n.onclick = function() {
                window.focus();
                window.dispatchEvent(new CustomEvent('fcm-notification-click', { detail: payload.data }));
                this.close();
              };
            }
          });
        } else {
          console.log('[FCM Integration] No registration token available.');
        }
      } catch (err) {
        console.error('[FCM Integration] An error occurred while retrieving token:', err);
      }
    };

    requestFCMToken();
  }, [user]);

  // 4. Socket Conversation Room Management
  useEffect(() => {
    if (activeTab === 'chats' && selectedChat) {
      const convId = (selectedChat._id || selectedChat.id)?.toString();
      if (convId) {
        joinConversation(convId);
        return () => {
          leaveConversation(convId);
        };
      }
    }
  }, [activeTab, selectedChat, joinConversation, leaveConversation]);

  // 5. Socket Channel Room Management
  useEffect(() => {
    if (activeTab === 'channels' && selectedChannel) {
      const channelId = (selectedChannel._id || selectedChannel.id)?.toString();
      if (channelId) {
        joinChannelRoom(channelId);
        return () => {
          leaveChannelRoom(channelId);
        };
      }
    }
  }, [activeTab, selectedChannel, joinChannelRoom, leaveChannelRoom]);

  const selectedChatRef = useRef(selectedChat);
  const selectedChannelRef = useRef(selectedChannel);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // 6. Listen for Direct and Channel Real-Time Socket Events
  useEffect(() => {
    if (!socket) return;

    // A. Direct Message Received
    const handleNewDirectMessage = ({ message }) => {
      if (!message || !message.conversationId) return;

      const convId = (message.conversationId._id || message.conversationId).toString();
      const messageSenderId = (message.sender?._id || message.sender?.id || message.sender)?.toString();
      const isFromSelf = messageSenderId === currentUserId;

      setMessagesMap((prev) => {
        const existing = prev[convId] || [];
        if (existing.some((m) => (m._id || m.id)?.toString() === (message._id || message.id)?.toString())) {
          return prev;
        }
        return { ...prev, [convId]: [...existing, message] };
      });

      setConversations((prev) => {
        const activeConvId = (selectedChatRef.current?._id || selectedChatRef.current?.id)?.toString();
        const isDocumentVisibleAndFocused = typeof document !== 'undefined' && !document.hidden && document.hasFocus();
        const isCurrentActiveChat = activeTabRef.current === 'chats' && activeConvId === convId && isDocumentVisibleAndFocused;
        const existingConv = prev.find((c) => (c._id || c.id)?.toString() === convId);

        const isSelfMsg =
          (isFromSelf &&
            (message.receiver?._id || message.receiver?.id || message.receiver)?.toString() === currentUserId) ||
          (existingConv && (existingConv.isMe || (Array.isArray(existingConv.participants) && existingConv.participants.length === 1)));

        const unreadCount = isCurrentActiveChat || isFromSelf || isSelfMsg ? 0 : (existingConv?.unread || 0) + 1;

        const updatedConv = existingConv
          ? {
            ...existingConv,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unread: isSelfMsg ? 0 : unreadCount,
            ...(isSelfMsg || existingConv.isMe ? { isMe: true } : {}),
          }
          : {
            _id: convId,
            participants: isSelfMsg ? [message.sender] : [message.sender, message.receiver],
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unread: isSelfMsg ? 0 : unreadCount,
            ...(isSelfMsg ? { isMe: true } : {}),
          };

        const others = prev.filter((c) => (c._id || c.id)?.toString() !== convId);
        return deduplicateConversations([updatedConv, ...others], currentUserId);
      });

      // Only mark as read if the recipient currently has this conversation open, visible, and focused
      const isDocVisibleAndFocused = typeof document !== 'undefined' && !document.hidden && document.hasFocus();
      const activeConvId = (selectedChatRef.current?._id || selectedChatRef.current?.id)?.toString();
      if (activeTabRef.current === 'chats' && activeConvId === convId && !isFromSelf && isDocVisibleAndFocused) {
        const msgId = message._id || message.id;
        if (msgId) {
          markMessagesAsRead([msgId]).catch((err) =>
            console.error('Failed to auto-mark live message as read:', err)
          );
        }
      }

      setTypingUsersMap((prev) => {
        if (!prev[convId]) return prev;
        const next = { ...prev };
        delete next[convId];
        return next;
      });
    };

    // B. Channel Message Received
    const handleNewChannelMessage = ({ message }) => {
      if (!message || !message.channelId) return;

      const chId = (message.channelId._id || message.channelId).toString();
      const messageSenderId = (message.sender?._id || message.sender?.id || message.sender)?.toString();
      const isFromSelf = messageSenderId === currentUserId;

      setChannelMessagesMap((prev) => {
        const existing = prev[chId] || [];
        if (existing.some((m) => (m._id || m.id)?.toString() === (message._id || message.id)?.toString())) {
          return prev;
        }
        return { ...prev, [chId]: [...existing, message] };
      });

      setChannels((prev) => {
        const activeChId = (selectedChannelRef.current?._id || selectedChannelRef.current?.id)?.toString();
        const isDocumentVisibleAndFocused = typeof document !== 'undefined' && !document.hidden && document.hasFocus();
        const isCurrentActiveChannel = activeTabRef.current === 'channels' && activeChId === chId && isDocumentVisibleAndFocused;
        const existingCh = prev.find((c) => (c._id || c.id)?.toString() === chId);
        const unreadCount = isCurrentActiveChannel || isFromSelf ? 0 : (existingCh?.unread || 0) + 1;

        const updatedCh = existingCh
          ? { ...existingCh, lastMessage: message, lastMessageAt: message.createdAt, unread: unreadCount }
          : { _id: chId, name: message.channelId?.name || 'Channel', lastMessage: message, lastMessageAt: message.createdAt, unread: unreadCount };

        const others = prev.filter((c) => (c._id || c.id)?.toString() !== chId);
        return [updatedCh, ...others];
      });

      // Only mark as read if the recipient currently has this channel open, visible, and focused
      const isDocVisibleAndFocused = typeof document !== 'undefined' && !document.hidden && document.hasFocus();
      const activeChId = (selectedChannelRef.current?._id || selectedChannelRef.current?.id)?.toString();
      if (activeTabRef.current === 'channels' && activeChId === chId && !isFromSelf && isDocVisibleAndFocused) {
        const msgId = message._id || message.id;
        if (msgId) {
          markMessagesAsRead([msgId]).catch((err) =>
            console.error('Failed to auto-mark live channel message as read:', err)
          );
        }
      }

      setChannelTypingMap((prev) => {
        if (!prev[chId]) return prev;
        const next = { ...prev };
        delete next[chId];
        return next;
      });
    };

    // C. Direct Typing
    const handleDirectTyping = ({ conversationId, userId, userName }) => {
      if (conversationId && userName) {
        const typerId = userId?.toString() || userName;
        setTypingUsersMap((prev) => ({
          ...prev,
          [conversationId.toString()]: { ...(prev[conversationId.toString()] || {}), [typerId]: userName },
        }));
        window.setTimeout(() => {
          setTypingUsersMap((prev) => {
            const current = prev[conversationId.toString()] || {};
            const updated = { ...current };
            delete updated[typerId];
            if (!Object.keys(updated).length) {
              const next = { ...prev };
              delete next[conversationId.toString()];
              return next;
            }
            return { ...prev, [conversationId.toString()]: updated };
          });
        }, 3000);
      }
    };

    const handleDirectStopTyping = ({ conversationId, userId }) => {
      if (conversationId) {
        setTypingUsersMap((prev) => {
          const current = prev[conversationId.toString()] || {};
          if (!current[userId?.toString()]) return prev;
          const next = { ...prev };
          const updated = { ...current };
          delete updated[userId.toString()];
          if (Object.keys(updated).length) next[conversationId.toString()] = updated;
          else delete next[conversationId.toString()];
          return next;
        });
      }
    };

    // D. Channel Typing
    const handleChannelTyping = ({ channelId, userId, userName }) => {
      if (channelId && userName) {
        const typerId = userId?.toString() || userName;
        setChannelTypingMap((prev) => ({
          ...prev,
          [channelId.toString()]: { ...(prev[channelId.toString()] || {}), [typerId]: userName },
        }));
        window.setTimeout(() => {
          setChannelTypingMap((prev) => {
            const current = prev[channelId.toString()] || {};
            const updated = { ...current };
            delete updated[typerId];
            if (!Object.keys(updated).length) {
              const next = { ...prev };
              delete next[channelId.toString()];
              return next;
            }
            return { ...prev, [channelId.toString()]: updated };
          });
        }, 3000);
      }
    };

    const handleChannelStopTyping = ({ channelId, userId }) => {
      if (channelId) {
        setChannelTypingMap((prev) => {
          const current = prev[channelId.toString()] || {};
          if (!current[userId?.toString()]) return prev;
          const next = { ...prev };
          const updated = { ...current };
          delete updated[userId.toString()];
          if (Object.keys(updated).length) next[channelId.toString()] = updated;
          else delete next[channelId.toString()];
          return next;
        });
      }
    };

    // E. Real-Time Channel Lifecycle Events
    const handleChannelCreated = ({ channel }) => {
      if (!channel) return;
      setChannels((prev) => {
        const chanId = (channel._id || channel.id)?.toString();
        if (prev.some((c) => (c._id || c.id)?.toString() === chanId)) {
          return prev;
        }
        return [channel, ...prev];
      });
    };

    const handleChannelUpdated = ({ channel, leftUserId, addedUserIds }) => {
      if (!channel) return;
      const chanId = (channel._id || channel.id)?.toString();
      
      const isMember = channel.members?.some(
        (m) => (m._id || m.id || m)?.toString() === currentUserId?.toString()
      );
      const shouldBeVisible = isMember || !channel.isPrivate;

      setChannels((prev) => {
        const exists = prev.some((c) => (c._id || c.id)?.toString() === chanId);
        if (exists) {
          if (!shouldBeVisible) {
            return prev.filter((c) => (c._id || c.id)?.toString() !== chanId);
          }
          return prev.map((c) => ((c._id || c.id)?.toString() === chanId ? { ...c, ...channel } : c));
        }
        // If current user is now in the channel members, add it to channel list in real time!
        if (shouldBeVisible) {
          return [channel, ...prev];
        }
        return prev;
      });
      
      setSelectedChannel((prev) => {
        if (prev && (prev._id || prev.id)?.toString() === chanId) {
          if (!shouldBeVisible) return null;
          return { ...prev, ...channel };
        }
        return prev;
      });
    };

    const handleChannelDeleted = ({ channelId }) => {
      if (!channelId) return;
      const idStr = channelId.toString();
      setChannels((prev) => prev.filter((c) => (c._id || c.id)?.toString() !== idStr));
      setSelectedChannel((prev) =>
        prev && (prev._id || prev.id)?.toString() === idStr ? null : prev
      );
    };

    // F. Real-Time Message Edited
    const handleMessageEdited = (payload) => {
      if (!payload || !payload.messageId) return;
      const msgId = payload.messageId.toString();

      if (payload.conversationId) {
        const convId = payload.conversationId.toString();
        setMessagesMap((prev) => {
          const list = prev[convId];
          if (!list) return prev;
          return {
            ...prev,
            [convId]: list.map((m) =>
              (m._id || m.id)?.toString() === msgId
                ? { ...m, ...(payload.message || {}), content: payload.content, edited: true, editedAt: payload.editedAt }
                : m
            ),
          };
        });
      }

      if (payload.channelId) {
        const chId = payload.channelId.toString();
        setChannelMessagesMap((prev) => {
          const list = prev[chId];
          if (!list) return prev;
          return {
            ...prev,
            [chId]: list.map((m) =>
              (m._id || m.id)?.toString() === msgId
                ? { ...m, ...(payload.message || {}), content: payload.content, edited: true, editedAt: payload.editedAt }
                : m
            ),
          };
        });
      }
    };

    // G. Real-Time Message Deleted
    const handleMessageDeleted = (payload) => {
      if (!payload || !payload.messageId) return;
      const msgId = payload.messageId.toString();

      if (payload.conversationId) {
        const convId = payload.conversationId.toString();
        setMessagesMap((prev) => {
          const list = prev[convId];
          if (!list) return prev;
          return {
            ...prev,
            [convId]: list.map((m) =>
              (m._id || m.id)?.toString() === msgId
                ? {
                  ...m,
                  ...(payload.message || {}),
                  deleted: true,
                  deletedAt: payload.deletedAt,
                  deletedBy: payload.deletedBy,
                  content: 'This message was deleted',
                  attachments: [],
                }
                : m
            ),
          };
        });
      }

      if (payload.channelId) {
        const chId = payload.channelId.toString();
        setChannelMessagesMap((prev) => {
          const list = prev[chId];
          if (!list) return prev;
          return {
            ...prev,
            [chId]: list.map((m) =>
              (m._id || m.id)?.toString() === msgId
                ? {
                  ...m,
                  ...(payload.message || {}),
                  deleted: true,
                  deletedAt: payload.deletedAt,
                  deletedBy: payload.deletedBy,
                  content: 'This message was deleted',
                  attachments: [],
                }
                : m
            ),
          };
        });
      }
    };

    // H. Real-Time Reaction Updated (Level 15)
    const handleReactionUpdated = (payload) => {
      if (!payload || !payload.messageId) return;
      const msgId = payload.messageId.toString();

      if (payload.conversationId) {
        const convId = payload.conversationId.toString();
        setMessagesMap((prev) => {
          const list = prev[convId];
          if (!list) return prev;
          return {
            ...prev,
            [convId]: list.map((m) =>
              (m._id || m.id)?.toString() === msgId
                ? { ...m, reactions: payload.reactions }
                : m
            ),
          };
        });
      }

      if (payload.channelId) {
        const chId = payload.channelId.toString();
        setChannelMessagesMap((prev) => {
          const list = prev[chId];
          if (!list) return prev;
          return {
            ...prev,
            [chId]: list.map((m) =>
              (m._id || m.id)?.toString() === msgId
                ? { ...m, reactions: payload.reactions }
                : m
            ),
          };
        });
      }
    };

    const handleMessagesRead = ({ conversationId, channelId, messageIds = [], userId, readAt }) => {
      if (!messageIds.length) return;
      const updateReadList = (list) => list.map((message) => (
        messageIds.some((id) => id.toString() === (message._id || message.id)?.toString())
          ? {
            ...message,
            isRead: true,
            readBy: [
              ...(message.readBy || []).filter((reader) => (reader.userId?._id || reader.userId)?.toString() !== userId.toString()),
              { userId, readAt },
            ],
          }
          : message
      ));
      if (conversationId) {
        const id = conversationId.toString();
        setMessagesMap((prev) => ({ ...prev, [id]: updateReadList(prev[id] || []) }));
      }
      if (channelId) {
        const id = channelId.toString();
        setChannelMessagesMap((prev) => ({ ...prev, [id]: updateReadList(prev[id] || []) }));
      }
    };

    const handlePinned = (payload) => {
      if (!payload?.messageId) return;
      const messageId = (payload.messageId._id || payload.messageId.id || payload.messageId).toString();
      updateMessage(messageId, { pinned: true });
      const scopeId = (payload.conversationId || payload.channelId)?.toString();
      if (scopeId) setPinnedMessagesMap((prev) => ({
        ...prev,
        [scopeId]: prev[scopeId]?.some((pin) => (pin.messageId?._id || pin.messageId)?.toString() === messageId)
          ? prev[scopeId]
          : [...(prev[scopeId] || []), payload],
      }));
    };

    const handleUnpinned = (payload) => {
      if (!payload?.messageId) return;
      const messageId = (payload.messageId._id || payload.messageId.id || payload.messageId).toString();
      updateMessage(messageId, { pinned: false });
      const scopeId = (payload.conversationId || payload.channelId)?.toString();
      if (scopeId) setPinnedMessagesMap((prev) => ({
        ...prev,
        [scopeId]: (prev[scopeId] || []).filter((pin) => (pin.messageId?._id || pin.messageId)?.toString() !== messageId),
      }));
    };

    const handlePollVoted = (payload) => {
      if (!payload?.messageId || !payload?.poll) return;
      const messageId = (payload.messageId._id || payload.messageId.id || payload.messageId).toString();
      updateMessage(messageId, { poll: payload.poll });
    };

    const handleMemberChanged = () => {
      loadContacts();
    };

    const handleReconnect = () => {
      loadConversations();
      loadChannels();
    };

    socket.on('connect', handleReconnect);
    socket.on('message:new', handleNewDirectMessage);
    socket.on('channel:message:new', handleNewChannelMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('channel:message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('channel:message:deleted', handleMessageDeleted);
    socket.on('message:reaction:updated', handleReactionUpdated);
    socket.on('message:read', handleMessagesRead);
    socket.on('message:pinned', handlePinned);
    socket.on('message:unpinned', handleUnpinned);
    socket.on('message:poll_voted', handlePollVoted);
    socket.on('typing', handleDirectTyping);
    socket.on('stop_typing', handleDirectStopTyping);
    socket.on('channel:typing', handleChannelTyping);
    socket.on('channel:stop_typing', handleChannelStopTyping);
    socket.on('channel:created', handleChannelCreated);
    socket.on('channel:updated', handleChannelUpdated);
    socket.on('channel:deleted', handleChannelDeleted);
    socket.on('organization:member_joined', handleMemberChanged);
    socket.on('organization:members_updated', handleMemberChanged);
    socket.on('invitation:accepted', handleMemberChanged);

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('message:new', handleNewDirectMessage);
      socket.off('channel:message:new', handleNewChannelMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('channel:message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('channel:message:deleted', handleMessageDeleted);
      socket.off('message:reaction:updated', handleReactionUpdated);
      socket.off('message:read', handleMessagesRead);
      socket.off('message:pinned', handlePinned);
      socket.off('message:unpinned', handleUnpinned);
      socket.off('message:poll_voted', handlePollVoted);
      socket.off('typing', handleDirectTyping);
      socket.off('stop_typing', handleDirectStopTyping);
      socket.off('channel:typing', handleChannelTyping);
      socket.off('channel:stop_typing', handleChannelStopTyping);
      socket.off('channel:created', handleChannelCreated);
      socket.off('channel:updated', handleChannelUpdated);
      socket.off('channel:deleted', handleChannelDeleted);
      socket.off('organization:member_joined', handleMemberChanged);
      socket.off('organization:members_updated', handleMemberChanged);
      socket.off('invitation:accepted', handleMemberChanged);
    };
  }, [socket, currentUserId, loadContacts, loadConversations, loadChannels]);

  // Load pinned messages for a specific conversation or channel scope
  const loadPinnedForScope = async (scopeId, type = 'conversation') => {
    if (!scopeId) return;
    try {
      const params = type === 'channel' ? { channelId: scopeId } : { conversationId: scopeId };
      const data = await getPinnedMessages(params);
      if (data?.success && Array.isArray(data.pinnedMessages)) {
        setPinnedMessagesMap((prev) => ({
          ...prev,
          [scopeId]: data.pinnedMessages,
        }));
      }
    } catch (err) {
      console.warn('Failed to load pinned messages for scope:', scopeId, err.message);
    }
  };

  // Pin a message in conversation or channel
  const handlePinMessage = async (messageId) => {
    try {
      const data = await pinMessage(messageId);
      if (data?.success && data.pinnedMessage) {
        updateMessage(messageId, { pinned: true });
        const scopeId = (data.pinnedMessage.conversationId || data.pinnedMessage.channelId)?.toString();
        if (scopeId) {
          setPinnedMessagesMap((prev) => ({
            ...prev,
            [scopeId]: [
              data.pinnedMessage,
              ...(prev[scopeId] || []).filter(
                (p) => (p.messageId?._id || p.messageId)?.toString() !== messageId
              ),
            ],
          }));
        }
      }
    } catch (err) {
      console.error('Failed to pin message:', err.message);
      setApiError(err.response?.data?.message || 'Unable to pin message');
    }
  };

  // Unpin a message in conversation or channel
  const handleUnpinMessage = async (messageId) => {
    try {
      const data = await unpinMessage(messageId);
      if (data?.success) {
        updateMessage(messageId, { pinned: false });
        setPinnedMessagesMap((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((scope) => {
            next[scope] = (next[scope] || []).filter(
              (p) => (p.messageId?._id || p.messageId)?.toString() !== messageId
            );
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to unpin message:', err.message);
      setApiError(err.response?.data?.message || 'Unable to unpin message');
    }
  };

  // Pin a chat or channel from the sidebar (Max 10 total combined)
  const handlePinItem = async (itemId, itemType) => {
    const stringId = (itemId?._id || itemId?.id || itemId)?.toString();
    if (!stringId) return;

    const currentTotal = pinnedChats.length + pinnedChannels.length;
    const isAlreadyPinned =
      itemType === 'chat'
        ? pinnedChats.includes(stringId)
        : pinnedChannels.includes(stringId);

    if (isAlreadyPinned) return;

    if (currentTotal >= 10) {
      setApiError(
        'Maximum of 10 pinned items reached (chats and channels combined). Please unpin an item first.'
      );
      return;
    }

    // Optimistically update
    if (itemType === 'chat') {
      setPinnedChats((prev) => [...prev, stringId]);
    } else {
      setPinnedChannels((prev) => [...prev, stringId]);
    }

    try {
      const data = await pinItem({ itemId: stringId, itemType });
      if (data?.success) {
        const nextChats = (data.pinnedChats || []).map((id) => (id._id || id.id || id)?.toString());
        const nextChannels = (data.pinnedChannels || []).map((id) => (id._id || id.id || id)?.toString());
        setPinnedChats(nextChats);
        setPinnedChannels(nextChannels);
        if (updateUser) {
          updateUser({ ...user, pinnedChats: nextChats, pinnedChannels: nextChannels });
        }
      }
    } catch (err) {
      console.error('Failed to pin item:', err.message);
      if (itemType === 'chat') {
        setPinnedChats((prev) => prev.filter((id) => id !== stringId));
      } else {
        setPinnedChannels((prev) => prev.filter((id) => id !== stringId));
      }
      setApiError(err.response?.data?.message || 'Unable to pin item');
    }
  };

  // Unpin a chat or channel from the sidebar
  const handleUnpinItem = async (itemId, itemType) => {
    const stringId = (itemId?._id || itemId?.id || itemId)?.toString();
    if (!stringId) return;

    // Optimistically update
    if (itemType === 'chat') {
      setPinnedChats((prev) => prev.filter((id) => id !== stringId));
    } else if (itemType === 'channel') {
      setPinnedChannels((prev) => prev.filter((id) => id !== stringId));
    } else {
      setPinnedChats((prev) => prev.filter((id) => id !== stringId));
      setPinnedChannels((prev) => prev.filter((id) => id !== stringId));
    }

    try {
      const data = await unpinItem({ itemId: stringId, itemType });
      if (data?.success) {
        const nextChats = (data.pinnedChats || []).map((id) => (id._id || id.id || id)?.toString());
        const nextChannels = (data.pinnedChannels || []).map((id) => (id._id || id.id || id)?.toString());
        setPinnedChats(nextChats);
        setPinnedChannels(nextChannels);
        if (updateUser) {
          updateUser({ ...user, pinnedChats: nextChats, pinnedChannels: nextChannels });
        }
      }
    } catch (err) {
      console.error('Failed to unpin item:', err.message);
      setApiError(err.response?.data?.message || 'Unable to unpin item');
    }
  };

  // 7. Select Direct Conversation
  const handleSelectConversation = async (conversation) => {
    const isSelf = isSelfConversation(conversation, currentUserId);
    const normalizedConv = isSelf ? { ...conversation, isMe: true } : conversation;

    setSelectedChat(normalizedConv);
    setSelectedChannel(null);
    setApiError(null);

    const convId = (normalizedConv._id || normalizedConv.id)?.toString();
    if (!convId) return;

    setConversations((prev) => {
      const exists = prev.some((c) => (c._id || c.id)?.toString() === convId);
      if (exists) {
        return prev.map((c) => ((c._id || c.id)?.toString() === convId ? { ...c, unread: 0 } : c));
      }
      return deduplicateConversations([{ ...normalizedConv, unread: 0 }, ...prev], currentUserId);
    });

    if (!messagesMap[convId]) {
      setLoadingMessages(true);
    }

    try {
      const data = await getMessages(convId);
      if (data && data.success) {
        const fetched = data.messages || [];
        setMessagesMap((prev) => ({ ...prev, [convId]: fetched }));
        const unreadIds = fetched
          .filter((message) => {
            const senderId = (message.sender?._id || message.sender?.id || message.sender)?.toString();
            const isReadByMe = message.readBy?.some(
              (r) => (r.userId?._id || r.userId || r)?.toString() === currentUserId
            );
            return senderId && senderId !== currentUserId && (!message.isRead || !isReadByMe);
          })
          .map((message) => message._id || message.id);
        if (unreadIds.length) {
          const readData = await markMessagesAsRead(unreadIds);
          const readAt = readData?.readAt || new Date().toISOString();
          setMessagesMap((prev) => ({
            ...prev,
            [convId]: (prev[convId] || []).map((message) =>
              unreadIds.some((id) => id.toString() === (message._id || message.id)?.toString())
                ? {
                  ...message,
                  isRead: true,
                  readBy: [
                    ...(message.readBy || []).filter((r) => (r.userId?._id || r.userId || r)?.toString() !== currentUserId),
                    { userId: currentUserId, readAt },
                  ],
                }
                : message
            ),
          }));
        }
      }
      await loadPinnedForScope(convId, 'conversation');
    } catch (err) {
      console.warn('Failed to fetch messages for conversation:', convId, err.message);
      // Only set error banner if we don't already have cached messages in memory
      if (!messagesMap[convId] || messagesMap[convId].length === 0) {
        setApiError(err.response?.data?.message || 'Unable to load conversation messages');
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // 8. Select Group Channel
  const handleSelectChannel = async (channel) => {
    setSelectedChannel(channel);
    setSelectedChat(null);
    setApiError(null);

    const chId = (channel._id || channel.id)?.toString();
    if (!chId) return;

    setChannels((prev) => {
      const exists = prev.some((c) => (c._id || c.id)?.toString() === chId);
      if (exists) {
        return prev.map((c) => ((c._id || c.id)?.toString() === chId ? { ...c, unread: 0 } : c));
      }
      return [{ ...channel, unread: 0 }, ...prev];
    });

    const isMember = channel.members?.some(
      (m) => (m._id || m.id || m)?.toString() === currentUserId
    );

    if (isMember) {
      if (!channelMessagesMap[chId]) {
        setLoadingChannelMessages(true);
      }
      try {
        const data = await getChannelMessages(chId);
        if (data.success) {
          const fetched = data.messages || [];
          setChannelMessagesMap((prev) => ({ ...prev, [chId]: fetched }));
          const unreadIds = fetched
            .filter((message) => {
              const senderId = (message.sender?._id || message.sender?.id || message.sender)?.toString();
              const isReadByMe = message.readBy?.some(
                (r) => (r.userId?._id || r.userId || r)?.toString() === currentUserId
              );
              return senderId && senderId !== currentUserId && (!message.isRead || !isReadByMe);
            })
            .map((message) => message._id || message.id);

          if (unreadIds.length) {
            const readData = await markMessagesAsRead(unreadIds);
            const readAt = readData?.readAt || new Date().toISOString();
            setChannelMessagesMap((prev) => ({
              ...prev,
              [chId]: (prev[chId] || []).map((message) =>
                unreadIds.some((id) => id.toString() === (message._id || message.id)?.toString())
                  ? {
                    ...message,
                    isRead: true,
                    readBy: [
                      ...(message.readBy || []).filter((r) => (r.userId?._id || r.userId || r)?.toString() !== currentUserId),
                      { userId: currentUserId, readAt },
                    ],
                  }
                  : message
              ),
            }));
          }
        }
        await loadPinnedForScope(chId, 'channel');
      } catch (err) {
        console.error('Failed to load channel messages:', err.message);
      } finally {
        setLoadingChannelMessages(false);
      }
    }
  };

  // 8b. Mark unread messages as read when user focuses/views the active chat or channel
  const markActiveScopeRead = useCallback(() => {
    if (typeof document === 'undefined' || document.hidden || !document.hasFocus()) return;

    if (activeTab === 'chats' && selectedChat) {
      const convId = (selectedChat._id || selectedChat.id)?.toString();
      if (!convId) return;
      const messages = messagesMap[convId] || [];
      const unreadIds = messages
        .filter((message) => {
          const senderId = (message.sender?._id || message.sender?.id || message.sender)?.toString();
          const isReadByMe = message.readBy?.some(
            (r) => (r.userId?._id || r.userId || r)?.toString() === currentUserId
          );
          return senderId && senderId !== currentUserId && (!message.isRead || !isReadByMe);
        })
        .map((message) => message._id || message.id);

      if (unreadIds.length) {
        markMessagesAsRead(unreadIds)
          .then((readData) => {
            const readAt = readData?.readAt || new Date().toISOString();
            setMessagesMap((prev) => ({
              ...prev,
              [convId]: (prev[convId] || []).map((m) =>
                unreadIds.some((id) => id.toString() === (m._id || m.id)?.toString())
                  ? {
                    ...m,
                    isRead: true,
                    readBy: [
                      ...(m.readBy || []).filter((r) => (r.userId?._id || r.userId || r)?.toString() !== currentUserId),
                      { userId: currentUserId, readAt },
                    ],
                  }
                  : m
              ),
            }));
          })
          .catch((err) => console.error('Failed to mark active chat messages as read on view:', err));
      }
    } else if (activeTab === 'channels' && selectedChannel) {
      const chId = (selectedChannel._id || selectedChannel.id)?.toString();
      if (!chId) return;
      const messages = channelMessagesMap[chId] || [];
      const unreadIds = messages
        .filter((message) => {
          const senderId = (message.sender?._id || message.sender?.id || message.sender)?.toString();
          const isReadByMe = message.readBy?.some(
            (r) => (r.userId?._id || r.userId || r)?.toString() === currentUserId
          );
          return senderId && senderId !== currentUserId && (!message.isRead || !isReadByMe);
        })
        .map((message) => message._id || message.id);

      if (unreadIds.length) {
        markMessagesAsRead(unreadIds)
          .then((readData) => {
            const readAt = readData?.readAt || new Date().toISOString();
            setChannelMessagesMap((prev) => ({
              ...prev,
              [chId]: (prev[chId] || []).map((m) =>
                unreadIds.some((id) => id.toString() === (m._id || m.id)?.toString())
                  ? {
                    ...m,
                    isRead: true,
                    readBy: [
                      ...(m.readBy || []).filter((r) => (r.userId?._id || r.userId || r)?.toString() !== currentUserId),
                      { userId: currentUserId, readAt },
                    ],
                  }
                  : m
              ),
            }));
          })
          .catch((err) => console.error('Failed to mark active channel messages as read on view:', err));
      }
    }
  }, [activeTab, selectedChat, selectedChannel, messagesMap, channelMessagesMap, currentUserId]);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      markActiveScopeRead();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [markActiveScopeRead]);

  // 9. Send Direct Message (supports text, file attachments, replyTo, and polls)
  const handleSendDirectMessage = async (content, files = [], replyTo = null) => {
    if (isPlanDisabled) return;
    if (!selectedChat || isSendingMessage) return;
    const isPoll = typeof content === 'object' && content?.poll;
    const hasText = isPoll || Boolean(typeof content === 'string' ? content && content.trim() : content?.content?.trim());
    const hasFiles = files && files.length > 0;
    if (!hasText && !hasFiles) return;

    const convId = (selectedChat._id || selectedChat.id)?.toString();
    if (!convId) return;

    setIsSendingMessage(true);
    setApiError(null);

    try {
      let payload;
      if (hasFiles) {
        payload = new FormData();
        if (typeof content === 'string') {
          if (hasText) payload.append('content', content.trim());
        } else {
          if (hasText && content.content) payload.append('content', content.content.trim());
          if (content.messageType) payload.append('messageType', content.messageType);
        }
        files.forEach((file) => payload.append('files', file));
      } else if (isPoll) {
        payload = content;
      } else {
        payload = typeof content === 'string' ? content.trim() : content;
      }

      const data = await sendMessage(convId, payload, replyTo);
      if (data.success && data.message) {
        const savedMessage = data.message;
        setMessagesMap((prev) => {
          const list = prev[convId] || [];
          if (list.some((m) => (m._id || m.id)?.toString() === savedMessage._id?.toString())) return prev;
          return { ...prev, [convId]: [...list, savedMessage] };
        });

        setConversations((prev) => {
          const existing = prev.find((c) => (c._id || c.id)?.toString() === convId);
          const updatedChat = existing
            ? { ...existing, lastMessage: savedMessage, lastMessageAt: savedMessage.createdAt, unread: 0 }
            : selectedChat;
          const others = prev.filter((c) => (c._id || c.id)?.toString() !== convId);
          return deduplicateConversations([updatedChat, ...others], currentUserId);
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err.message);
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      } else if (err.response?.data?.code === 'STORAGE_LIMIT_EXCEEDED' || err.response?.data?.code === 'FILE_SIZE_LIMIT_EXCEEDED') {
        setApiError(err.response.data.message);
      } else {
        setApiError(err.response?.data?.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSendingMessage(false);
    }
  };



  // 10. Send Channel Message (supports text, file attachments, replyTo, and polls)
  const handleSendChannelMessage = async (content, files = [], replyTo = null) => {
    if (isPlanDisabled) return;
    if (!selectedChannel || isSendingMessage) return;
    const isPoll = typeof content === 'object' && content?.poll;
    const hasText = isPoll || Boolean(typeof content === 'string' ? content && content.trim() : content?.content?.trim());
    const hasFiles = files && files.length > 0;
    if (!hasText && !hasFiles) return;

    const chId = (selectedChannel._id || selectedChannel.id)?.toString();
    if (!chId) return;

    setIsSendingMessage(true);
    setApiError(null);

    try {
      let payload;
      if (hasFiles) {
        payload = new FormData();
        if (typeof content === 'string') {
          if (hasText) payload.append('content', content.trim());
        } else {
          if (hasText && content.content) payload.append('content', content.content.trim());
          if (content.messageType) payload.append('messageType', content.messageType);
        }
        files.forEach((file) => payload.append('files', file));
      } else if (isPoll) {
        payload = content;
      } else {
        payload = typeof content === 'string' ? content.trim() : content;
      }

      const data = await sendChannelMessage(chId, payload, replyTo);
      if (data.success && data.message) {
        const savedMessage = data.message;
        setChannelMessagesMap((prev) => {
          const list = prev[chId] || [];
          if (list.some((m) => (m._id || m.id)?.toString() === savedMessage._id?.toString())) return prev;
          return { ...prev, [chId]: [...list, savedMessage] };
        });

        setChannels((prev) => {
          const existing = prev.find((c) => (c._id || c.id)?.toString() === chId);
          const updatedCh = existing
            ? { ...existing, lastMessage: savedMessage, lastMessageAt: savedMessage.createdAt, unread: 0 }
            : selectedChannel;
          const others = prev.filter((c) => (c._id || c.id)?.toString() !== chId);
          return [updatedCh, ...others];
        });
      }
    } catch (err) {
      console.error('Failed to send channel message:', err.message);
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      } else if (err.response?.data?.code === 'STORAGE_LIMIT_EXCEEDED' || err.response?.data?.code === 'FILE_SIZE_LIMIT_EXCEEDED') {
        setApiError(err.response.data.message);
      } else {
        setApiError(err.response?.data?.message || 'Failed to send message to channel.');
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Level 12: Edit Message Handler
  const handleEditMessage = async (messageId, newContent) => {
    try {
      const data = await editMessage(messageId, newContent);
      if (data.success && data.message) {
        const updated = data.message;
        if (updated.conversationId) {
          const convId = (updated.conversationId._id || updated.conversationId.id || updated.conversationId)?.toString();
          setMessagesMap((prev) => {
            const list = prev[convId] || [];
            return {
              ...prev,
              [convId]: list.map((m) => ((m._id || m.id)?.toString() === messageId ? updated : m)),
            };
          });
        } else if (updated.channelId) {
          const chId = (updated.channelId._id || updated.channelId.id || updated.channelId)?.toString();
          setChannelMessagesMap((prev) => {
            const list = prev[chId] || [];
            return {
              ...prev,
              [chId]: list.map((m) => ((m._id || m.id)?.toString() === messageId ? updated : m)),
            };
          });
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to edit message:', err);
      throw err;
    }
  };

  // Level 12: Delete Message Handler
  const handleDeleteMessage = async (messageId) => {
    try {
      const data = await deleteMessage(messageId);
      if (data.success && data.message) {
        const updated = data.message;
        if (updated.conversationId) {
          const convId = (updated.conversationId._id || updated.conversationId.id || updated.conversationId)?.toString();
          setMessagesMap((prev) => {
            const list = prev[convId] || [];
            return {
              ...prev,
              [convId]: list.map((m) => ((m._id || m.id)?.toString() === messageId ? updated : m)),
            };
          });
        } else if (updated.channelId) {
          const chId = (updated.channelId._id || updated.channelId.id || updated.channelId)?.toString();
          setChannelMessagesMap((prev) => {
            const list = prev[chId] || [];
            return {
              ...prev,
              [chId]: list.map((m) => ((m._id || m.id)?.toString() === messageId ? updated : m)),
            };
          });
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  };

  const handleDeleteMessageForMe = async (messageId) => {
    try {
      const data = await deleteMessageForMe(messageId);
      if (data.success) {
        const removeFilter = (list) => (list || []).filter((m) => (m._id || m.id)?.toString() !== messageId.toString());
        setMessagesMap((prev) => {
          const next = {};
          for (const key of Object.keys(prev)) {
            next[key] = removeFilter(prev[key]);
          }
          return next;
        });
        setChannelMessagesMap((prev) => {
          const next = {};
          for (const key of Object.keys(prev)) {
            next[key] = removeFilter(prev[key]);
          }
          return next;
        });
      }
      return data;
    } catch (err) {
      console.error('Failed to delete message for me:', err);
      throw err;
    }
  };

  // Update Channel Details (Name, Description)
  const handleUpdateChannel = async (channelId, { name, description }) => {
    try {
      const data = await updateChannel(channelId, { name, description });
      if (data.success && data.channel) {
        const updated = data.channel;
        setChannels((prev) =>
          prev.map((ch) => ((ch._id || ch.id)?.toString() === channelId ? updated : ch))
        );
        if ((selectedChannel?._id || selectedChannel?.id)?.toString() === channelId) {
          setSelectedChannel(updated);
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to update channel:', err);
      throw err;
    }
  };

  // Invite / Add Members to Channel
  const handleAddChannelMembers = async (channelId, userIds) => {
    try {
      const data = await addChannelMembers(channelId, userIds);
      if (data.success && data.channel) {
        const updated = data.channel;
        setChannels((prev) =>
          prev.map((ch) => ((ch._id || ch.id)?.toString() === channelId ? updated : ch))
        );
        if ((selectedChannel?._id || selectedChannel?.id)?.toString() === channelId) {
          setSelectedChannel(updated);
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to add channel members:', err);
      throw err;
    }
  };

  // Promote Member to Channel Admin
  const handlePromoteChannelAdmin = async (channelId, userId) => {
    try {
      const data = await promoteChannelAdmin(channelId, userId);
      if (data.success && data.channel) {
        const updated = data.channel;
        setChannels((prev) =>
          prev.map((ch) => ((ch._id || ch.id)?.toString() === channelId ? updated : ch))
        );
        if ((selectedChannel?._id || selectedChannel?.id)?.toString() === channelId) {
          setSelectedChannel(updated);
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to promote channel admin:', err);
      throw err;
    }
  };

  // Level 12: Forward Message Handler
  const handleForwardMessage = async (messageId, targetData) => {
    try {
      const data = await forwardMessage(messageId, targetData);
      if (data.success && data.message) {
        const forwardedMsg = data.message;
        if (targetData.targetType === 'conversation') {
          const convId = targetData.targetId;
          setMessagesMap((prev) => {
            const list = prev[convId] || [];
            if (list.some((m) => (m._id || m.id)?.toString() === forwardedMsg._id?.toString())) return prev;
            return { ...prev, [convId]: [...list, forwardedMsg] };
          });
        } else if (targetData.targetType === 'channel') {
          const chId = targetData.targetId;
          setChannelMessagesMap((prev) => {
            const list = prev[chId] || [];
            if (list.some((m) => (m._id || m.id)?.toString() === forwardedMsg._id?.toString())) return prev;
            return { ...prev, [chId]: [...list, forwardedMsg] };
          });
        }
      }
      return data;
    } catch (err) {
      console.error('Failed to forward message:', err);
      throw err;
    }
  };

  // Level 15: Reaction Toggle Handler
  const handleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) return;

    // Determine which map this message is in
    let currentReactions = [];
    let found = false;

    // Check direct messages
    for (const convId of Object.keys(messagesMap)) {
      const msg = (messagesMap[convId] || []).find(
        (m) => (m._id || m.id)?.toString() === messageId
      );
      if (msg) {
        currentReactions = msg.reactions || [];
        found = true;
        break;
      }
    }

    // Check channel messages if not found in direct
    if (!found) {
      for (const chId of Object.keys(channelMessagesMap)) {
        const msg = (channelMessagesMap[chId] || []).find(
          (m) => (m._id || m.id)?.toString() === messageId
        );
        if (msg) {
          currentReactions = msg.reactions || [];
          break;
        }
      }
    }

    // Check if user already reacted with this emoji
    const existingReaction = currentReactions.find((r) => r.emoji === emoji);
    const hasReacted = existingReaction?.users?.some((u) => {
      const uid = (typeof u === 'object' ? (u._id || u.id) : u)?.toString();
      return uid === currentUserId;
    });

    try {
      if (hasReacted) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }
      // State update is handled by the Socket.IO event listener (handleReactionUpdated)
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const updateConversationLocalSetting = (conversationId, changes) => {
    const apply = (conversation) => {
      if (!conversation || (conversation._id || conversation.id)?.toString() !== conversationId.toString()) return conversation;
      const existing = conversation.memberSettings?.find((item) => (item.userId?._id || item.userId)?.toString() === currentUserId);
      const settings = existing
        ? conversation.memberSettings.map((item) => (item === existing ? { ...item, ...changes } : item))
        : [...(conversation.memberSettings || []), { userId: currentUserId, ...changes }];
      return { ...conversation, memberSettings: settings, unread: changes.manualUnread ? Math.max(conversation.unread || 0, 1) : changes.manualUnread === false ? 0 : conversation.unread };
    };
    setConversations((prev) => prev.map(apply));
    setSelectedChat((prev) => apply(prev));
  };

  const handleMarkConversationRead = async () => {
    if (!currentChatId) return;
    try {
      await markConversationAsRead(currentChatId);
      updateConversationLocalSetting(currentChatId, { manualUnread: false });
    } catch (error) {
      setApiError('Unable to mark conversation as read.');
    }
  };

  const handleMarkConversationUnread = async () => {
    if (!currentChatId) return;
    try {
      await updateConversationSetting(currentChatId, { manualUnread: true });
      updateConversationLocalSetting(currentChatId, { manualUnread: true });
    } catch (error) {
      setApiError('Unable to mark conversation as unread.');
    }
  };

  const handleToggleConversationMute = async () => {
    if (!currentChatId) return;
    const setting = selectedChat?.memberSettings?.find((item) => (item.userId?._id || item.userId)?.toString() === currentUserId);
    const muted = !setting?.muted;
    try {
      await updateConversationSetting(currentChatId, { muted });
      updateConversationLocalSetting(currentChatId, { muted });
    } catch (error) {
      setApiError('Unable to update conversation notifications.');
    }
  };

  const getCurrentChatMuted = () => Boolean(selectedChat?.memberSettings?.find((item) => (item.userId?._id || item.userId)?.toString() === currentUserId)?.muted);

  const updateChannelLocalSetting = (changes) => {
    const apply = (channel) => {
      if (!channel || (channel._id || channel.id)?.toString() !== currentChannelId) return channel;
      const existing = channel.memberSettings?.find((item) => (item.userId?._id || item.userId)?.toString() === currentUserId);
      const memberSettings = existing
        ? channel.memberSettings.map((item) => (item === existing ? { ...item, ...changes } : item))
        : [...(channel.memberSettings || []), { userId: currentUserId, ...changes }];
      return { ...channel, memberSettings };
    };
    setChannels((prev) => prev.map(apply));
    setSelectedChannel((prev) => apply(prev));
  };

  const handleToggleChannelMute = async () => {
    if (!currentChannelId) return;
    const setting = selectedChannel?.memberSettings?.find((item) => (item.userId?._id || item.userId)?.toString() === currentUserId);
    try {
      await updateChannelSetting(currentChannelId, { muted: !setting?.muted });
      updateChannelLocalSetting({ muted: !setting?.muted });
    } catch (error) {
      setApiError('Unable to update channel notifications.');
    }
  };

  const getCurrentChannelMuted = () => Boolean(selectedChannel?.memberSettings?.find((item) => (item.userId?._id || item.userId)?.toString() === currentUserId)?.muted);

  const handleSaveMessage = async (messageId) => {
    try {
      await saveMessage(messageId);
      setSavedMessageIds((prev) => new Set([...prev, messageId.toString()]));
      updateMessage(messageId, { saved: true });
    } catch (error) {
      setApiError('Unable to save this message.');
      throw error;
    }
  };

  const handleUnsaveMessage = async (messageId) => {
    try {
      await unsaveMessage(messageId);
      setSavedMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId.toString());
        return next;
      });
      updateMessage(messageId, { saved: false });
    } catch (error) {
      setApiError('Unable to remove saved message.');
      throw error;
    }
  };

  // 11. Create Channel Handler
  const handleCreateChannel = async ({ name, description, isPrivate, isAdminOnly }) => {
    if (isPlanDisabled) return;
    try {
      const data = await createChannel({ name, description, isPrivate, isAdminOnly });
      if (data.success && data.channel) {
        const newChan = data.channel;
        setActiveTab('channels');
        setSelectedChannel(newChan);
        joinChannelRoom(newChan._id);
      }
    } catch (err) {
      console.error('Failed to create channel:', err.message);
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      } else {
        setApiError(err.response?.data?.message || 'Failed to create channel.');
      }
    }
  };

  // 12. Join Channel Handler
  const handleJoinChannel = async (channelId) => {
    const data = await joinChannel(channelId);
    if (data.success && data.channel) {
      const updated = data.channel;
      setChannels((prev) =>
        prev.map((c) => ((c._id || c.id)?.toString() === channelId.toString() ? updated : c))
      );
      setSelectedChannel(updated);
      joinChannelRoom(channelId);

      const msgData = await getChannelMessages(channelId);
      if (msgData.success) {
        setChannelMessagesMap((prev) => ({ ...prev, [channelId]: msgData.messages || [] }));
      }
    }
  };

  // 13. Leave Channel Handler
  const handleLeaveChannel = async (channelId) => {
    const data = await leaveChannel(channelId);
    if (data.success) {
      leaveChannelRoom(channelId);
      setChannels((prev) =>
        prev.map((c) => {
          if ((c._id || c.id)?.toString() === channelId.toString()) {
            return {
              ...c,
              members: (c.members || []).filter((m) => (m._id || m.id || m)?.toString() !== currentUserId),
            };
          }
          return c;
        })
      );
      setSelectedChannel((prev) =>
        prev && (prev._id || prev.id)?.toString() === channelId.toString()
          ? {
            ...prev,
            members: (prev.members || []).filter((m) => (m._id || m.id || m)?.toString() !== currentUserId),
          }
          : prev
      );
      setChannelMessagesMap((prev) => {
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
    }
  };

  // 14. Contact -> Message shortcut
  const handleMessageContact = async (contact) => {
    const contactId = (contact._id || contact.id)?.toString();
    if (!contactId) return;

    setApiError(null);
    try {
      if (contactId === currentUserId?.toString()) {
        const selfConv = conversations.find((c) => isSelfConversation(c, currentUserId));
        if (selfConv) {
          setActiveTab('chats');
          handleSelectConversation(selfConv);
          return;
        }
      }

      const data = await createOrGetConversation(contactId);
      if (data.success && data.conversation) {
        const conv = data.conversation;
        const isSelf = contactId === currentUserId?.toString() || isSelfConversation(conv, currentUserId);
        const normalizedConv = isSelf ? { ...conv, isMe: true } : conv;

        setConversations((prev) => deduplicateConversations([normalizedConv, ...prev], currentUserId));

        setActiveTab('chats');
        handleSelectConversation(normalizedConv);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err.message);
      setApiError('Failed to start conversation with this contact');
    }
  };

  // 15. Notification Click-to-Navigate Handler
  const handleSelectNotification = async (notification) => {
    if (!notification) return;

    // Case A: Direct Message Notification
    if (notification.type === 'message' || notification.conversationId) {
      setActiveTab('chats');
      const convId = (
        notification.conversationId?._id ||
        notification.conversationId?.id ||
        notification.conversationId
      )?.toString();

      if (convId) {
        const found = conversations.find((c) => (c._id || c.id)?.toString() === convId);
        if (found) {
          handleSelectConversation(found);
        } else {
          const senderId = (
            notification.sender?._id ||
            notification.sender?.id ||
            notification.sender
          )?.toString();

          if (senderId) {
            try {
              const data = await createOrGetConversation(senderId);
              if (data.success && data.conversation) {
                const isSelf = senderId === currentUserId?.toString() || isSelfConversation(data.conversation, currentUserId);
                const normalizedConv = isSelf ? { ...data.conversation, isMe: true } : data.conversation;
                setConversations((prev) => deduplicateConversations([normalizedConv, ...prev], currentUserId));
                handleSelectConversation(normalizedConv);
              }
            } catch (err) {
              console.error('Failed to resolve conversation from notification:', err.message);
            }
          }
        }
      }
    }

    // Case B: Channel Activity or Mention Notification
    if (
      notification.type === 'mention' ||
      notification.type === 'channel_activity' ||
      notification.channelId
    ) {
      setActiveTab('channels');
      const chId = (
        notification.channelId?._id ||
        notification.channelId?.id ||
        notification.channelId
      )?.toString();

      if (chId) {
        const found = channels.find((c) => (c._id || c.id)?.toString() === chId);
        if (found) {
          handleSelectChannel(found);
        }
      }
    }

    // Case C: Todo Assigned Notification
    if (notification.type === 'todo_assigned') {
      setActiveTab('todos');
      setSelectedChat(null);
      setSelectedChannel(null);
      return;
    }

    // Case D: Invitation Received Notification
    if (notification.type === 'invitation_received') {
      setInvitationModal({
        isOpen: true,
        invitation: {
          _id: notification.metadata?.invitationId || notification.invitationId,
          organization: notification.organization,
          invitedBy: notification.sender,
        },
      });
      return;
    }

    // Case E: Invitation Accepted Notification (Admin)
    if (notification.type === 'invitation_accepted') {
      setActiveTab('admin');
      return;
    }

    // Case F: Legacy Admin Join Request Notification
    if (notification.type === 'join_request') {
      setActiveTab('admin');
      return;
    }

    // Case G: Legacy User Join Request Approved Notification
    if (notification.type === 'join_request_approved') {
      const orgName = notification.organization?.name || 'Your Workspace';
      setJoinApprovalModal({
        isOpen: true,
        companyName: orgName,
        orgId: notification.organization?._id || notification.organization,
      });
      return;
    }

    // Case H: Reminder Due Notification
    if (notification.type === 'reminder_due' || notification.reminderId) {
      setActiveTab('reminders');
      setSelectedChat(null);
      setSelectedChannel(null);
      return;
    }
  };

  // 12. Handle Selection of Global Search Result
  const handleSelectSearchResult = async (result, type) => {
    if (!result) return;
    setApiError(null);
    setSearchQuery(''); // Immediately reset search query so search bar and filters clear

    // 1. Channel match
    if (type === 'channel') {
      setActiveTab('channels');
      setSelectedChat(null);

      const chId = (result._id || result.id)?.toString();
      if (!chId) return;

      const existing = channels.find((c) => (c._id || c.id)?.toString() === chId);
      const channelToSelect = existing || result;

      await handleSelectChannel(channelToSelect);
      return;
    }

    // 2. User match
    if (type === 'user') {
      setActiveTab('chats');
      setSelectedChannel(null);

      const uId = (result._id || result.id)?.toString();
      if (!uId) return;

      const isSelf = uId === currentUserId?.toString();

      // Check if conversation already exists in loaded conversations list
      const existingConv = conversations.find((conv) => {
        if (isSelf) return isSelfConversation(conv, currentUserId);
        return conv.participants?.some(
          (p) => (p._id || p.id || p)?.toString() === uId
        );
      });

      if (existingConv) {
        await handleSelectConversation(existingConv);
        return;
      }

      // Otherwise create or retrieve idempotent conversation
      try {
        const data = await createOrGetConversation(uId);
        if (data.success && data.conversation) {
          const conv = isSelf ? { ...data.conversation, isMe: true } : data.conversation;
          setConversations((prev) => deduplicateConversations([conv, ...prev], currentUserId));
          await handleSelectConversation(conv);
        }
      } catch (err) {
        console.error('Failed to start conversation with searched user:', err.message);
        setApiError('Failed to start conversation with selected user');
      }
      return;
    }

    // 3. Message or File match
    if (type === 'message' || type === 'file') {
      const targetMessageId = (result._id || result.id)?.toString();

      // Case A: Message in Channel
      if (result.channelId) {
        setActiveTab('channels');
        setSelectedChat(null);

        const chId = (result.channelId._id || result.channelId.id || result.channelId)?.toString();
        const existing = channels.find((c) => (c._id || c.id)?.toString() === chId);
        const channelToSelect =
          existing || (typeof result.channelId === 'object' ? result.channelId : { _id: chId });

        await handleSelectChannel(channelToSelect);
        setHighlightedMessageId(targetMessageId);
        setTimeout(() => setHighlightedMessageId(null), 4000);
        return;
      }

      // Case B: Message in Direct Conversation
      if (result.conversationId) {
        setActiveTab('chats');
        setSelectedChannel(null);

        const convId = (result.conversationId._id || result.conversationId.id || result.conversationId)?.toString();
        const existing = conversations.find((c) => (c._id || c.id)?.toString() === convId);

        if (existing) {
          await handleSelectConversation(existing);
        } else {
          const otherUser =
            (result.sender?._id || result.sender?.id || result.sender)?.toString() === currentUserId
              ? result.receiver
              : result.sender;

          const otherUserId = (otherUser?._id || otherUser?.id || otherUser)?.toString();
          if (otherUserId) {
            try {
              const data = await createOrGetConversation(otherUserId);
              if (data.success && data.conversation) {
                await handleSelectConversation(data.conversation);
              }
            } catch (err) {
              console.error('Failed to resolve conversation for search result:', err.message);
            }
          }
        }

        setHighlightedMessageId(targetMessageId);
        setTimeout(() => setHighlightedMessageId(null), 4000);
        return;
      }
    }
  };

  // 13. Load Older Direct Messages (Pagination)
  const handleLoadOlderDirectMessages = async () => {
    const convId = (selectedChat?._id || selectedChat?.id)?.toString();
    if (!convId || loadingOlderMap[convId]) return;

    const currentList = messagesMap[convId] || [];
    if (currentList.length === 0) return;

    const oldest = currentList[0];
    const beforeDate = oldest.createdAt;

    setLoadingOlderMap((prev) => ({ ...prev, [convId]: true }));
    try {
      const data = await getMessages(convId, { limit: 30, before: beforeDate });
      if (data.success && Array.isArray(data.messages)) {
        setMessagesMap((prev) => ({
          ...prev,
          [convId]: [...data.messages, ...(prev[convId] || [])],
        }));
        setHasMoreMap((prev) => ({ ...prev, [convId]: Boolean(data.hasMore) }));
      }
    } catch (err) {
      console.error('Failed to load older messages:', err.message);
    } finally {
      setLoadingOlderMap((prev) => ({ ...prev, [convId]: false }));
    }
  };

  // 14. Load Older Channel Messages (Pagination)
  const handleLoadOlderChannelMessages = async () => {
    const chId = (selectedChannel?._id || selectedChannel?.id)?.toString();
    if (!chId || loadingOlderMap[chId]) return;

    const currentList = channelMessagesMap[chId] || [];
    if (currentList.length === 0) return;

    const oldest = currentList[0];
    const beforeDate = oldest.createdAt;

    setLoadingOlderMap((prev) => ({ ...prev, [chId]: true }));
    try {
      const data = await getChannelMessages(chId, { limit: 30, before: beforeDate });
      if (data.success && Array.isArray(data.messages)) {
        setChannelMessagesMap((prev) => ({
          ...prev,
          [chId]: [...data.messages, ...(prev[chId] || [])],
        }));
        setHasMoreMap((prev) => ({ ...prev, [chId]: Boolean(data.hasMore) }));
      }
    } catch (err) {
      console.error('Failed to load older channel messages:', err.message);
    } finally {
      setLoadingOlderMap((prev) => ({ ...prev, [chId]: false }));
    }
  };

  // 15. Level 13: Todo System Handlers & Navigation
  const handleOpenCreateTodo = (ctx) => {
    if (isPlanDisabled) return;
    setGlobalTodoContext(ctx || null);
    setIsGlobalTodoModalOpen(true);
  };

  const handleCloseGlobalTodoModal = () => {
    setIsGlobalTodoModalOpen(false);
    setGlobalTodoContext(null);
  };

  const handleSubmitGlobalTodo = async (payload) => {
    if (isPlanDisabled) return;
    try {
      await createTodo(payload);
    } catch (err) {
      if (err.response?.data?.code === 'ORG_EXPIRED' || err.response?.data?.companyStatus === 'expired') {
        setLiveStatus('expired');
      } else if (err.response?.data?.code === 'ORG_SUSPENDED' || err.response?.data?.companyStatus === 'suspended') {
        setLiveStatus('suspended');
      }
      throw err;
    }
  };

  const handleNavigateToConversation = useCallback(
    async (convId) => {
      if (!convId) return;
      const cId = (convId._id || convId.id || convId)?.toString();
      setActiveTab('chats');
      setSelectedChannel(null);
      const existing = conversations.find((c) => (c._id || c.id)?.toString() === cId);
      if (existing) {
        await handleSelectConversation(existing);
      }
    },
    [conversations, handleSelectConversation]
  );

  const handleNavigateToChannel = useCallback(
    async (chanId) => {
      if (!chanId) return;
      const cId = (chanId._id || chanId.id || chanId)?.toString();
      setActiveTab('channels');
      setSelectedChat(null);
      const existing = channels.find((c) => (c._id || c.id)?.toString() === cId);
      if (existing) {
        await handleSelectChannel(existing);
      }
    },
    [channels, handleSelectChannel]
  );

  const handleNavigateToMessage = useCallback(
    async ({ conversationId, channelId, messageId }) => {
      const targetMsgId = (messageId?._id || messageId?.id || messageId)?.toString();
      if (channelId) {
        await handleNavigateToChannel(channelId);
      } else if (conversationId) {
        await handleNavigateToConversation(conversationId);
      }
      if (targetMsgId) {
        setHighlightedMessageId(targetMsgId);
        setTimeout(() => setHighlightedMessageId(null), 4000);
      }
    },
    [handleNavigateToChannel, handleNavigateToConversation]
  );

  // Direct chat details
  const currentChatId = (selectedChat?._id || selectedChat?.id)?.toString();
  const activeDirectMessages = currentChatId ? (messagesMap[currentChatId] || []) : [];
  const otherParticipant = selectedChat?.participants?.find(
    (p) => (p._id || p.id)?.toString() !== currentUserId
  );
  const otherUserId = (otherParticipant?._id || otherParticipant?.id)?.toString();
  const isOtherUserOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;

  // Channel details
  const currentChannelId = (selectedChannel?._id || selectedChannel?.id)?.toString();
  const activeChannelMessages = currentChannelId ? (channelMessagesMap[currentChannelId] || []) : [];

  useEffect(() => {
    const match = window.location.pathname.match(/^\/(chat|channel)\/([^/]+)\/message\/([^/]+)$/);
    if (!match) return;
    const [, contextType, , messageId] = match;
    getMessage(messageId)
      .then(async (data) => {
        if (!data.success || !data.message) return;
        const message = data.message;
        if (contextType === 'channel' && message.channelId) {
          await handleSelectChannel(message.channelId);
          setActiveTab('channels');
        } else if (message.conversationId) {
          await handleSelectConversation(message.conversationId);
          setActiveTab('chats');
        }
        setHighlightedMessageId(messageId);
        window.history.replaceState({}, '', '/');
        window.setTimeout(() => setHighlightedMessageId(null), 4000);
      })
      .catch(() => setApiError('This message is no longer available.'));
  }, [user]);
  const formatTypingUsers = (typingMap) => {
    const names = Object.values(typingMap || {});
    if (!names.length) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others are typing...`;
  };

  // Navigation tab handler
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setApiError(null);
  };

  // If Administrator Dashboard tab is active
  if (activeTab === 'admin') {
    return <AdminDashboard onBackToWorkspace={() => setActiveTab('chats')} />;
  }

  return (
    <div className="app-workspace-layout">
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {/* 1. Primary Left Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        calendarConnected={calendarConnected}
      />

      {/* 2. Main Workspace Body */}
      <div className="workspace-main-wrapper" data-tab={activeTab}>
        <Header
          activeTab={activeTab}
          selectedTitle={
            activeTab === 'chats'
              ? null
              : activeTab === 'channels'
                ? 'Channels'
                : null
          }
          onSelectNotification={handleSelectNotification}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {/* Prominent Suspension / Expiry Banner when organization is suspended or expired */}
        <SuspensionBanner organization={{ ...(org || {}), status: effectiveStatus }} />

        {/* Global Error Notification Banner */}
        {apiError && !isPlanDisabled && (
          <div className="api-error-banner">
            <span>⚠️ {apiError}</span>
            <button
              type="button"
              className="btn-dismiss-error"
              onClick={() => setApiError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'saved' ? (
          <div className="workspace-saved-view-wrapper">
            <SavedMessagesPage
              onError={setApiError}
              onOpenMessage={async (saved) => {
                const message = saved.messageId;
                if (saved.channelId) {
                  const channel = channels.find((item) => (item._id || item.id)?.toString() === (saved.channelId._id || saved.channelId).toString());
                  if (channel) await handleSelectChannel(channel);
                  setActiveTab('channels');
                } else if (saved.conversationId) {
                  const conversation = conversations.find((item) => (item._id || item.id)?.toString() === (saved.conversationId._id || saved.conversationId).toString());
                  if (conversation) await handleSelectConversation(conversation);
                  setActiveTab('chats');
                }
                setHighlightedMessageId((message._id || message.id)?.toString());
                setTimeout(() => setHighlightedMessageId(null), 4000);
              }}
            />
          </div>
        ) : activeTab === 'todos' ? (
          <div className="workspace-todos-view-wrapper">
            <TodoPage
              availableUsers={contacts}
              onNavigateToConversation={handleNavigateToConversation}
              onNavigateToChannel={handleNavigateToChannel}
              onNavigateToMessage={handleNavigateToMessage}
              isPlanDisabled={isPlanDisabled}
              isExpired={isExpired}
              isSuspended={isSuspended}
              onAddToCalendar={handleAddToCalendar}
            />
          </div>
        ) : activeTab === 'reminders' ? (
          <div className="workspace-reminders-view-wrapper">
            <ReminderPage />
          </div>
        ) : activeTab === 'notes' ? (
          <div className="workspace-notes-view-wrapper">
            <NotesPage />
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="workspace-notes-view-wrapper">
            <GoogleCalendarPanel
              onConnectionChange={(connected) => setCalendarConnected(connected)}
              prefillEvent={calendarPrefill}
              onPrefillConsumed={() => setCalendarPrefill(null)}
            />
          </div>
        ) : (
          <div className="workspace-content-grid">
            {/* Middle Sub-Panel */}
            <div
              className={`workspace-subpanel ${selectedChat || selectedChannel ? 'hide-on-mobile-when-chat-open' : ''
                }`}
            >
              {activeTab === 'chats' && (
                <ChatList
                  chats={conversations}
                  joinedChannels={channels.filter((ch) =>
                    ch.members?.some(
                      (m) => (m._id || m.id || m)?.toString() === currentUserId?.toString()
                    )
                  )}
                  contacts={contacts}
                  onSelectContact={handleMessageContact}
                  currentUserId={currentUserId}
                  onlineUserIds={onlineUserIds}
                  selectedChat={selectedChat}
                  selectedChannel={selectedChannel}
                  onSelectChat={handleSelectConversation}
                  onSelectChannel={handleSelectChannel}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  loading={loadingConversations || loadingChannels}
                  pinnedChatIds={pinnedChats}
                  pinnedChannelIds={pinnedChannels}
                  onPinItem={handlePinItem}
                  onUnpinItem={handleUnpinItem}
                  onSelectNotification={handleSelectNotification}
                />
              )}

              {activeTab === 'channels' && (
                <ChannelList
                  channels={channels}
                  currentUserId={currentUserId}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                  onJoinChannel={handleJoinChannel}
                  onOpenCreateModal={() => !isPlanDisabled && setIsCreateChannelOpen(true)}
                  searchQuery={searchQuery}
                  loading={loadingChannels}
                  isPlanDisabled={isPlanDisabled}
                  isExpired={isExpired}
                  isSuspended={isSuspended}
                  pinnedChannelIds={pinnedChannels}
                  pinnedChatIds={pinnedChats}
                  onPinItem={handlePinItem}
                  onUnpinItem={handleUnpinItem}
                />
              )}

              {activeTab === 'contacts' && (
                <ContactList
                  contacts={contacts}
                  onlineUserIds={onlineUserIds}
                  onMessageContact={handleMessageContact}
                  searchQuery={searchQuery}
                  loading={loadingContacts}
                />
              )}

              {/* Mobile FAB for Chats/Channels */}
              {(activeTab === 'chats' || activeTab === 'channels') && (
                <button
                  className="mobile-fab"
                  onClick={() => {
                    if (activeTab === 'channels') {
                      if (!isPlanDisabled) setIsCreateChannelOpen(true);
                    } else {
                      setActiveTab('contacts');
                    }
                  }}
                  aria-label={activeTab === 'channels' ? 'Create Channel' : 'New Chat'}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Right Stage (Direct Chat / Channel Chat / Directory) */}
            <main className={`workspace-stage ${!selectedChat && !selectedChannel ? 'hide-on-mobile-when-no-chat' : ''}`}>
              {activeTab === 'chats' && (
                selectedChat ? (
                  <ChatWindow
                    chat={selectedChat}
                    messages={activeDirectMessages}
                    currentUserId={currentUserId}
                    conversations={conversations}
                    channels={channels}
                    onSendMessage={handleSendDirectMessage}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onDeleteMessageForMe={handleDeleteMessageForMe}
                    onForwardMessage={handleForwardMessage}
                    onTyping={() => currentChatId && emitTyping(currentChatId)}
                    onStopTyping={() => currentChatId && emitStopTyping(currentChatId)}
                    typingUser={formatTypingUsers(typingUsersMap[currentChatId])}
                    isOtherUserOnline={isOtherUserOnline}
                    otherUserLastSeen={lastSeenByUserId[otherUserId] || otherParticipant?.lastSeenAt}
                    onBack={() => setSelectedChat(null)}
                    loading={loadingMessages}
                    isSending={isSendingMessage}
                    highlightedMessageId={highlightedMessageId}
                    hasMore={Boolean(hasMoreMap[currentChatId])}
                    loadingOlder={Boolean(loadingOlderMap[currentChatId])}
                    onLoadOlder={handleLoadOlderDirectMessages}
                    onCreateTodo={isPlanDisabled ? null : handleOpenCreateTodo}
                    isPlanDisabled={isPlanDisabled}
                    isExpired={isExpired}
                    isSuspended={isSuspended}
                    onReaction={handleReaction}
                    savedMessageIds={savedMessageIds}
                    onSave={handleSaveMessage}
                    onUnsave={handleUnsaveMessage}
                    onPin={handlePinMessage}
                    onUnpin={handleUnpinMessage}
                    pinnedMessages={currentChatId ? (pinnedMessagesMap[currentChatId] || []) : []}
                    muted={getCurrentChatMuted()}
                    onMarkRead={handleMarkConversationRead}
                    onMarkUnread={handleMarkConversationUnread}
                    onToggleMute={handleToggleConversationMute}
                    onPollVoted={(msgId, updatedPoll) => updateMessage(msgId, { poll: updatedPoll })}
                  />
                ) : selectedChannel ? (
                  <ChannelWindow
                    channel={selectedChannel}
                    messages={activeChannelMessages}
                    currentUserId={currentUserId}
                    onlineUserIds={onlineUserIds}
                    conversations={conversations}
                    channels={channels}
                    onSendMessage={handleSendChannelMessage}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onDeleteMessageForMe={handleDeleteMessageForMe}
                    onForwardMessage={handleForwardMessage}
                    onJoinChannel={handleJoinChannel}
                    onLeaveChannel={handleLeaveChannel}
                    onUpdateChannel={handleUpdateChannel}
                    onAddMembers={handleAddChannelMembers}
                    onPromoteAdmin={handlePromoteChannelAdmin}
                    availableUsers={contacts}
                    userRole={user?.role}
                    onTyping={() => currentChannelId && emitChannelTyping(currentChannelId)}
                    onStopTyping={() => currentChannelId && emitChannelStopTyping(currentChannelId)}
                    typingUser={formatTypingUsers(channelTypingMap[currentChannelId])}
                    onBack={() => setSelectedChannel(null)}
                    loading={loadingChannelMessages}
                    isSending={isSendingMessage}
                    highlightedMessageId={highlightedMessageId}
                    hasMore={Boolean(hasMoreMap[currentChannelId])}
                    loadingOlder={Boolean(loadingOlderMap[currentChannelId])}
                    onLoadOlder={handleLoadOlderChannelMessages}
                    onCreateTodo={isPlanDisabled ? null : handleOpenCreateTodo}
                    isPlanDisabled={isPlanDisabled}
                    isExpired={isExpired}
                    isSuspended={isSuspended}
                    onReaction={handleReaction}
                    savedMessageIds={savedMessageIds}
                    onSave={handleSaveMessage}
                    onUnsave={handleUnsaveMessage}
                    onPin={handlePinMessage}
                    onUnpin={handleUnpinMessage}
                    pinnedMessages={currentChannelId ? (pinnedMessagesMap[currentChannelId] || []) : []}
                    muted={getCurrentChannelMuted()}
                    onToggleMute={handleToggleChannelMute}
                    onPollVoted={(msgId, updatedPoll) => updateMessage(msgId, { poll: updatedPoll })}
                  />
                ) : (
                  <EmptyState onSelectTab={handleSelectTab} />
                )
              )}

              {activeTab === 'channels' && (
                selectedChannel ? (
                  <ChannelWindow
                    channel={selectedChannel}
                    messages={activeChannelMessages}
                    currentUserId={currentUserId}
                    onlineUserIds={onlineUserIds}
                    conversations={conversations}
                    channels={channels}
                    onSendMessage={handleSendChannelMessage}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onForwardMessage={handleForwardMessage}
                    onJoinChannel={handleJoinChannel}
                    onLeaveChannel={handleLeaveChannel}
                    onUpdateChannel={handleUpdateChannel}
                    onAddMembers={handleAddChannelMembers}
                    onPromoteAdmin={handlePromoteChannelAdmin}
                    availableUsers={contacts}
                    userRole={user?.role}
                    onTyping={() => currentChannelId && emitChannelTyping(currentChannelId)}
                    onStopTyping={() => currentChannelId && emitChannelStopTyping(currentChannelId)}
                    typingUser={formatTypingUsers(channelTypingMap[currentChannelId])}
                    onBack={() => setSelectedChannel(null)}
                    loading={loadingChannelMessages}
                    isSending={isSendingMessage}
                    highlightedMessageId={highlightedMessageId}
                    hasMore={Boolean(hasMoreMap[currentChannelId])}
                    loadingOlder={Boolean(loadingOlderMap[currentChannelId])}
                    onLoadOlder={handleLoadOlderChannelMessages}
                    onCreateTodo={isPlanDisabled ? null : handleOpenCreateTodo}
                    isPlanDisabled={isPlanDisabled}
                    isExpired={isExpired}
                    isSuspended={isSuspended}
                    onReaction={handleReaction}
                    savedMessageIds={savedMessageIds}
                    onSave={handleSaveMessage}
                    onUnsave={handleUnsaveMessage}
                    onPin={handlePinMessage}
                    onUnpin={handleUnpinMessage}
                    pinnedMessages={currentChannelId ? (pinnedMessagesMap[currentChannelId] || []) : []}
                    muted={getCurrentChannelMuted()}
                    onToggleMute={handleToggleChannelMute}
                    onPollVoted={(msgId, updatedPoll) => updateMessage(msgId, { poll: updatedPoll })}
                  />
                ) : (
                  <EmptyState onSelectTab={handleSelectTab} />
                )
              )}

              {activeTab === 'contacts' && (
                <div className="contacts-overview-stage">
                  <div className="contacts-overview-card">
                    <h3>Team Members</h3>
                    <p>Browse your registered colleagues and launch one-to-one direct conversations or channel discussions.</p>
                    <div className="contacts-quick-summary">
                      <div className="summary-stat">
                        <span className="stat-num">{contacts.length}</span>
                        <span className="stat-label">Teammates</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-num">{onlineUserIds.size}</span>
                        <span className="stat-label">Online Now</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={isCreateChannelOpen && !isPlanDisabled}
        onClose={() => setIsCreateChannelOpen(false)}
        onCreateChannel={handleCreateChannel}
      />

      {/* Global / Context-Triggered To-Do Creation Modal */}
      <TodoModal
        isOpen={isGlobalTodoModalOpen && !isPlanDisabled}
        onClose={handleCloseGlobalTodoModal}
        onSubmit={handleSubmitGlobalTodo}
        contextData={globalTodoContext}
        availableUsers={contacts}
        currentUserId={currentUserId}
      />

      {/* Join Request Approval Modal */}
      <JoinRequestAcceptModal
        isOpen={joinApprovalModal.isOpen}
        companyName={joinApprovalModal.companyName}
        onClose={() => setJoinApprovalModal({ isOpen: false, companyName: '', orgId: null })}
        onEnterWorkspace={async () => {
          if (joinApprovalModal.orgId) {
            try {
              const { switchOrganization } = await import('../../services/organizationService');
              await switchOrganization(joinApprovalModal.orgId);
            } catch (e) {
              console.error(e);
            }
          }
          window.location.reload();
        }}
      />

      {/* Organization Invitation Modal */}
      <InvitationAcceptModal
        isOpen={invitationModal.isOpen}
        invitation={invitationModal.invitation}
        onClose={() => setInvitationModal({ isOpen: false, invitation: null })}
        onAccepted={async (org) => {
          setInvitationModal({ isOpen: false, invitation: null });
          if (org?._id) {
            try {
              const { switchOrganization } = await import('../../services/organizationService');
              await switchOrganization(org._id);
            } catch (e) {
              console.error(e);
            }
          }
          window.location.reload();
        }}
      />

      {/* Edit Profile Modal (Rendered at top-level workspace scope) */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Company / Multi-Organization Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Mobile Fixed Bottom Navigation Bar (Visible only on mobile/tablet screens) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isAdmin={['owner', 'admin'].includes(user?.role)}
      />
      
      {/* Due Reminder Notification Modal */}
      {dueReminder && (
        <DueReminderModal
          reminder={dueReminder}
          onClose={() => setDueReminder(null)}
          onSnoozeSuccess={() => setDueReminder(null)}
          onCompleteSuccess={() => setDueReminder(null)}
        />
      )}

      {/* WebRTC Calling Overlay */}
      <CallOverlay />
    </div>
  );
}

export default AppLayout;
