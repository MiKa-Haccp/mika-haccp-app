'use client';
import React from "react";

type Props = {
  days: number;
  done: number[];                 // z. B. [1,2,5,...]
  onSelectDay?: (day: number) => void;
};

export default function MonthDots({ days = 30, done = [], onSelectDay }: Props) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: days }).map((_, i) => {
        const day = i + 1;
        const ok = done.includes(day);
        const dot = (
          <span className={`inline-block h-3 w-3 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
        );

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay?.(day)}
            className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 focus:outline-none focus:ring"
            title={`Tag ${day}`}
          >
            {dot}
            <span className="text-xs opacity-70">{day}</span>
          </button>
        );
      })}
    </div>
  );
}
