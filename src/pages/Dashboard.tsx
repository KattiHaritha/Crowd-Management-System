import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Footprints, Clock3, Activity, BellRing, RefreshCw } from "lucide-react";
import StatCard from "../components/StatCard";
import { fetchDemographics, fetchDwell, fetchFootfall, fetchOccupancy, fetchSites, getAnalyticsRange, getTodayRange, startSimulation, stopSimulation } from "../services/api";
import { connectCrowdSocket, disconnectCrowdSocket } from "../services/socket";

type OccupancyPoint = { time: string; count: number };
type DemographicPoint = { time: string; male: number; female: number };
type Alert = { id: string; text: string; severity: string; time: string };
type Metrics = { occupancy: string; footfall: string; dwell: string; occupancyTrend: string; footfallTrend: string; dwellTrend: string };
const emptyMetrics: Metrics = { occupancy: "—", footfall: "—", dwell: "—", occupancyTrend: "", footfallTrend: "", dwellTrend: "" };

function comparison(current: number | undefined, previous: number | undefined) {
  if (typeof current !== "number" || typeof previous !== "number" || !Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return "No previous-day comparison";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}% vs previous day`;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [occupancy, setOccupancy] = useState<OccupancyPoint[]>([]);
  const [demographics, setDemographics] = useState<DemographicPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [apiState, setApiState] = useState<"loading" | "connected" | "error">("loading");
  const [error, setError] = useState("");
  const [simulationState, setSimulationState] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [simulationMessage, setSimulationMessage] = useState("");

  const pieData = useMemo(() => {
    const totals = demographics.reduce((sum, point) => ({ male: sum.male + point.male, female: sum.female + point.female }), { male: 0, female: 0 });
    return [{ name: "Male", value: totals.male }, { name: "Female", value: totals.female }];
  }, [demographics]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sites = await fetchSites();
        const siteId = sites[0]?.siteId;
        if (!siteId) throw new Error("No sites are available for this account.");
        const trendQuery = { siteId, ...getAnalyticsRange() };
        const todayQuery = { siteId, ...getTodayRange(sites[0].timezone) };
        const previousDayQuery = { siteId, fromUtc: todayQuery.fromUtc - (todayQuery.toUtc - todayQuery.fromUtc), toUtc: todayQuery.fromUtc };
        // A temporarily unavailable chart must not hide the rest of the dashboard.
        const results = await Promise.allSettled([
          fetchDwell(todayQuery),
          fetchFootfall(todayQuery),
          fetchOccupancy(trendQuery),
          fetchDemographics(trendQuery),
          fetchDwell(previousDayQuery),
          fetchFootfall(previousDayQuery),
          fetchOccupancy(previousDayQuery),
        ]);
        if (!active) return;
        const value = (index: number) => results[index].status === "fulfilled" ? results[index].value : undefined;
        const dwell = value(0);
        const footfall = value(1);
        const occupancyResult = value(2);
        const demographicsResult = value(3);
        const previousDwell = value(4);
        const previousFootfall = value(5);
        const previousOccupancy = value(6);
        const occupancyBuckets = Array.isArray(occupancyResult?.buckets) ? occupancyResult.buckets : [];
        const demographicBuckets = Array.isArray(demographicsResult?.buckets) ? demographicsResult.buckets : [];
        const latestOccupancy = Number(occupancyBuckets.at(-1)?.avg);
        const previousBuckets = Array.isArray(previousOccupancy?.buckets) ? previousOccupancy.buckets : [];
        const previousLatestOccupancy = Number(previousBuckets.at(-1)?.avg);
        setMetrics({
          dwell: typeof dwell?.avgDwellMinutes === "number" ? `${dwell.avgDwellMinutes} min` : "—",
          footfall: typeof footfall?.footfall === "number" ? footfall.footfall.toLocaleString() : "—",
          occupancy: Number.isFinite(latestOccupancy) ? String(Math.round(latestOccupancy)) : "—",
          dwellTrend: comparison(dwell?.avgDwellMinutes, previousDwell?.avgDwellMinutes),
          footfallTrend: comparison(footfall?.footfall, previousFootfall?.footfall),
          occupancyTrend: comparison(latestOccupancy, previousLatestOccupancy),
        });
        setOccupancy(occupancyBuckets.map((bucket: { local?: string; avg?: number }) => ({ time: bucket.local ?? "—", count: Number(bucket.avg ?? 0) })));
        setDemographics(demographicBuckets.map((bucket: { local?: string; male?: number; female?: number }) => ({ time: bucket.local ?? "—", male: Number(bucket.male ?? 0), female: Number(bucket.female ?? 0) })));
        const failedCharts = [
          results[2].status === "rejected" ? "occupancy chart" : "",
          results[3].status === "rejected" ? "demographics chart" : "",
        ].filter(Boolean);
        setError(failedCharts.length ? `Unable to load the ${failedCharts.join(" and ")}. Other available metrics are shown.` : "");
        setApiState("connected");
      } catch (loadError) {
        if (!active) return;
        setApiState("error");
        setError(loadError instanceof Error ? loadError.message : "Unable to load analytics from the API.");
      }
    }
    void load();
    const socket = connectCrowdSocket((eventName, payload) => {
      const event = payload as { ts?: number; action?: string; type?: string; direction?: string; zoneName?: string; zone?: string; site?: string; siteName?: string; severity?: string; occupancy?: number; count?: number; siteOccupancy?: number };
      if (eventName === "alert") {
        const zone = event.zoneName ?? event.zone;
        const site = event.siteName ?? event.site;
        const text = `${event.direction ?? event.action ?? event.type ?? "Crowd activity"}${zone ? ` · ${zone}` : ""}${site ? ` · ${site}` : ""}`;
        setAlerts((previous) => [{ id: `${Date.now()}-${Math.random()}`, text, severity: event.severity ?? "info", time: new Date().toLocaleTimeString() }, ...previous].slice(0, 8));
      }
      const count = event.siteOccupancy ?? event.occupancy ?? event.count;
      if (typeof count === "number") {
        setMetrics((current) => ({ ...current, occupancy: String(count) }));
        setOccupancy((previous) => [...previous.slice(-23), { time: new Date(event.ts ?? Date.now()).toLocaleTimeString(), count }]);
      }
    });
    return () => { active = false; socket.disconnect(); disconnectCrowdSocket(); };
  }, []);

  async function handleStartSimulation() {
    setSimulationState("starting");
    setSimulationMessage("");
    try {
      const result = await startSimulation();
      setSimulationState("running");
      setSimulationMessage(result?.message || "Live occupancy simulation is running.");
    } catch (startError) {
      const status = typeof startError === "object" && startError && "response" in startError
        ? (startError.response as { status?: number }).status
        : undefined;
      if (status === 409) {
        setSimulationState("running");
        setSimulationMessage("Live occupancy simulation is already running.");
        return;
      }
      setSimulationState("error");
      setSimulationMessage(status === 401 ? "Your session has expired. Please sign in again." : "Unable to start the live simulation.");
    }
  }

  async function handleStopSimulation() {
    setSimulationState("starting");
    setSimulationMessage("");
    try {
      const result = await stopSimulation();
      setSimulationState("idle");
      setSimulationMessage(result?.message || "Live occupancy simulation has stopped.");
    } catch (stopError) {
      const status = typeof stopError === "object" && stopError && "response" in stopError
        ? (stopError.response as { status?: number }).status
        : undefined;
      if (status === 409) {
        setSimulationState("idle");
        setSimulationMessage("Live occupancy simulation is not running.");
        return;
      }
      setSimulationState("error");
      setSimulationMessage(status === 401 ? "Your session has expired. Please sign in again." : "Unable to stop the live simulation.");
    }
  }

  return <div className="page-content">
    <div className="page-intro"><div><h2>Venue Overview</h2><p>Track occupancy, visitor trends and crowd activity.</p></div><div className="dashboard-actions"><button className={`simulation-button ${simulationState === "running" ? "simulation-stop" : ""}`} type="button" onClick={simulationState === "running" ? handleStopSimulation : handleStartSimulation} disabled={simulationState === "starting"}>{simulationState === "starting" ? "Updating…" : simulationState === "running" ? "Stop simulation" : "Start live simulation"}</button><span className={`status-pill ${apiState === "connected" ? "status-live" : ""}`}><span className="status-dot" />{apiState === "connected" ? "Connected" : apiState === "loading" ? "Loading analytics" : "API unavailable"}</span></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {simulationMessage && <p className={simulationState === "error" ? "form-error" : "simulation-message"} role="status">{simulationMessage}</p>}
    <section className="stats-grid"><StatCard title="Live Occupancy" value={metrics.occupancy} note="People currently inside" trend={metrics.occupancyTrend} icon={Users} color="blue" /><StatCard title="Today's Footfall" value={metrics.footfall} note="Visitors today" trend={metrics.footfallTrend} icon={Footprints} color="purple" /><StatCard title="Average Dwell Time" value={metrics.dwell} note="Average visit duration" trend={metrics.dwellTrend} icon={Clock3} color="orange" /></section>
    <section className="charts-grid">
      <article className="panel"><div className="panel-heading"><div><h3>Occupancy Trends</h3><p>Visitor count throughout the day</p></div><Activity size={21} /></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={occupancy}><defs><linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f7cff" stopOpacity={0.3} /><stop offset="95%" stopColor="#4f7cff" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" /><XAxis dataKey="time" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Area type="monotone" dataKey="count" name="Occupancy" stroke="#4f7cff" fill="url(#occupancyGradient)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div></article>
      <article className="panel"><div className="panel-heading"><div><h3>Demographics</h3><p>Visitor distribution</p></div><Users size={21} /></div><div className="donut-area"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={4}><Cell fill="#4f7cff" /><Cell fill="#a78bfa" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="legend"><span><i className="legend-blue" /> Male: {pieData[0].value}</span><span><i className="legend-purple" /> Female: {pieData[1].value}</span></div></article>
    </section>
    <section className="panel demographics-timeline"><div className="panel-heading"><div><h3>Demographics Over Time</h3><p>Male and female visitor trend</p></div><Activity size={21} /></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><LineChart data={demographics}><CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" /><XAxis dataKey="time" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="male" stroke="#4f7cff" strokeWidth={2} /><Line type="monotone" dataKey="female" stroke="#a78bfa" strokeWidth={2} /></LineChart></ResponsiveContainer></div></section>
    <section className="panel alerts-panel"><div className="panel-heading"><div><h3>Recent Crowd Alerts</h3><p>Live entry/exit and occupancy events</p></div><BellRing size={21} /></div>{alerts.length ? <div className="alerts-list">{alerts.map((alert) => <div className="alert-row" key={alert.id}><span className={`alert-indicator ${alert.severity.toLowerCase()}`} /><div><strong>{alert.text}</strong><span>{alert.time} · {alert.severity}</span></div></div>)}</div> : <div className="empty-alerts"><RefreshCw size={25} /><p>Waiting for live crowd events...</p></div>}</section>
  </div>;
}
