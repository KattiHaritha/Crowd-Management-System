import axios from "axios";

export type AnalyticsQuery = {
  siteId: string;
  fromUtc: number;
  toUtc: number;
};

export type Site = {
  siteId: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  zones: Zone[];
};

export type Zone = {
  zoneId: string;
  name: string;
  securityLevel: string;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://hiring-dev.internal.kloudspot.com/api",
  // Analytics requests can take longer than a typical UI request while the
  // service aggregates a time range.
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("crowd_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Checks whether the backend is available. The current server requires a JWT. */
export async function checkHealth() {
  const response = await api.get("/health");
  return response.data;
}

/** Checks backend availability and returns the authenticated user's health response. */
export async function checkSecureHealth() {
  const response = await api.get("/health/secure");
  return response.data;
}

export async function login(email: string, password: string) {
  // Confirm the exact request body and response/token field in Swagger.
  const response = await api.post("/auth/login", { email, password });
  const data = response.data;
  const token =
    data?.accessToken ??
    data?.access_token ??
    data?.token ??
    data?.data?.accessToken ??
    data?.data?.access_token ??
    data?.data?.token;

  if (token && typeof token === "string") {
    sessionStorage.setItem("crowd_access_token", token);
  }
  return data;
}

export async function fetchSites() {
  const response = await api.get<Site[]>("/sites");
  return response.data;
}

export async function fetchSite(siteId: string) {
  const response = await api.get<Site>(`/sites/${encodeURIComponent(siteId)}`);
  return response.data;
}

/** Starts the server's synthetic live-occupancy event stream. */
export async function startSimulation() {
  const response = await api.get<{ message?: string }>("/sim/start");
  return response.data;
}

/** Stops the server's synthetic live-occupancy event stream. */
export async function stopSimulation() {
  const response = await api.get<{ message?: string }>("/sim/stop");
  return response.data;
}

export async function fetchDwell(query: AnalyticsQuery) {
  const response = await api.post("/analytics/dwell", query);
  return response.data;
}

export async function fetchFootfall(query: AnalyticsQuery) {
  const response = await api.post("/analytics/footfall", query);
  return response.data;
}

export async function fetchOccupancy(query: AnalyticsQuery) {
  const response = await api.post("/analytics/occupancy", query);
  return response.data;
}

export async function fetchDemographics(query: AnalyticsQuery) {
  const response = await api.post("/analytics/demographics", query);
  return response.data;
}

export async function fetchEntries(query: AnalyticsQuery, pageNumber = 1, pageSize = 50) {
  const response = await api.post("/analytics/entry-exit", { ...query, pageNumber, pageSize });
  return response.data;
}

export function getAnalyticsRange(): Omit<AnalyticsQuery, "siteId"> {
  const toUtc = Date.now();
  return { fromUtc: toUtc - 24 * 60 * 60 * 1000, toUtc };
}

function getTimeZoneOffset(timeZone: string, timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second")) - timestamp;
}

/** Returns the current calendar-day range in the selected site's timezone. */
export function getTodayRange(timeZone?: string): Omit<AnalyticsQuery, "siteId"> {
  const toUtc = Date.now();
  if (!timeZone) {
    const start = new Date(toUtc);
    start.setHours(0, 0, 0, 0);
    return { fromUtc: start.getTime(), toUtc };
  }

  try {
    const dateParts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(toUtc));
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(dateParts.find((part) => part.type === type)?.value);
    const midnightAsUtc = Date.UTC(value("year"), value("month") - 1, value("day"));
    // Recalculate after converting so daylight-saving offset changes are also handled.
    const fromUtc = midnightAsUtc - getTimeZoneOffset(timeZone, midnightAsUtc);
    return { fromUtc: midnightAsUtc - getTimeZoneOffset(timeZone, fromUtc), toUtc };
  } catch {
    // A malformed timezone must not prevent the dashboard from loading.
    const start = new Date(toUtc);
    start.setHours(0, 0, 0, 0);
    return { fromUtc: start.getTime(), toUtc };
  }
}

export function logout() {
  sessionStorage.removeItem("crowd_access_token");
}

export default api;
