import type { LucideIcon } from "lucide-react";

type Props = { title: string; value: string; note: string; trend?: string; icon: LucideIcon; color: "blue" | "purple" | "orange" };

export default function StatCard({ title, value, note, trend, icon: Icon, color }: Props) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{title}</span><div className={`stat-icon ${color}`}><Icon size={21} /></div></div>
      <h3>{value}</h3>
      <p>{note}</p>
      {trend && <span className="stat-trend">{trend}</span>}
    </article>
  );
}
