/**
 * HedgeFundApp — AI Hedge Fund adapter.
 * Encapsulates all hedge-fund-specific socket logic and formatting.
 */
import type { AgentAppAdapter } from './types';
import { registerApp } from './types';
import { socket } from '../../services/socket';

const HedgeFundApp: AgentAppAdapter = {
  id: 'hedgefund',
  name: 'AI Hedge Fund',
  supportedModes: [], // Ignores mode
  accentColor: 'emerald',
  socketPrefix: 'agent:hedgefund',
  runningLabel: 'Hedge Fund agents analyzing...',
  doneLabel: 'Analysis complete',
  initLabel: 'Initializing execution layer...',

  start({ query, sessionId }) {
    // Extract tickers: split by comma, remove non-alpha chars like " — Social Media"
    const tickers = query.split(',')
      .map(t => t.replace(/[^A-Za-z]/g, '').trim().toUpperCase())
      .filter(Boolean);

    socket.emit('agent:hedgefund', {
      tickers,
      sessionId,
      showReasoning: true,
    });

    window.dispatchEvent(new CustomEvent('session-started', {
      detail: { id: sessionId, title: `AI Hedge Fund: ${tickers.join(', ')}`, agentId: 'hedgefund' },
    }));
  },

  formatUserMessage(query: string): string {
    const tickers = query.split(',')
      .map(t => t.replace(/[^A-Za-z]/g, '').trim().toUpperCase())
      .filter(Boolean);
    return `Analyze ${tickers.join(', ')} using AI Hedge Fund`;
  },
};

registerApp(HedgeFundApp);
export default HedgeFundApp;
