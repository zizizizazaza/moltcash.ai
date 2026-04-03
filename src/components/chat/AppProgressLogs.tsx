/**
 * AppProgressLogs — Reusable progress log display for agent apps.
 * Used by HedgeFund, StockAnalysis, and similar log-streaming apps.
 * Replaces the duplicated log rendering in SuperAgentChat.
 */
import React from 'react';

interface AppProgressLogsProps {
  logs: string[];
  isRunning: boolean;
  /** Accent color for the spinner: 'blue' | 'emerald' | 'red' etc. */
  accentColor?: string;
  runningLabel?: string;
  doneLabel?: string;
  initLabel?: string;
}

const colorMap: Record<string, { spinnerBorder: string; textActive: string; headerBg: string; headerIcon: string }> = {
  blue:    { spinnerBorder: 'border-blue-500', textActive: 'text-blue-600', headerBg: 'bg-blue-100', headerIcon: 'text-blue-600' },
  emerald: { spinnerBorder: 'border-emerald-500', textActive: 'text-emerald-600', headerBg: 'bg-emerald-100', headerIcon: 'text-emerald-600' },
  red:     { spinnerBorder: 'border-red-500', textActive: 'text-red-600', headerBg: 'bg-red-100', headerIcon: 'text-red-600' },
};

const AppProgressLogs: React.FC<AppProgressLogsProps> = ({
  logs,
  isRunning,
  accentColor = 'blue',
  runningLabel = 'Agents analyzing...',
  doneLabel = 'Analysis complete',
  initLabel = 'Initializing execution layer...',
}) => {
  const c = colorMap[accentColor] || colorMap.blue;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        {isRunning ? (
          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className={`w-3.5 h-3.5 rounded-full ${c.headerBg} flex items-center justify-center`}>
            <svg className={`w-2 h-2 ${c.headerIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <span className="text-[11px] font-semibold text-gray-500">
          {isRunning ? runningLabel : doneLabel}
        </span>
      </div>
      <div className="pl-2 border-l-2 border-gray-100 ml-[7px] space-y-0.5 max-h-[350px] overflow-y-auto">
        {logs.length === 0 && isRunning && (
          <div className="flex items-center gap-1.5 py-0.5">
            <div className={`w-2.5 h-2.5 border ${c.spinnerBorder} border-t-transparent rounded-full animate-spin shrink-0`} />
            <span className={`text-[11px] ${c.textActive} font-bold`}>{initLabel}</span>
          </div>
        )}
        {logs.map((l, idx) => {
          const isLast = idx === logs.length - 1;
          const isDone = !isRunning || !isLast;
          const cleanLog = l.replace(/\x1b\[[0-9;]*m/g, '').trim();
          if (!cleanLog) return null;
          return (
            <div key={idx} className="flex items-center gap-1.5 py-0.5">
              {isDone ? (
                <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className={`w-2.5 h-2.5 border ${c.spinnerBorder} border-t-transparent rounded-full animate-spin shrink-0`} />
              )}
              <span className={`text-[11px] leading-snug break-words flex-1 ${isDone ? 'text-gray-600 font-medium' : `${c.textActive} font-bold`}`}>
                {cleanLog}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppProgressLogs;
