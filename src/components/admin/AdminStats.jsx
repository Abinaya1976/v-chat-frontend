import {
  UsersIcon,
  MailIcon,
  ChannelIcon,
  TodoIcon,
  ChatIcon,
  AttachmentIcon,
  LockIcon,
} from '../common/Icons';

function AdminStats({ stats = {}, loading = false }) {
  if (loading) {
    return (
      <div className="admin-stats-grid loading-state">
        <div className="admin-stat-card skeleton" />
        <div className="admin-stat-card skeleton" />
        <div className="admin-stat-card skeleton" />
        <div className="admin-stat-card skeleton" />
      </div>
    );
  }

  const todoMetrics = stats.todoMetrics || {
    totalTodos: 0,
    completedTodos: 0,
    pendingTodos: 0,
    completionPercentage: 0,
  };

  const statItems = [
    {
      title: 'Total Members',
      value: stats.totalUsers || 0,
      sub: `${stats.ownerUsers || 1} Owner • ${stats.adminUsers || 0} Admins • ${stats.pendingInvitations || stats.pendingJoinRequests || 0} Pending Invitations`,
      icon: <UsersIcon size={18} color="var(--primary-accent)" />,
      color: 'blue',
    },
    {
      title: 'Activity Volume',
      value: stats.totalMessages || 0,
      sub: `${stats.messagesToday || 0} today • ${stats.messagesThisWeek || 0} this week`,
      icon: <MailIcon size={18} color="var(--primary-accent)" />,
      color: 'blue',
    },
    {
      title: 'Group Channels',
      value: stats.totalChannels || 0,
      sub: `${stats.publicChannels || 0} public • ${stats.privateChannels || 0} private`,
      icon: <ChannelIcon size={18} color="var(--primary-accent)" />,
      color: 'blue',
    },
    {
      title: 'Task & Todo Progress',
      value: `${todoMetrics.completionPercentage}%`,
      sub: `${todoMetrics.completedTodos} completed / ${todoMetrics.totalTodos} total (${todoMetrics.pendingTodos} pending)`,
      icon: <TodoIcon size={18} color="var(--primary-accent)" />,
      color: 'blue',
    },
    {
      title: 'Direct Conversations',
      value: stats.totalConversations || 0,
      sub: 'Active 1-on-1 pairs',
      icon: <ChatIcon size={18} color="var(--primary-accent)" />,
      color: 'blue',
    },
    {
      title: 'Files & Media',
      value: stats.totalFiles || 0,
      sub: 'Uploaded attachments',
      icon: <AttachmentIcon size={18} color="var(--primary-accent)" />,
      color: 'blue',
    },
  ];

  return (
    <div className="admin-stats-container" style={{ marginBottom: '24px' }}>
      <div className="admin-stats-grid">
        {statItems.map((item, idx) => (
          <div key={idx} className={`admin-stat-card stat-${item.color}`}>
            <div className="stat-card-header">
              <span className="stat-card-title">{item.title}</span>
              <span className="stat-card-icon">{item.icon}</span>
            </div>
            <div className="stat-card-value">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
            <div className="stat-card-sub">{item.sub}</div>
          </div>
        ))}
      </div>

      {stats.topChannels && stats.topChannels.length > 0 && (
        <div className="admin-quick-actions-card" style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>Top Active Channels</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {stats.topChannels.map((chan) => (
              <div
                key={chan._id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {chan.isPrivate ? <LockIcon size={14} /> : <ChannelIcon size={14} />} {chan.name}
                </span>
                <span style={{ color: '#64748b', background: '#e2e8f0', borderRadius: '12px', padding: '2px 8px', fontSize: '11px' }}>
                  {chan.messageCount} msgs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStats;
