import { useState, useEffect, useCallback } from "react";
import {
  getGoogleCalendarStatus,
  initiateGoogleCalendarConnect,
  disconnectGoogleCalendar,
  getCalendars,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../services/googleCalendarService";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, "0");

const toLocalInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatEventDisplay = (evt) => {
  const isAllDay = Boolean(evt.start?.date);
  if (isAllDay) {
    const d = new Date(evt.start.date + "T00:00:00");
    return {
      date: d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
      time: "All Day",
      isAllDay: true,
    };
  }
  const start = new Date(evt.start.dateTime);
  const end = new Date(evt.end.dateTime);
  return {
    date: start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
    time: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    isAllDay: false,
  };
};

const emptyForm = (prefill = {}) => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const start = toLocalInput(now);
  const end = toLocalInput(new Date(now.getTime() + 3600000));
  return {
    summary: prefill.summary || "",
    description: prefill.description || "",
    location: prefill.location || "",
    start: prefill.start || start,
    end: prefill.end || end,
    allDay: prefill.allDay || false,
    startDate: prefill.startDate || toLocalDate(now),
    endDate: prefill.endDate || toLocalDate(now),
    calendarId: prefill.calendarId || "primary",
  };
};

/* -------------------------------------------------------
   Event Form Modal (Only for AddToCalendarDialog now)
------------------------------------------------------- */
function EventModal({ form, setForm, onSave, onClose, saving, calendars, isEditing }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="gcal-modal-overlay" onClick={onClose}>
      <div className="gcal-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="gcal-modal-header">
          <h3 className="gcal-modal-title">{isEditing ? "Edit Event" : "Create Event"}</h3>
          <button type="button" className="gcal-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="gcal-modal-form">
          {calendars.length > 1 && (
            <div className="gcal-form-group">
              <label className="gcal-form-label">Calendar</label>
              <select
                className="gcal-form-select"
                value={form.calendarId}
                onChange={(e) => setForm({ ...form, calendarId: e.target.value })}
              >
                {calendars.map((c) => (
                  <option key={c.id} value={c.id}>{c.summary}</option>
                ))}
              </select>
            </div>
          )}

          <div className="gcal-form-group">
            <label className="gcal-form-label">Title <span style={{ color: "var(--error)" }}>*</span></label>
            <input
              required
              type="text"
              className="gcal-form-input"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Event title"
            />
          </div>

          <div className="gcal-form-group gcal-allday-row">
            <label className="gcal-form-label">All Day</label>
            <button
              type="button"
              className={`gcal-toggle ${form.allDay ? "on" : ""}`}
              onClick={() => setForm({ ...form, allDay: !form.allDay })}
              aria-pressed={form.allDay}
            >
              <span className="gcal-toggle-knob" />
            </button>
          </div>

          {form.allDay ? (
            <div className="gcal-form-row">
              <div className="gcal-form-group">
                <label className="gcal-form-label">Start Date <span style={{ color: "var(--error)" }}>*</span></label>
                <input
                  required
                  type="date"
                  className="gcal-form-input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value })}
                />
              </div>
              <div className="gcal-form-group">
                <label className="gcal-form-label">End Date <span style={{ color: "var(--error)" }}>*</span></label>
                <input
                  required
                  type="date"
                  className="gcal-form-input"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="gcal-form-row">
              <div className="gcal-form-group">
                <label className="gcal-form-label">Start <span style={{ color: "var(--error)" }}>*</span></label>
                <input
                  required
                  type="datetime-local"
                  className="gcal-form-input"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              <div className="gcal-form-group">
                <label className="gcal-form-label">End <span style={{ color: "var(--error)" }}>*</span></label>
                <input
                  required
                  type="datetime-local"
                  className="gcal-form-input"
                  value={form.end}
                  min={form.start}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="gcal-form-group">
            <label className="gcal-form-label">Description</label>
            <textarea
              className="gcal-form-input gcal-form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="gcal-form-group">
            <label className="gcal-form-label">Location</label>
            <input
              type="text"
              className="gcal-form-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Optional location"
            />
          </div>

          <div className="gcal-modal-actions">
            <button type="button" className="gcal-btn gcal-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="gcal-btn gcal-btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function buildPayload(form) {
  const payload = {
    calendarId: form.calendarId || "primary",
    summary: form.summary.trim(),
    description: form.description || undefined,
    location: form.location || undefined,
  };

  if (form.allDay) {
    const endDateExclusive = new Date(form.endDate);
    endDateExclusive.setDate(endDateExclusive.getDate() + 1);
    const exclusiveStr = toLocalDate(endDateExclusive);
    payload.start = { date: form.startDate };
    payload.end = { date: exclusiveStr };
  } else {
    payload.start = { dateTime: new Date(form.start).toISOString() };
    payload.end = { dateTime: new Date(form.end).toISOString() };
  }

  return payload;
}

function AddToCalendarDialog({ prefill, calendars, onConfirm, onClose }) {
  const [form, setForm] = useState(emptyForm(prefill));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload(form);
      await createEvent(payload);
      onConfirm();
    } catch (err) {
      alert("Failed to create event: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <EventModal
      form={form}
      setForm={setForm}
      onSave={handleSave}
      onClose={onClose}
      saving={saving}
      calendars={calendars}
      isEditing={false}
    />
  );
}

/* -------------------------------------------------------
   Main Google Calendar Panel
------------------------------------------------------- */
function GoogleCalendarPanel({ onConnectionChange, prefillEvent, onPrefillConsumed }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);

  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("primary");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // Calendar UI state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [addToCalOpen, setAddToCalOpen] = useState(false);
  const [addToCalPrefill, setAddToCalPrefill] = useState(null);

  const [holidays, setHolidays] = useState([]);

  /* ---- Load connection status ---- */
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGoogleCalendarStatus();
      setStatus(data);
      onConnectionChange?.(Boolean(data?.connected));
      if (data?.connected) {
        const list = await getCalendars();
        setCalendars(list || []);
        const primary = (list || []).find((c) => c.primary) || (list || [])[0];
        if (primary) setSelectedCalendarId(primary.id);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setStatus({ connected: false, googleEmail: null });
        onConnectionChange?.(false);
      } else {
        setError("Could not reach Google Calendar. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [onConnectionChange]);

  /* ---- Load events for the month ---- */
  const loadEvents = useCallback(async () => {
    if (!selectedCalendarId) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
      
      const evts = await getEvents(selectedCalendarId, startOfMonth.toISOString(), endOfMonth.toISOString());
      setEvents(evts || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setEventsError("Access to this calendar was revoked. Please reconnect.");
        setStatus({ connected: false, googleEmail: null });
        onConnectionChange?.(false);
      } else {
        setEventsError("Could not load events. Please try again.");
      }
    } finally {
      setEventsLoading(false);
    }
  }, [selectedCalendarId, currentMonth, onConnectionChange]);

  /* ---- Mount ---- */
  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_calendar")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.connected) loadEvents();
  }, [selectedCalendarId, currentMonth, status, loadEvents]);

  useEffect(() => {
    if (prefillEvent && status?.connected) {
      setAddToCalPrefill(prefillEvent);
      setAddToCalOpen(true);
      onPrefillConsumed?.();
    }
  }, [prefillEvent, status, onPrefillConsumed]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setHolidays(data);
      })
      .catch(() => {});
  }, [currentMonth]);

  /* ---- Handlers ---- */
  const handleConnect = () => {
    try { initiateGoogleCalendarConnect(); }
    catch (e) { setError(e.message); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Google Calendar? You can reconnect anytime.")) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleCalendar();
      setStatus({ connected: false, googleEmail: null });
      setCalendars([]);
      setEvents([]);
      onConnectionChange?.(false);
    } catch {
      setError("Could not disconnect. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  const openCreate = () => {
    const padDate = (n) => String(n).padStart(2, "0");
    const dateObj = selectedDate || new Date();
    const yyyy = dateObj.getFullYear();
    const mm = padDate(dateObj.getMonth() + 1);
    const dd = padDate(dateObj.getDate());
    
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);
    const nyyyy = nextDate.getFullYear();
    const nmm = padDate(nextDate.getMonth() + 1);
    const ndd = padDate(nextDate.getDate());

    const datesParam = `${yyyy}${mm}${dd}/${nyyyy}${nmm}${ndd}`;

    if (status?.googleEmail) {
      const email = encodeURIComponent(status.googleEmail);
      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&src=${email}&dates=${datesParam}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${datesParam}`, "_blank", "noopener,noreferrer");
    }
  };

  const openEdit = (evt) => {
    if (evt.htmlLink) {
      window.open(evt.htmlLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this event from Google Calendar?")) return;
    try {
      await deleteEvent(eventId, selectedCalendarId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      alert("Could not delete event. Please try again.");
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };



  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getEventDate = (evt) => {
    if (evt.start?.date) return new Date(evt.start.date + "T00:00:00");
    if (evt.start?.dateTime) return new Date(evt.start.dateTime);
    return null;
  };

  // Filter events for the selected day
  const selectedDayEvents = events.filter((evt) => {
    const d = getEventDate(evt);
    return isSameDay(d, selectedDate);
  });

  // Calendar Math
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();

  // Generate calendar cells
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} className="gcal-day empty"></div>);
  
  const daysInMonthCells = Array.from({ length: daysInMonth }, (_, i) => {
    const dateNum = i + 1;
    const thisDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dateNum);
    const isToday = isSameDay(thisDate, today);
    const isSelected = isSameDay(thisDate, selectedDate);
    
    // Check if there are events on this day
    const hasEvents = events.some(evt => isSameDay(getEventDate(evt), thisDate));

    return (
      <button
        key={`day-${dateNum}`}
        type="button"
        className={`gcal-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
        onClick={() => setSelectedDate(thisDate)}
      >
        <span className="gcal-day-num">{dateNum}</span>
        {hasEvents && <div className="gcal-day-dot"></div>}
      </button>
    );
  });

  const totalCells = [...blanks, ...daysInMonthCells];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="gcal-panel gcal-center">
        <div className="gcal-spinner" />
        <p className="gcal-muted">Connecting to Google Calendar…</p>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div className="gcal-panel gcal-center">
        <span className="gcal-icon-lg">⚠️</span>
        <p className="gcal-error-text">{error}</p>
        <button className="gcal-btn gcal-btn-outline" onClick={fetchStatus}>Retry</button>
      </div>
    );
  }

  /* ---- Not Connected ---- */
  if (!status?.connected) {
    return (
      <div className="gcal-panel gcal-center">
        <div className="gcal-connect-card">
          <div className="gcal-connect-icon-wrap">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--primary-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="8" y1="14" x2="16" y2="14" />
              <line x1="8" y1="18" x2="12" y2="18" />
            </svg>
          </div>
          <h2 className="gcal-connect-title">Google Calendar</h2>
          <p className="gcal-connect-desc">
            Connect your Google account to view, create, and manage calendar events directly inside Flock.
          </p>
          <ul className="gcal-feature-list">
            <li>View upcoming events from any of your calendars</li>
            <li>Create and edit events seamlessly</li>
            <li>Add Todos and tasks to your calendar in one click</li>
          </ul>
          <button className="gcal-btn gcal-btn-primary gcal-btn-full" onClick={handleConnect}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Connect Google Calendar
          </button>
          <p className="gcal-privacy-note">We only request access to manage calendar events. Your credentials are never stored in the browser.</p>
        </div>
      </div>
    );
  }

  const selectedHoliday = holidays.find(h => {
    const d = new Date(h.date);
    return isSameDay(d, selectedDate);
  });

  /* ---- Connected ---- */
  return (
    <div className="gcal-panel gcal-workspace">
      {/* Header bar */}
      <div className="gcal-header-bar">
        <div className="gcal-header-left">
          <div className="gcal-avatar">
            {status.googleEmail?.[0]?.toUpperCase() || "G"}
          </div>
          <div>
            <div className="gcal-header-label">Google Calendar</div>
            <div className="gcal-header-email">{status.googleEmail}</div>
          </div>
        </div>
        <div className="gcal-header-right">
          <button className="gcal-btn gcal-btn-primary gcal-btn-sm" onClick={openCreate} title="Open Google Calendar to create an event">
            + New Event
          </button>
          <button className="gcal-btn gcal-btn-ghost gcal-btn-sm" onClick={handleDisconnect} disabled={disconnecting} title="Disconnect Google Calendar">
            {disconnecting ? "…" : "Disconnect"}
          </button>
        </div>
      </div>

      <div className="gcal-content-layout">
        <div className="gcal-calendar-section">
          {/* Calendar Header */}
          <div className="gcal-month-header">
            <div className="gcal-month-nav">
              <button className="gcal-btn-icon" onClick={prevMonth} aria-label="Previous month">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h3 className="gcal-month-title">
                {currentMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
              </h3>
              <button className="gcal-btn-icon" onClick={nextMonth} aria-label="Next month">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="gcal-month-actions">
              {calendars.length > 1 && (
                <select
                  className="gcal-select gcal-select-sm"
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                  aria-label="Choose calendar"
                >
                  {calendars.map((c) => (
                    <option key={c.id} value={c.id}>{c.summary}</option>
                  ))}
                </select>
              )}
              <button className="gcal-btn-ghost gcal-btn-sm" onClick={goToday}>Today</button>
              <button className="gcal-btn-icon" onClick={loadEvents} title="Refresh events" aria-label="Refresh">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="gcal-calendar-grid-wrapper">
            <div className="gcal-weekdays">
              {weekDays.map(d => <div key={d} className="gcal-weekday">{d}</div>)}
            </div>
            <div className="gcal-days-grid">
              {totalCells}
            </div>
          </div>
        </div>

        {/* Selected Day Event List */}
        <div className="gcal-event-list-section">
          <h4 className="gcal-selected-date-title">
            {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            {selectedHoliday && (
              <div style={{ fontSize: "0.85rem", color: "var(--primary-accent)", marginTop: "4px" }}>
                🎉 {selectedHoliday.localName}
              </div>
            )}
          </h4>
          
          <div className="gcal-event-list-area">
            {eventsLoading ? (
              <div className="gcal-center gcal-events-loading">
                <div className="gcal-spinner" />
                <p className="gcal-muted">Loading events…</p>
              </div>
            ) : eventsError ? (
              <div className="gcal-center">
                <p className="gcal-error-text">{eventsError}</p>
                <button className="gcal-btn gcal-btn-outline" onClick={loadEvents}>Retry</button>
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="gcal-empty-events">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <p className="gcal-muted" style={{ marginTop: "0.6rem" }}>No events scheduled</p>
              </div>
            ) : (
              <ul className="gcal-events-ul">
                {selectedDayEvents.map((evt) => {
                  const { time, isAllDay } = formatEventDisplay(evt);
                  return (
                    <li key={evt.id} className="gcal-event-card">
                      <div className="gcal-event-color-bar" style={{ background: evt.colorId ? "#4285F4" : "var(--primary-accent)" }} />
                      <div className="gcal-event-body">
                        <div className="gcal-event-title">{evt.summary || "(No Title)"}</div>
                        <div className="gcal-event-meta">
                          <span className={isAllDay ? "gcal-allday-badge" : ""}>{time}</span>
                        </div>
                        {evt.location && (
                          <div className="gcal-event-location">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {evt.location}
                          </div>
                        )}
                        {evt.description && <div className="gcal-event-desc">{evt.description.slice(0, 80)}{evt.description.length > 80 ? "…" : ""}</div>}
                      </div>
                      <div className="gcal-event-actions">
                        <button type="button" className="gcal-event-action-btn" onClick={() => openEdit(evt)} title="Open in Google Calendar">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </button>
                        <button type="button" className="gcal-event-action-btn gcal-event-delete-btn" onClick={() => handleDelete(evt.id)} title="Delete event">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {addToCalOpen && (
        <AddToCalendarDialog
          prefill={{ ...addToCalPrefill, calendarId: selectedCalendarId }}
          calendars={calendars}
          onConfirm={() => {
            setAddToCalOpen(false);
            setAddToCalPrefill(null);
            loadEvents();
          }}
          onClose={() => {
            setAddToCalOpen(false);
            setAddToCalPrefill(null);
          }}
        />
      )}
    </div>
  );
}

export default GoogleCalendarPanel;
export { AddToCalendarDialog };