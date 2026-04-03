/**
 * StockAnalysisApp — A/H/US Stock Tracker adapter.
 */
import type { AgentAppAdapter } from './types';
import { registerApp } from './types';
import { socket } from '../../services/socket';

/** Extract valid tickers (allow digits for A-share codes like 600519) */
function extractTickers(query: string): string[] {
  return query.split(',')
    .map(t => t.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase())
    .filter(t => t.length >= 1 && t.length <= 8);
}

const StockAnalysisApp: AgentAppAdapter = {
  id: 'stockanalysis',
  name: 'A/H/US Stock Tracker',
  supportedModes: ['auto', 'fast', 'collaborate', 'roundtable'],
  accentColor: 'red',
  socketPrefix: 'agent:stockanalysis',
  runningLabel: 'Stock Analysis gathering data...',
  doneLabel: 'Analysis complete',
  initLabel: 'Initializing stock analysis module...',

  canHandle(query: string): boolean {
    return extractTickers(query).length > 0;
  },

  start({ query, sessionId }) {
    const tickers = extractTickers(query);

    socket.emit('agent:stockanalysis', {
      tickers,
      sessionId,
    });

    window.dispatchEvent(new CustomEvent('session-started', {
      detail: { id: sessionId, title: `Stock Analysis: ${tickers.join(', ')}`, agentId: 'stockanalysis' },
    }));
  },

  formatUserMessage(query: string): string {
    const tickers = extractTickers(query);
    return tickers.length > 0
      ? `Analyze ${tickers.join(', ')} using A/H/US Stock Tracker`
      : query;
  },
};

registerApp(StockAnalysisApp);
export default StockAnalysisApp;

