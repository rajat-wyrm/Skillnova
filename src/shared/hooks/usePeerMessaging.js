// ════════════════════════════════════════════════════════════
//  usePeerMessaging — Real-time P2P chat, study groups & matcher
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../lib/auth';
import api, { getErrorMessage } from '../../lib/api';
import { connectSocket, getSocket } from '../../lib/socket';
import notify from '../../lib/toast';

export function usePeerMessaging() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Conversations & Direct Messages State
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadDMsTotal, setUnreadDMsTotal] = useState(0);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Study Groups State
  const [studyGroups, setStudyGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

  // Ref to track currently active partner and group in event handlers
  const activePartnerRef = useRef(activePartner);
  activePartnerRef.current = activePartner;

  const activeGroupRef = useRef(activeGroup);
  activeGroupRef.current = activeGroup;

  // ─────────────────────────────────────────────────────────
  // 1. DIRECT MESSAGING ACTIONS
  // ─────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConv(true);
      const { data } = await api.get('/peer/conversations');
      const convs = data.conversations || [];
      setConversations(convs);

      const totalUnread = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadDMsTotal(totalUnread);
    } catch (err) {
      console.error('[P2P] Failed to fetch conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  }, []);

  const openConversation = useCallback(async (partner) => {
    if (!partner?.id) return;
    setActivePartner(partner);
    setLoadingMessages(true);

    try {
      const { data } = await api.get(`/peer/messages/${partner.id}`);
      setMessages(data.messages || []);

      // Decrement unread count locally for this conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === partner.id ? { ...c, unreadCount: 0 } : c
        )
      );
      setUnreadDMsTotal((prev) => {
        const conv = conversations.find((c) => c.partner.id === partner.id);
        const count = conv?.unreadCount || 0;
        return Math.max(0, prev - count);
      });
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoadingMessages(false);
    }
  }, [conversations]);

  const sendDirectMessage = useCallback(async (content, attachments = null) => {
    const partner = activePartnerRef.current;
    if (!partner?.id || !content?.trim()) return null;

    try {
      const { data } = await api.post('/peer/messages', {
        recipientId: partner.id,
        content: content.trim(),
        attachments,
      });

      const newMsg = data.message;

      // Update active thread
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Update conversations list
      setConversations((prev) => {
        const exists = prev.some((c) => c.partner.id === partner.id);
        if (exists) {
          return prev.map((c) =>
            c.partner.id === partner.id
              ? { ...c, lastMessage: newMsg }
              : c
          );
        }
        return [
          {
            partner,
            lastMessage: newMsg,
            unreadCount: 0,
          },
          ...prev,
        ];
      });

      return newMsg;
    } catch (err) {
      notify.error(getErrorMessage(err));
      return null;
    }
  }, []);

  const sendTypingIndicator = useCallback((recipientId, isTyping) => {
    const socket = getSocket();
    if (socket?.connected && recipientId) {
      socket.emit('dm:typing', { recipientId, isTyping });
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // 2. STUDY GROUPS ACTIONS
  // ─────────────────────────────────────────────────────────

  const fetchStudyGroups = useCallback(async (params = {}) => {
    try {
      setLoadingGroups(true);
      const { data } = await api.get('/peer/study-groups', { params });
      setStudyGroups(data.groups || []);
    } catch (err) {
      console.error('[P2P] Failed to fetch study groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const openStudyGroup = useCallback(async (groupId) => {
    if (!groupId) return;
    setLoadingGroupDetails(true);

    const socket = getSocket();

    // Leave previous group socket room if any
    if (activeGroupRef.current?.id && activeGroupRef.current.id !== groupId) {
      socket?.emit('group:leave_room', activeGroupRef.current.id);
    }

    try {
      const { data } = await api.get(`/peer/study-groups/${groupId}`);
      const groupData = data.group;
      setActiveGroup(groupData);
      setGroupMessages(groupData.messages || []);

      // Join socket room for this study group
      if (socket?.connected) {
        socket.emit('group:join_room', groupId);
      }
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoadingGroupDetails(false);
    }
  }, []);

  const closeStudyGroup = useCallback(() => {
    const socket = getSocket();
    if (activeGroupRef.current?.id && socket?.connected) {
      socket.emit('group:leave_room', activeGroupRef.current.id);
    }
    setActiveGroup(null);
    setGroupMessages([]);
  }, []);

  const createStudyGroup = useCallback(async (formData) => {
    try {
      const { data } = await api.post('/peer/study-groups', formData);
      notify.success(`Study group "${data.group.name}" created!`);
      await fetchStudyGroups();
      return data.group;
    } catch (err) {
      notify.error(getErrorMessage(err));
      return null;
    }
  }, [fetchStudyGroups]);

  const joinStudyGroup = useCallback(async (groupId) => {
    try {
      await api.post(`/peer/study-groups/${groupId}/join`);
      notify.success('Joined study group!');
      await fetchStudyGroups();
      if (activeGroupRef.current?.id === groupId) {
        await openStudyGroup(groupId);
      }
      return true;
    } catch (err) {
      notify.error(getErrorMessage(err));
      return false;
    }
  }, [fetchStudyGroups, openStudyGroup]);

  const leaveStudyGroup = useCallback(async (groupId) => {
    try {
      await api.post(`/peer/study-groups/${groupId}/leave`);
      notify.success('Left study group.');
      await fetchStudyGroups();
      if (activeGroupRef.current?.id === groupId) {
        closeStudyGroup();
      }
      return true;
    } catch (err) {
      notify.error(getErrorMessage(err));
      return false;
    }
  }, [fetchStudyGroups, closeStudyGroup]);

  const sendStudyGroupMessage = useCallback(async (content, attachments = null) => {
    const group = activeGroupRef.current;
    if (!group?.id || !content?.trim()) return null;

    try {
      const { data } = await api.post(`/peer/study-groups/${group.id}/messages`, {
        content: content.trim(),
        attachments,
      });
      return data.message;
    } catch (err) {
      notify.error(getErrorMessage(err));
      return null;
    }
  }, []);

  const sendGroupTypingIndicator = useCallback((groupId, isTyping) => {
    const socket = getSocket();
    if (socket?.connected && groupId) {
      socket.emit('group:typing', { groupId, isTyping });
    }
  }, []);

  const inviteToGroup = useCallback(async (groupId, targetUserId, note = '') => {
    try {
      await api.post(`/peer/study-groups/${groupId}/invite`, {
        userId: targetUserId,
        note,
      });
      notify.success('Invitation sent!');
      return true;
    } catch (err) {
      notify.error(getErrorMessage(err));
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // 3. REALTIME SOCKET SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;

    fetchConversations();
    fetchStudyGroups();

    const socket = connectSocket(accessToken);
    if (!socket) return;

    // Incoming Direct Message
    const onDirectMessage = (msg) => {
      const currentActive = activePartnerRef.current;
      const isFromCurrentChat =
        (msg.senderId === currentActive?.id && msg.recipientId === user.id) ||
        (msg.senderId === user.id && msg.recipientId === currentActive?.id);

      if (isFromCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Mark as read immediately if chat is open
        if (msg.senderId === currentActive?.id) {
          api.post(`/peer/messages/${msg.senderId}/read`).catch(() => {});
        }
      }

      // Update conversations list
      setConversations((prev) => {
        const partnerId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
        const exists = prev.some((c) => c.partner.id === partnerId);

        if (exists) {
          return prev.map((c) => {
            if (c.partner.id === partnerId) {
              const isUnread = msg.recipientId === user.id && currentActive?.id !== partnerId;
              return {
                ...c,
                lastMessage: msg,
                unreadCount: isUnread ? (c.unreadCount || 0) + 1 : c.unreadCount,
              };
            }
            return c;
          });
        } else {
          // If conversation didn't exist yet, re-fetch conversations
          fetchConversations();
          return prev;
        }
      });

      if (msg.recipientId === user.id && currentActive?.id !== msg.senderId) {
        setUnreadDMsTotal((prev) => prev + 1);
      }
    };

    // Typing in DM
    const onDMTyping = ({ senderId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: isTyping,
      }));
    };

    // Read Receipt in DM
    const onDMRead = ({ readerId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.recipientId === readerId ? { ...m, read: true, readAt: new Date() } : m
        )
      );
    };

    // Group Message Received
    const onGroupReceive = ({ groupId, message }) => {
      if (activeGroupRef.current?.id === groupId) {
        setGroupMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    // Group Typing
    const onGroupTyping = ({ groupId, userId, isTyping }) => {
      if (activeGroupRef.current?.id === groupId) {
        setGroupTypingUsers((prev) => ({
          ...prev,
          [userId]: isTyping,
        }));
      }
    };

    // Group Member Joined / Left
    const onGroupMemberJoined = ({ groupId, member }) => {
      if (activeGroupRef.current?.id === groupId) {
        setActiveGroup((prev) => {
          if (!prev) return prev;
          const members = prev.members || [];
          if (members.some((m) => m.userId === member.userId)) return prev;
          return { ...prev, members: [...members, member], memberCount: members.length + 1 };
        });
      }
      setStudyGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, memberCount: (g.memberCount || 0) + 1 } : g))
      );
    };

    const onGroupMemberLeft = ({ groupId, userId: leftUserId }) => {
      if (activeGroupRef.current?.id === groupId) {
        setActiveGroup((prev) => {
          if (!prev) return prev;
          const members = (prev.members || []).filter((m) => m.userId !== leftUserId);
          return { ...prev, members, memberCount: Math.max(0, (prev.memberCount || 1) - 1) };
        });
      }
      setStudyGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, memberCount: Math.max(0, (g.memberCount || 1) - 1) } : g))
      );
    };

    socket.on('dm:receive', onDirectMessage);
    socket.on('dm:typing', onDMTyping);
    socket.on('dm:read', onDMRead);
    socket.on('group:receive', onGroupReceive);
    socket.on('group:typing', onGroupTyping);
    socket.on('group:member_joined', onGroupMemberJoined);
    socket.on('group:member_left', onGroupMemberLeft);

    return () => {
      socket.off('dm:receive', onDirectMessage);
      socket.off('dm:typing', onDMTyping);
      socket.off('dm:read', onDMRead);
      socket.off('group:receive', onGroupReceive);
      socket.off('group:typing', onGroupTyping);
      socket.off('group:member_joined', onGroupMemberJoined);
      socket.off('group:member_left', onGroupMemberLeft);
    };
  }, [user?.id, accessToken, fetchConversations, fetchStudyGroups]);

  return {
    // DM state & actions
    conversations,
    activePartner,
    messages,
    typingUsers,
    unreadDMsTotal,
    loadingConv,
    loadingMessages,
    fetchConversations,
    openConversation,
    setActivePartner,
    sendDirectMessage,
    sendTypingIndicator,

    // Study Groups state & actions
    studyGroups,
    activeGroup,
    groupMessages,
    groupTypingUsers,
    loadingGroups,
    loadingGroupDetails,
    fetchStudyGroups,
    openStudyGroup,
    closeStudyGroup,
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    sendStudyGroupMessage,
    sendGroupTypingIndicator,
    inviteToGroup,
  };
}

export default usePeerMessaging;
