import { TrendingUp, TrendingDown } from "lucide-react";

export function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 flex items-center gap-1">
        {tone === "positive" && <TrendingUp size={16} className="text-emerald-600" />}
        {tone === "negative" && <TrendingDown size={16} className="text-rose-600" />}
        <p
          className={`text-sm font-medium ${
            tone === "negative"
              ? "text-rose-700"
              : tone === "positive"
              ? "text-emerald-700"
              : "text-gray-900"
          }`}
        >
          {value}
        </p>
        {hint && <span className="text-xs text-gray-400 ml-1">({hint})</span>}
      </div>
    </div>
  );
}
