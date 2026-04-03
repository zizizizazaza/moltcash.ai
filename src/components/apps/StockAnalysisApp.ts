/**
 * StockAnalysisApp — A/H/US Stock Tracker adapter.
 */
import type { AgentAppAdapter } from './types';
import { registerApp } from './types';
import { socket } from '../../services/socket';

const StockAnalysisApp: AgentAppAdapter = {
  id: 'stockanalysis',
  name: 'A/H/US Stock Tracker',
  supportedModes: [], // Ignores mode
  accentColor: 'red',
  socketPrefix: 'agent:stockanalysis',
  runningLabel: 'Stock Analysis gathering data...',
  doneLabel: 'Analysis complete',
  initLabel: 'Initializing stock analysis module...',

  start({ query, sessionId }) {
    const tickers = query.split(',')
      .map(t => t.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase())
      .filter(Boolean);

    socket.emit('agent:stockanalysis', {
      tickers,
      sessionId,
    });

    window.dispatchEvent(new CustomEvent('session-started', {
      detail: { id: sessionId, title: `Stock Analysis: ${tickers.join(', ')}`, agentId: 'stockanalysis' },
    }));
  },

  formatUserMessage(query: string): string {
    const tickers = query.split(',')
      .map(t => t.replace(/[^A-Za-z0-9]/g, '').trim().toUpperCase())
      .filter(Boolean);
    return `Analyze ${tickers.join(', ')} using A/H/US Stock Tracker`;
  },
};

registerApp(StockAnalysisApp);
export default StockAnalysisApp;
