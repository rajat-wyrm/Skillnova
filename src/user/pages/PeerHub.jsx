// ════════════════════════════════════════════════════════════
//  USER — pages/PeerHub.jsx
//  Peer-to-Peer Hub: Direct Messages, Study Groups & Skill Matcher
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  Target,
  Search,
  Send,
  Plus,
  UserPlus,
  Sparkles,
  Award,
  BookOpen,
  Video,
  Check,
  CheckCheck,
  ExternalLink,
  ChevronRight,
  UserCheck,
  LogOut,
  FolderPlus,
  X,
  Filter,
  Flame,
  ArrowRight,
  Code2,
  GraduationCap,
  Building,
  Mail,
  MoreVertical,
  Smile,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import { Avatar, Badge, Card, Modal } from '../../shared/components/UI';
import { usePeerMessaging } from '../../shared/hooks/usePeerMessaging';
import UserProfileModal from '../../shared/components/UserProfileModal';

const POPULAR_SKILLS = [
  'React',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'SQL',
  'Docker',
  'UI/UX',
  'Machine Learning',
  'Tailwind CSS',
  'AWS',
  'Next.js',
];

const PeerHub = ({ initialTab = 'dm', initialPeerId = null, onNavigate }) => {
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState(initialTab); // 'dm' | 'groups' | 'matcher'

  // Hook for real-time messaging & study groups
  const {
    conversations,
    activePartner,
    messages,
    typingUsers,
    unreadDMsTotal,
    loadingConv,
    loadingMessages,
    openConversation,
    setActivePartner,
    sendDirectMessage,
    sendTypingIndicator,
    studyGroups,
    activeGroup,
    groupMessages,
    groupTypingUsers,
    loadingGroups,
    openStudyGroup,
    closeStudyGroup,
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    sendStudyGroupMessage,
    sendGroupTypingIndicator,
    inviteToGroup,
  } = usePeerMessaging();

  // Local State
  const [dmSearch, setDmSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [groupMessageInput, setGroupMessageInput] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'mine'
  const [selectedGroupSkill, setSelectedGroupSkill] = useState('');

  // Modals state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    topic: '',
    description: '',
    skills: '',
    maxMembers: 10,
    meetingLink: '',
  });
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTargetUser, setInviteTargetUser] = useState(null);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState('');
  const [selectedPeerIdForInvite, setSelectedPeerIdForInvite] = useState('');
  const [allPeers, setAllPeers] = useState([]);
  const [inviteNote, setInviteNote] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // Load all peers for quick inviting
  useEffect(() => {
    api
      .get('/peer/match', { params: { role: 'ALL' } })
      .then(({ data }) => {
        const peers = (data.candidates || []).map((c) => c.user);
        setAllPeers(peers);
        if (peers.length > 0) {
          setSelectedPeerIdForInvite(peers[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Skill Matcher State
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [matcherSearch, setMatcherSearch] = useState('');
  const [matcherDepartment, setMatcherDepartment] = useState('');
  const [matcherCandidates, setMatcherCandidates] = useState([]);
  const [loadingMatcher, setLoadingMatcher] = useState(false);

  const messagesEndRef = useRef(null);
  const groupMessagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const groupTypingTimeoutRef = useRef(null);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    groupMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, groupTypingUsers]);

  // Initial peer opening if provided
  useEffect(() => {
    if (initialPeerId) {
      api
        .get(`/peer/users/${initialPeerId}`)
        .then(({ data }) => {
          if (data.peer) {
            openConversation(data.peer);
            setActiveTab('dm');
          }
        })
        .catch(() => {});
    }
  }, [initialPeerId, openConversation]);

  // ── Matcher Query ──────────────────────────────────────────
  const fetchTeammates = async () => {
    setLoadingMatcher(true);
    try {
      const skillsQuery = selectedSkills.join(',');
      const { data } = await api.get('/peer/match', {
        params: {
          skills: skillsQuery || undefined,
          search: matcherSearch || undefined,
          department: matcherDepartment || undefined,
        },
      });
      setMatcherCandidates(data.candidates || []);
    } catch (err) {
      console.error('[Matcher] Failed to fetch teammates:', err);
    } finally {
      setLoadingMatcher(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matcher') {
      fetchTeammates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedSkills, matcherSearch, matcherDepartment]);

  const toggleSkillFilter = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // ── DM Handlers ────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activePartner) return;
    const content = messageInput;
    setMessageInput('');
    sendTypingIndicator(activePartner.id, false);
    await sendDirectMessage(content);
  };

  const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);
    if (!activePartner) return;

    sendTypingIndicator(activePartner.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(activePartner.id, false);
    }, 2000);
  };

  // ── Group Chat Handlers ────────────────────────────────────
  const handleSendGroupMessage = async (e) => {
    e?.preventDefault();
    if (!groupMessageInput.trim() || !activeGroup) return;
    const content = groupMessageInput;
    setGroupMessageInput('');
    sendGroupTypingIndicator(activeGroup.id, false);
    await sendStudyGroupMessage(content);
  };

  const handleGroupInputChange = (e) => {
    setGroupMessageInput(e.target.value);
    if (!activeGroup) return;

    sendGroupTypingIndicator(activeGroup.id, true);
    if (groupTypingTimeoutRef.current) clearTimeout(groupTypingTimeoutRef.current);
    groupTypingTimeoutRef.current = setTimeout(() => {
      sendGroupTypingIndicator(activeGroup.id, false);
    }, 2000);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupData.name.trim()) {
      notify.error('Please enter a group name');
      return;
    }
    setCreatingGroup(true);
    const created = await createStudyGroup(newGroupData);
    setCreatingGroup(false);
    if (created) {
      setShowCreateGroupModal(false);
      setNewGroupData({
        name: '',
        topic: '',
        description: '',
        skills: '',
        maxMembers: 10,
        meetingLink: '',
      });
      openStudyGroup(created.id);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupForInvite) {
      notify.error('Please select a study group');
      return;
    }
    const targetId = inviteTargetUser?.id || selectedPeerIdForInvite;
    if (!targetId) {
      notify.error('Please select an intern to invite');
      return;
    }
    setSendingInvite(true);
    const ok = await inviteToGroup(selectedGroupForInvite, targetId, inviteNote);
    setSendingInvite(false);
    if (ok) {
      setShowInviteModal(false);
      setInviteTargetUser(null);
      setInviteNote('');
    }
  };

  const startDMWithUser = (user) => {
    openConversation(user);
    setActiveTab('dm');
  };

  const openInviteModalForUser = (user) => {
    setInviteTargetUser(user);
    const myGroups = studyGroups.filter((g) => g.isCreator || g.isMember);
    if (myGroups.length > 0) {
      setSelectedGroupForInvite(myGroups[0].id);
    }
    setShowInviteModal(true);
  };

  // Filtered lists
  const filteredConversations = useMemo(() => {
    if (!dmSearch.trim()) return conversations;
    const q = dmSearch.toLowerCase();
    return conversations.filter(
      (c) =>
        c.partner?.name?.toLowerCase().includes(q) ||
        c.partner?.department?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
    );
  }, [conversations, dmSearch]);

  const filteredGroups = useMemo(() => {
    return studyGroups.filter((g) => {
      if (groupFilter === 'mine' && !g.isMember) return false;
      if (groupSearch.trim()) {
        const q = groupSearch.toLowerCase();
        const matchesName = g.name?.toLowerCase().includes(q);
        const matchesTopic = g.topic?.toLowerCase().includes(q);
        const matchesDesc = g.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesTopic && !matchesDesc) return false;
      }
      if (selectedGroupSkill) {
        const target = selectedGroupSkill.toLowerCase();
        const hasSkill = Array.isArray(g.skills)
          ? g.skills.some((s) => s.toLowerCase().includes(target))
          : typeof g.skills === 'string' && g.skills.toLowerCase().includes(target);
        if (!hasSkill) return false;
      }
      return true;
    });
  }, [studyGroups, groupFilter, groupSearch, selectedGroupSkill]);

  const isPartnerTyping = activePartner ? !!typingUsers[activePartner.id] : false;

  return (
    <div className="space-y-6">
      {/* ── Page Header & Tab Bar ──────────────────────────────── */}
      <div
        className="p-6 rounded-2xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 109, 52, 0.08), rgba(0, 190, 163, 0.08))',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 border border-orange-500/20">
                P2P Network
              </span>
              <span className="text-xs text-muted-foreground">• Real-time Collaboration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-1 tracking-tight">
              Peer Collaboration Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Connect with fellow interns, send direct messages, form study groups, and find ideal
              teammates matching specific skills and projects.
            </p>
          </div>

          {/* Quick Actions / Stats */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('matcher');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              style={{
                background: activeTab === 'matcher' ? '#ff6d34' : 'var(--card)',
                color: activeTab === 'matcher' ? '#ffffff' : 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <Sparkles size={16} />
              Find Teammates
            </button>
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm transition"
              style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}
            >
              <Plus size={16} />
              Create Study Group
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'dm' ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-muted text-muted-foreground'
            }`}
            style={{
              background: activeTab === 'dm' ? '#ff6d34' : 'transparent',
              color: activeTab === 'dm' ? '#ffffff' : 'var(--text)',
            }}
          >
            <MessageSquare size={16} />
            Direct Messages
            {unreadDMsTotal > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-white text-orange-600">
                {unreadDMsTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'groups' ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-muted text-muted-foreground'
            }`}
            style={{
              background: activeTab === 'groups' ? '#ff6d34' : 'transparent',
              color: activeTab === 'groups' ? '#ffffff' : 'var(--text)',
            }}
          >
            <Users size={16} />
            Study Groups
            <span className="px-2 py-0.5 text-xs rounded-full bg-black/20 text-muted-foreground">
              {studyGroups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matcher')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'matcher' ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-muted text-muted-foreground'
            }`}
            style={{
              background: activeTab === 'matcher' ? '#ff6d34' : 'transparent',
              color: activeTab === 'matcher' ? '#ffffff' : 'var(--text)',
            }}
          >
            <Target size={16} />
            Skill Matcher
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 1: DIRECT MESSAGES (DMs)                             */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'dm' && (
        <div
          className="rounded-2xl border overflow-hidden grid grid-cols-1 md:grid-cols-12"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            height: '680px',
          }}
        >
          {/* Left Column: Conversations List */}
          <div
            className="md:col-span-4 border-r flex flex-col h-full"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            {/* Search header */}
            <div className="p-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                />
                <input
                  type="text"
                  placeholder="Search chats or peers…"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            </div>

            {/* Threads list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {loadingConv ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Loading conversations…
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-sm font-semibold">No conversations yet</p>
                  <p className="text-xs text-muted-foreground">
                    Find teammates in the Skill Matcher or Study Groups to start chatting!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('matcher')}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium text-white"
                    style={{ background: '#ff6d34' }}
                  >
                    Find Teammates
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const partner = conv.partner;
                  const isSelected = activePartner?.id === partner.id;
                  const initials = partner.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() => openConversation(partner)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition ${
                        isSelected ? 'bg-orange-500/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="relative">
                        <Avatar initials={initials || 'U'} size="md" />
                        <span
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card"
                          style={{
                            background:
                              partner.status === 'ACTIVE' ? '#10b981' : '#9ca3af',
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                            {partner.name}
                          </p>
                          {conv.lastMessage?.createdAt && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage?.senderId === currentUser.id ? 'You: ' : ''}
                            {conv.lastMessage?.content || 'No messages yet'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-orange-500 text-white flex-shrink-0 ml-2">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="md:col-span-8 flex flex-col h-full bg-card">
            {activePartner ? (
              <>
                {/* Chat Top Bar */}
                <div
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={activePartner.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {activePartner.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {activePartner.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activePartner.department || 'Department not specified'}
                        {activePartner.college ? ` • ${activePartner.college}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProfileId(activePartner.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => openInviteModalForUser(activePartner)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-600 border border-teal-500/20 hover:bg-teal-500/20 transition"
                    >
                      + Invite to Group
                    </button>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
                  {loadingMessages ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-sm font-medium">Say hello to {activePartner.name}! 👋</p>
                      <p className="text-xs text-muted-foreground">
                        Share ideas, ask questions, or team up on tasks.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <Avatar
                              initials={activePartner.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                              size="sm"
                            />
                          )}

                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-none'
                                : 'bg-card border border-border text-card-foreground rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] ${
                                isMe ? 'text-white/80 justify-end' : 'text-muted-foreground justify-start'
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && (
                                <span>
                                  {msg.read ? (
                                    <CheckCheck size={12} className="text-teal-200" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {isPartnerTyping && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"
                          style={{ animationDelay: '0.4s' }}
                        />
                      </div>
                      <span>{activePartner.name} is typing…</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t flex items-center gap-2 bg-card"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <input
                    type="text"
                    placeholder={`Message ${activePartner.name}…`}
                    value={messageInput}
                    onChange={handleMessageInputChange}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border outline-none"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="p-2.5 rounded-xl text-white font-medium disabled:opacity-50 transition shadow-sm"
                    style={{ background: '#ff6d34' }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-orange-500/10 text-orange-500">
                  <MessageSquare size={28} />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-lg font-bold">Select a conversation or find a teammate</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect directly with peers to share progress, ask for assistance on tasks, or team
                    up on projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('matcher')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: '#ff6d34' }}
                >
                  <Sparkles size={16} />
                  Find Teammates by Skill
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 2: STUDY GROUPS & PEER COHORTS                        */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div
            className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                />
                <input
                  type="text"
                  placeholder="Search groups by topic, name or skills…"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div className="flex rounded-xl border p-0.5 bg-muted/40" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setGroupFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    groupFilter === 'all' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'
                  }`}
                >
                  All Groups
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('mine')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    groupFilter === 'mine' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'
                  }`}
                >
                  My Groups
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm"
              style={{ background: '#ff6d34' }}
            >
              <Plus size={16} />
              New Study Group
            </button>
          </div>

          {/* Group Cards Grid */}
          {loadingGroups ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading study groups…</div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-12 rounded-2xl border text-center space-y-3" style={{ borderColor: 'var(--border)' }}>
              <Users size={32} className="mx-auto text-orange-500" />
              <h3 className="text-base font-bold">No study groups found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Be the first to start a study group for your topic or skill area!
              </p>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-white"
                style={{ background: '#ff6d34' }}
              >
                Create Study Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((group) => {
                const skillsArr = Array.isArray(group.skills)
                  ? group.skills
                  : typeof group.skills === 'string'
                  ? group.skills.split(',').map((s) => s.trim())
                  : [];

                return (
                  <div
                    key={group.id}
                    className="p-5 rounded-2xl border flex flex-col justify-between transition hover:shadow-md"
                    style={{
                      background: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      {/* Top topic and member capacity pill */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">
                          {group.topic || 'General Study'}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {group.memberCount} / {group.maxMembers} Members
                        </span>
                      </div>

                      <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                        {group.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {group.description || 'No description provided.'}
                      </p>

                      {/* Skill tags */}
                      {skillsArr.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {skillsArr.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <Avatar
                          initials={group.createdBy?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('') || 'C'}
                          size="sm"
                        />
                        <div className="text-[11px]">
                          <p className="font-semibold text-foreground truncate max-w-[90px]">
                            {group.createdBy?.name}
                          </p>
                          <p className="text-muted-foreground text-[9px]">Creator</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {group.isMember ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGroupForInvite(group.id);
                                setInviteTargetUser(null);
                                setShowInviteModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/10 text-teal-600 border border-teal-500/20 hover:bg-teal-500/20 transition flex items-center gap-1"
                              title="Invite Teammates to Group"
                            >
                              <UserPlus size={13} />
                              Invite
                            </button>
                            <button
                              type="button"
                              onClick={() => openStudyGroup(group.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition"
                              style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}
                            >
                              Open Chat
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => joinStudyGroup(group.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20 hover:bg-orange-500/20 transition"
                          >
                            Join Group
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 3: "FIND A TEAMMATE FOR X SKILL" MATCHER             */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'matcher' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                />
                <input
                  type="text"
                  placeholder="Search by name, skills or department…"
                  value={matcherSearch}
                  onChange={(e) => setMatcherSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Filter by Department (e.g. Engineering, Design)…"
                value={matcherDepartment}
                onChange={(e) => setMatcherDepartment(e.target.value)}
                className="px-4 py-2.5 text-sm rounded-xl border outline-none md:w-72"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {/* Popular Skills Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Target Skills for Matching
                </span>
                {selectedSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSkills([])}
                    className="text-xs text-orange-500 hover:underline"
                  >
                    Clear skills ({selectedSkills.length})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkillFilter(skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Candidates Grid */}
          {loadingMatcher ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Finding teammates…</div>
          ) : matcherCandidates.length === 0 ? (
            <div className="p-12 rounded-2xl border text-center space-y-3" style={{ borderColor: 'var(--border)' }}>
              <Sparkles size={32} className="mx-auto text-orange-500" />
              <h3 className="text-base font-bold">No teammates found matching criteria</h3>
              <p className="text-xs text-muted-foreground">
                Try selecting different skills or broadening your search terms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matcherCandidates.map(({ user: peer, matchScore, matchedSkills, allSkills }) => {
                const initials = peer.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={peer.id}
                    className="p-5 rounded-2xl border flex flex-col justify-between transition hover:shadow-md"
                    style={{
                      background: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      {/* Top match score badge & status */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                          style={{
                            background:
                              matchScore >= 80
                                ? 'linear-gradient(135deg, #10b981, #00bea3)'
                                : matchScore >= 60
                                ? 'linear-gradient(135deg, #ff6d34, #f59e0b)'
                                : '#6b7280',
                          }}
                        >
                          ⚡ {matchScore}% Match
                        </span>

                        {peer.isTL && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            Team Lead
                          </span>
                        )}
                      </div>

                      {/* User Info Header */}
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials || 'U'} size="lg" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>
                            {peer.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {peer.department || 'General'} {peer.college ? `• ${peer.college}` : ''}
                          </p>
                          {peer.projectName && (
                            <p className="text-[11px] text-teal-600 font-semibold mt-0.5 truncate">
                              📁 {peer.projectName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Skills listing */}
                      <div className="mt-4 space-y-1.5">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {allSkills.length > 0 ? (
                            allSkills.map((skill, idx) => {
                              const isMatched = matchedSkills.includes(skill);
                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                    isMatched
                                      ? 'bg-teal-500/15 text-teal-600 border-teal-500/30 font-bold'
                                      : 'bg-muted/60 text-muted-foreground border-transparent'
                                  }`}
                                >
                                  {skill}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">No skills listed</span>
                          )}
                        </div>
                      </div>

                      {/* Badges preview */}
                      {peer.badges?.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          {peer.badges.slice(0, 3).map((b, idx) => (
                            <span
                              key={idx}
                              title={b.name}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20"
                            >
                              🏆 {b.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t grid grid-cols-3 gap-2" style={{ borderColor: 'var(--border)' }}>
                      <button
                        type="button"
                        onClick={() => startDMWithUser(peer)}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition"
                        style={{ background: '#ff6d34' }}
                      >
                        <MessageSquare size={13} />
                        Chat
                      </button>

                      <button
                        type="button"
                        onClick={() => openInviteModalForUser(peer)}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold bg-teal-500/10 text-teal-600 border border-teal-500/20 hover:bg-teal-500/20 transition"
                      >
                        <UserPlus size={13} />
                        Invite
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProfileId(peer.id)}
                        className="flex items-center justify-center px-2 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* ACTIVE STUDY GROUP CHAT MODAL / DRAWER                   */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeGroup && (
        <Modal
          isOpen={!!activeGroup}
          onClose={closeStudyGroup}
          title={activeGroup.name}
          className="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-teal-500/10 text-teal-600">
                  {activeGroup.topic || 'Study Cohort'}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{activeGroup.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {activeGroup.meetingLink && (
                  <a
                    href={activeGroup.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    <Video size={13} />
                    Join Video Call
                  </a>
                )}
                {!activeGroup.isCreator && (
                  <button
                    type="button"
                    onClick={() => leaveStudyGroup(activeGroup.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition"
                  >
                    <LogOut size={13} />
                    Leave
                  </button>
                )}
              </div>
            </div>

            {/* Split: Messages (left) + Members (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[450px]">
              {/* Group Chat Messages */}
              <div className="md:col-span-8 flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-muted/10">
                  {groupMessages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No messages yet. Say hello to your study group members! 👋
                    </div>
                  ) : (
                    groupMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <Avatar
                              initials={msg.sender?.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('') || 'U'}
                              size="sm"
                            />
                          )}

                          <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (
                              <p className="text-[10px] font-bold text-muted-foreground mb-0.5 ml-1">
                                {msg.sender?.name}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                                isMe
                                  ? 'bg-orange-500 text-white rounded-br-none'
                                  : 'bg-card border border-border text-foreground rounded-bl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <span
                                className={`block text-[9px] mt-1 ${
                                  isMe ? 'text-white/80 text-right' : 'text-muted-foreground'
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={groupMessagesEndRef} />
                </div>

                {/* Group message composer */}
                <form
                  onSubmit={handleSendGroupMessage}
                  className="p-2.5 border-t border-border flex items-center gap-2 bg-card"
                >
                  <input
                    type="text"
                    placeholder="Type group message…"
                    value={groupMessageInput}
                    onChange={handleGroupInputChange}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-border outline-none bg-input-bg"
                  />
                  <button
                    type="submit"
                    disabled={!groupMessageInput.trim()}
                    className="p-2 rounded-xl text-white font-medium disabled:opacity-50"
                    style={{ background: '#ff6d34' }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>

              {/* Members Roster */}
              <div className="md:col-span-4 rounded-xl border border-border bg-card p-3 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground">
                    Members ({activeGroup.members?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupForInvite(activeGroup.id);
                      setInviteTargetUser(null);
                      setShowInviteModal(true);
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 text-teal-600 border border-teal-500/20 hover:bg-teal-500/20 transition flex items-center gap-1"
                  >
                    <UserPlus size={12} />
                    + Invite
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border/40 space-y-1">
                  {activeGroup.members?.map((m) => (
                    <div
                      key={m.userId}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          initials={m.user?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('') || 'U'}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{m.user?.name}</p>
                          <span className="text-[9px] text-muted-foreground uppercase">
                            {m.role}
                          </span>
                        </div>
                      </div>

                      {m.userId !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => {
                            closeStudyGroup();
                            startDMWithUser(m.user);
                          }}
                          className="p-1 rounded text-orange-500 hover:bg-orange-500/10"
                          title="Direct Message"
                        >
                          <MessageSquare size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* CREATE STUDY GROUP MODAL                                  */}
      {/* ───────────────────────────────────────────────────────── */}
      {showCreateGroupModal && (
        <Modal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          title="Create a Study Group"
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Group Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. React & Fullstack Masterminds"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Topic / Specialization
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Development, Machine Learning, System Design"
                value={newGroupData.topic}
                onChange={(e) => setNewGroupData({ ...newGroupData, topic: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Target Skills (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Node.js, TypeScript, Docker"
                value={newGroupData.skills}
                onChange={(e) => setNewGroupData({ ...newGroupData, skills: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Description & Goals
              </label>
              <textarea
                rows={3}
                placeholder="What is this group about? What are your study goals and meetups?"
                value={newGroupData.description}
                onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Max Members (2-50)
                </label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={newGroupData.maxMembers}
                  onChange={(e) =>
                    setNewGroupData({ ...newGroupData, maxMembers: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Video Call Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newGroupData.meetingLink}
                  onChange={(e) =>
                    setNewGroupData({ ...newGroupData, meetingLink: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingGroup}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                style={{ background: '#ff6d34' }}
              >
                {creatingGroup ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* INVITE TO GROUP MODAL                                     */}
      {/* ───────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setInviteTargetUser(null);
          }}
          title={inviteTargetUser ? `Invite ${inviteTargetUser.name} to Study Group` : 'Invite Teammate to Study Group'}
        >
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Select Study Group *
              </label>
              {studyGroups.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
                  You haven't created or joined any study groups yet. Create one first!
                </div>
              ) : (
                <select
                  value={selectedGroupForInvite}
                  onChange={(e) => setSelectedGroupForInvite(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
                >
                  {studyGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.topic || 'General'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {inviteTargetUser ? (
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs font-semibold text-muted-foreground block mb-0.5">Inviting:</span>
                <p className="text-sm font-bold text-foreground">
                  {inviteTargetUser.name}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({inviteTargetUser.department || 'Intern'})
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Select Intern / Peer to Invite *
                </label>
                {allPeers.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/40">
                    Loading interns…
                  </div>
                ) : (
                  <select
                    value={selectedPeerIdForInvite}
                    onChange={(e) => setSelectedPeerIdForInvite(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
                  >
                    {allPeers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.department || 'Intern'} {p.college ? `(${p.college})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Personalized Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. We are working on TypeScript & frontend, would love to have you join!"
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border outline-none bg-input-bg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteTargetUser(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingInvite || studyGroups.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                style={{ background: '#ff6d34' }}
              >
                {sendingInvite ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* USER PROFILE MODAL                                        */}
      {/* ───────────────────────────────────────────────────────── */}
      {selectedProfileId && (
        <UserProfileModal
          isOpen={!!selectedProfileId}
          userId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  );
};

export default PeerHub;
