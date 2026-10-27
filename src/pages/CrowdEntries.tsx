import { useEffect, useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { fetchEntries, fetchSites, getTodayRange } from "../services/api";

type Entry = { id: string; visitorName: string; gender: string; zoneName: string; severity: string; entryTime: string; exitTime: string; dwellTime: string };

function formatTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export default function CrowdEntries() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [searchParams] = useSearchParams();
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const sites = await fetchSites();
        const siteId = sites[0]?.siteId;
        if (!siteId) throw new Error("No sites are available for this account.");
        // Match the dashboard's calendar-day range in the site's timezone.
        // A rolling 24-hour window can span two local days and miss records.
        const response = await fetchEntries({ siteId, ...getTodayRange(sites[0].timezone) }, page, pageSize);
        if (!active) return;
        const records = Array.isArray(response?.records) ? response.records : [];
        setRows(records.map((item: { personId?: string; personName?: string; gender?: string; zoneName?: string; severity?: string; entryLocal?: string; exitLocal?: string | null; dwellMinutes?: number | null }, index: number) => ({
          id: String(item.personId ?? `${page}-${index}`),
          visitorName: item.personName ?? "—",
          gender: item.gender ?? "—",
          zoneName: item.zoneName ?? "—",
          severity: item.severity ?? "—",
          entryTime: formatTime(item.entryLocal),
          exitTime: formatTime(item.exitLocal),
          dwellTime: typeof item.dwellMinutes === "number" ? `${item.dwellMinutes} min` : "—",
        })));
        setTotalPages(Math.max(1, Number(response?.totalPages ?? 1)));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load visitor records.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [page, pageSize]);

  const visibleRows = search ? rows.filter((row) => `${row.visitorName} ${row.gender} ${row.zoneName} ${row.severity}`.toLowerCase().includes(search)) : rows;

  return <div className="page-content">
    <div className="page-intro"><div><h2>Visitor Entry & Exit Records</h2><p>Review visitor movements and dwell duration.</p></div></div>
    <section className="panel entries-panel">
      <div className="panel-heading"><div><h3>All Entries</h3><p>Page {page} · {visibleRows.length} records shown{search ? ` for “${searchParams.get("search") ?? ""}”` : ""}</p></div><Users size={21} /></div>
      {error && <p className="form-error entries-error" role="alert">{error}</p>}
      <div className="table-scroll"><table><thead><tr><th>Visitor</th><th>Gender</th><th>Zone</th><th>Severity</th><th>Entry Time</th><th>Exit Time</th><th>Dwell Time</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="empty-table"><RefreshCw size={18} /> Loading visitor records...</td></tr> : visibleRows.length ? visibleRows.map((row) => <tr key={row.id}><td>{row.visitorName}</td><td>{row.gender}</td><td>{row.zoneName}</td><td>{row.severity}</td><td>{row.entryTime}</td><td>{row.exitTime}</td><td>{row.dwellTime}</td></tr>) : <tr><td colSpan={7} className="empty-table">{search ? "No matching visitor records found on this page." : "No visitor records found for the selected time range."}</td></tr>}</tbody></table></div>
      <div className="pagination"><span>Page {page} of {totalPages}</span><div><button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
    </section>
  </div>;
}
