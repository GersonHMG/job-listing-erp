import React, { useEffect, useState } from "react";
import { formatNumberCL, parseNumber, isoToDMY, dmyToISO } from "../utils";

export function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange?: (pretty: string, num: number) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState<string>(value ? formatNumberCL(parseNumber(value)) : "");

  useEffect(() => {
    setDisplay(value ? formatNumberCL(parseNumber(value)) : "");
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,.]/g, "");
    const num = parseNumber(raw);
    const pretty = formatNumberCL(num);
    setDisplay(pretty);
    onChange?.(pretty, num);
  };

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
      <input
        value={display}
        onChange={handle}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-full rounded-xl border border-gray-200 pl-6 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">CLP</span>
    </div>
  );
}

export function DateDMYInput({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
}: {
  value?: string;
  onChange?: (iso: string) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState<string>(value ? isoToDMY(value) : "");

  useEffect(() => {
    setDisplay(value ? isoToDMY(value) : "");
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d/]/g, "");
    setDisplay(raw);
    const iso = dmyToISO(raw);
    if (iso) onChange?.(iso);
  };

  return (
    <input
      value={display}
      onChange={handle}
      placeholder={placeholder}
      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
    />
  );
}
