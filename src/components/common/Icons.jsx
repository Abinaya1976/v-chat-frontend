import React from 'react';

/**
 * Centralized Icon Repository for Flock ChatApp
 * All application icons are defined here as clean, modern SVG components.
 */

// Helper wrapper for standardized SVG props
const SvgIcon = ({ children, size = 18, color = 'currentColor', strokeWidth = 2, className = '', style = {} }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
  >
    {children}
  </svg>
);

// BOT ICON
export const BotIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </SvgIcon>
);

// BELL / REMINDER ICON
export const BellIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </SvgIcon>
);

// 1. TODO / TASK ICON (Single source of truth used everywhere for To-Dos)
export const TodoIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </SvgIcon>
);

// 2. CHANNELS ICON (Single source of truth used everywhere for Public Channels & Channel Management)
export const ChannelIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </SvgIcon>
);

// 3. PRIVATE CHANNEL / LOCK ICON
export const LockIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </SvgIcon>
);

// 4. CHAT / CONVERSATION ICON (Single source of truth for Direct Messages & Empty State Chat Icon)
export const ChatIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </SvgIcon>
);

// 5. SEARCH ICON
export const SearchIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </SvgIcon>
);

// 6. SAVED MESSAGES / BOOKMARK ICON
export const BookmarkIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </SvgIcon>
);

// 7. PIN ICON
export const PinIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14l-2-6V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6l-2 6z" />
    <line x1="9" y1="4" x2="15" y2="4" />
  </SvgIcon>
);

// 8. CONTACTS / DIRECTORY ICON
export const ContactsIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </SvgIcon>
);

// 9. SETTINGS / GEAR ICON
export const SettingsIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);

// 10. AUDIT LOG / HISTORY ICON
export const HistoryIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </SvgIcon>
);

// 11. ADMIN / SHIELD ICON
export const AdminIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </SvgIcon>
);

// 12. OVERVIEW / DASHBOARD GRID ICON
export const OverviewIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </SvgIcon>
);

// 13. MEMBERS / USERS ICON
export const UsersIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </SvgIcon>
);

// 14. PLUS / ADD ICON
export const PlusIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </SvgIcon>
);

// 15. CLOSE / DISMISS ICON
export const CloseIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </SvgIcon>
);

// 16. ATTACHMENT / PAPERCLIP ICON
export const AttachmentIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </SvgIcon>
);

// 17. SEND ICON
export const SendIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </SvgIcon>
);

// 18. MAIL / MESSAGE VOLUME ICON
export const MailIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </SvgIcon>
);

// 19. INBOX / REQUESTS ICON
export const InboxIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </SvgIcon>
);

// 20. CHECK / SUCCESS ICON
export const CheckIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <polyline points="20 6 9 17 4 12" />
  </SvgIcon>
);

// 21. COMPANY / WORKSPACE / BUILDING ICON
export const CompanyIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </SvgIcon>
);

// 22. PROFILE / USER EDIT ICON
export const UserEditIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </SvgIcon>
);

// 23. LOGOUT / EXIT ICON
export const LogoutIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </SvgIcon>
);

// 24. MORE VERTICAL / THREE DOTS ICON
export const MoreVerticalIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="12" cy="12" r="1.2" fill={color} />
    <circle cx="12" cy="5" r="1.2" fill={color} />
    <circle cx="12" cy="19" r="1.2" fill={color} />
  </SvgIcon>
);

// 25. SUPER ADMIN SHIELD STAR ICON
export const ShieldStarIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polygon points="12 8 13.5 11 17 11 14.5 13 15.5 16 12 14 8.5 16 9.5 13 7 11 10.5 11 12 8" fill={color} stroke="none" />
  </SvgIcon>
);

// 26. BUILDING / ORGANIZATION ICON
export const BuildingIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="3" y1="9" x2="9" y2="9" />
    <line x1="3" y1="15" x2="9" y2="15" />
    <line x1="12" y1="9" x2="21" y2="9" />
    <line x1="12" y1="15" x2="21" y2="15" />
  </SvgIcon>
);

// 27. ALERT TRIANGLE / WARNING ICON
export const AlertTriangleIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </SvgIcon>
);

// 28. TOGGLE ON ICON (feature enabled)
export const ToggleOnIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="1" y="6" width="22" height="12" rx="6" ry="6" />
    <circle cx="17" cy="12" r="4" fill={color} stroke="none" />
  </SvgIcon>
);

// 29. TOGGLE OFF ICON (feature disabled)
export const ToggleOffIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="1" y="6" width="22" height="12" rx="6" ry="6" />
    <circle cx="7" cy="12" r="4" fill={color} stroke="none" />
  </SvgIcon>
);

// 30. CALENDAR / EXPIRY ICON
export const CalendarIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </SvgIcon>
);

// 31. CROWN / PLATFORM ICON
export const CrownIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M2 20h20" />
    <path d="M4 20L2 8l6 6 4-8 4 8 6-6-2 12H4z" />
  </SvgIcon>
);

// 32. SLIDERS / FEATURES ICON
export const SlidersIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </SvgIcon>
);

// 33. CREDIT CARD / SUBSCRIPTION ICON
export const CreditCardIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </SvgIcon>
);

// 34. REFRESH / RELOAD ICON
export const RefreshIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </SvgIcon>
);

// 35. POLL ICON (Professional bar chart style)
export const PollIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </SvgIcon>
);

// 36. ATTACH / PAPERCLIP ICON
export const AttachIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </SvgIcon>
);

// 37. REMINDER / BELL ICON
export const ReminderIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </SvgIcon>
);

export const BellOffIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 0 0-9.33-5" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </SvgIcon>
);

// 38. NOTE / PRIVATE NOTE ICON
export const NoteIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </SvgIcon>
);

// 39. EDIT ICON
export const EditIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </SvgIcon>
);

// 40. TRASH / DELETE ICON
export const TrashIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </SvgIcon>
);

// 41. CLOCK / TIME ICON
export const ClockIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </SvgIcon>
);

// 42. AUDIO CALL / PHONE ICON
export const AudioCallIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </SvgIcon>
);

export const PhoneIcon = AudioCallIcon;

// 43. VIDEO CALL / CAMERA ICON
export const VideoCallIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </SvgIcon>
);

export const VideoIcon = VideoCallIcon;

// 44. PHONE OFF / DECLINE / END CALL ICON
export const PhoneOffIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </SvgIcon>
);

// 45. MIC ICON
export const MicIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </SvgIcon>
);

// 46. MIC OFF ICON
export const MicOffIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </SvgIcon>
);

// 47. VIDEO OFF ICON
export const VideoOffIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <SvgIcon size={size} color={color} strokeWidth={strokeWidth} className={className} style={style}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M21 21l-4.35-4.35M23 7l-7 5 7 5V7z" />
    <path d="M16 16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
  </SvgIcon>
);





export const PlayIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);
export const PauseIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);
export const StopIcon = ({ size = 18, color = 'currentColor', strokeWidth = 2, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  </svg>
);
