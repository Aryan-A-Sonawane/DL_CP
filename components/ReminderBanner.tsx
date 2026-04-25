import { AlertTriangle, Clock, Bell } from "lucide-react";

interface Props {
  daysToGo: number;
  cycleEnd: Date | string;
  uploadedThisCycle: boolean;
}

const offsets = [10, 7, 5, 3, 2, 1, 0];

export default function ReminderBanner({ daysToGo, cycleEnd, uploadedThisCycle }: Props) {
  if (uploadedThisCycle) return null;
  if (daysToGo > 0 && !offsets.includes(daysToGo)) return null;

  const tone =
    daysToGo <= 0 ? "danger" : daysToGo <= 3 ? "danger" : daysToGo <= 7 ? "warn" : "info";
  const Icon = daysToGo <= 0 ? AlertTriangle : daysToGo <= 3 ? AlertTriangle : Clock;

  const message =
    daysToGo < 0
      ? `Cycle ended ${Math.abs(daysToGo)} day${Math.abs(daysToGo) === 1 ? "" : "s"} ago — please upload the report.`
      : daysToGo === 0
        ? "Cycle ends today — upload the report before midnight."
        : daysToGo === 1
          ? "1 day to go — upload the productivity report tomorrow."
          : `${daysToGo} days to go — upload the productivity report by cycle end.`;

  return (
    <div className={`reminder-banner reminder-banner-${tone}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">{message}</p>
        <p className="text-xs opacity-80 mt-0.5 inline-flex items-center gap-1">
          <Bell size={11} />
          Cycle ends {new Date(cycleEnd).toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
}
