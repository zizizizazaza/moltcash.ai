import { config } from '../config.js';

export interface ChatMessage {
  role: string;
  content: string;
  agentId?: string | null;
}

export interface AIResponse {
  content: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

const LOKA_SYSTEM_PROMPT = `You are Loka Agent — the AI assistant for the Loka AIUSD platform, a treasury-backed stablecoin and RWA (Real-World Asset) cash flow marketplace.

## Your Role
You help users navigate the Loka platform, analyze investment opportunities, execute transactions, and understand the AIUSD stablecoin ecosystem.

## Platform Knowledge
- **AIUSD** is a stablecoin backed by 90% US Treasury Bills + 10% high-yield AI/tech business receivables
- **Cash Flow Marketplace** lets investors fund real businesses (like Kickstarter but for cash flow notes)
- Projects are verified through Stripe/QuickBooks revenue APIs, KYC/AML, and smart contract escrow
- **SPV isolation** protects investor funds — even if an issuer goes bankrupt, assets are ring-fenced
- Secondary market allows P2P trading of funded positions

## Current Active Projects
1. AI Agent Marketplace (18.5% APY, $500k target, Compute)
2. Climapp.io Utility (14.2% APY, $300k target, SaaS)
3. Market Maker AI (22.0% APY, $800k target, Funded)
4. MEV Searcher Agent (25.5% APY, $400k target, Compute)
5. Copy Trading AI (16.8% APY, $350k target, SaaS)
6. Shopify Merchant Cluster X (8.9% APY, $200k target, E-commerce)
7. AWS Infrastructure Note (11.4% APY, $750k target, SaaS)

## Treasury Stats
- TVL: ~$128M
- Collateral Ratio: 104.2%
- Reserve: 90% T-Bills, 7% Liquidity, 3% Operations

## Capabilities
- Analyze project risk profiles, revenue data, and credit scores
- Help users buy/sell positions, mint/redeem AIUSD
- Compare yields across pools
- Explain terms (SPV, coverage ratio, seniority, etc.) in plain language
- Guide through KYC and verification flows

## Communication Style
- Professional but approachable, like a knowledgeable financial advisor
- Use data and numbers to back up analysis
- When discussing risk, be balanced — highlight both potential and concerns
- For transactions, always confirm details before execution
- Support both English and Chinese — respond in the language the user uses`;

export class LokaAIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.lokaAi.apiKey;
    this.baseUrl = config.lokaAi.baseUrl;
    this.model = config.lokaAi.model;
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  async chat(messages: ChatMessage[], agentId?: string): Promise<AIResponse> {
    if (!this.isConfigured) {
      return {
        content: '🔧 Loka AI is not yet configured. Please set LOKA_AI_API_KEY and LOKA_AI_BASE_URL in the server .env file.',
        agentId: agentId || 'system',
      };
    }

    // Build message array with system prompt
    const apiMessages = [
      { role: 'system', content: LOKA_SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: apiMessages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error (${response.status}):`, errorText);
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string; role?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return {
      content,
      agentId: agentId || 'loka-agent',
    };
  }

  /** Streaming chat — returns a ReadableStream for SSE */
  async chatStream(messages: ChatMessage[], agentId?: string): Promise<ReadableStream<Uint8Array>> {
    if (!this.isConfigured) {
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          const msg = '🔧 Loka AI is not yet configured.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
    }

    const apiMessages = [
      { role: 'system', content: LOKA_SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: apiMessages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    return response.body!;
  }
}
