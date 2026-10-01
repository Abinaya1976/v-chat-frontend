import api from "./api";

export const getGoogleCalendarStatus = async () => {
  const { data } = await api.get("/google/status");
  return data;
};

export const initiateGoogleCalendarConnect = () => {
  const token = sessionStorage.getItem("chatapp_token");
  if (!token) {
    throw new Error("You must be logged in to connect Google Calendar.");
  }
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000";
  window.location.href = `${baseUrl}/api/google/auth?token=${encodeURIComponent(token)}`;
};

export const disconnectGoogleCalendar = async () => {
  const { data } = await api.delete("/google/disconnect");
  return data;
};

// Phase 2 & 3 API Wrappers

export const getCalendars = async () => {
  const { data } = await api.get("/google/calendars");
  return data.calendars || [];
};

export const getEvents = async (calendarId = "primary", timeMin, timeMax) => {
  let url = `/google/events?calendarId=${encodeURIComponent(calendarId)}`;
  if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
  if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;
  const { data } = await api.get(url);
  return data.events || [];
};

export const createEvent = async (eventData) => {
  const { data } = await api.post("/google/events", eventData);
  return data.event;
};

export const updateEvent = async (eventId, eventData) => {
  const { data } = await api.patch(`/google/events/${eventId}`, eventData);
  return data.event;
};

export const deleteEvent = async (eventId, calendarId = "primary") => {
  const { data } = await api.delete(`/google/events/${eventId}?calendarId=${encodeURIComponent(calendarId)}`);
  return data;
};