/**
 * Frontend API client for communicating with the backend server.
 */

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = sessionStorage.getItem('loka_token');
  }

  setToken(token: string) {
    this.token = token;
    sessionStorage.setItem('loka_token', token);
  }

  clearToken() {
    this.token = null;
    sessionStorage.removeItem('loka_token');
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // ============ Auth ============

  async loginEmail(email: string, name?: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/login/email', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    this.setToken(result.token);
    return result;
  }

  async loginOAuth(provider: string, providerId: string, email?: string, name?: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/login/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider, providerId, email, name }),
    });
    this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async acceptRisk() {
    return this.request('/auth/accept-risk', { method: 'POST' });
  }

  // ============ Projects ============

  async getProjects(filters?: { category?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return this.request<any[]>(`/projects${qs ? `?${qs}` : ''}`);
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${encodeURIComponent(id)}`);
  }

  async investInProject(projectId: string, amount: number) {
    return this.request<any>(`/projects/${encodeURIComponent(projectId)}/invest`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async revokeInvestment(projectId: string) {
    return this.request<any>(`/projects/${encodeURIComponent(projectId)}/revoke-investment`, {
      method: 'DELETE',
    });
  }

  // ============ Treasury ============

  async getTreasuryStats() {
    return this.request<any>('/treasury/stats');
  }

  // ============ Portfolio ============

  async getHoldings() {
    return this.request<any[]>('/portfolio/holdings');
  }

  async getHistory() {
    return this.request<any[]>('/portfolio/history');
  }

  async getInvestments() {
    return this.request<any[]>('/portfolio/investments');
  }

  // ============ Trading ============

  async getTradeOrders(filters?: { projectId?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return this.request<any[]>(`/trade${qs ? `?${qs}` : ''}`);
  }

  async createTradeOrder(data: { projectId: string; listPrice: number; shares: number }) {
    return this.request<any>('/trade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async buyTradeOrder(orderId: string) {
    return this.request<any>(`/trade/${encodeURIComponent(orderId)}/buy`, {
      method: 'POST',
    });
  }

  // ============ Mint / Redeem ============

  async mintAIUSD(amount: number) {
    return this.request<any>('/portfolio/mint', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async redeemAIUSD(amount: number) {
    return this.request<any>('/portfolio/redeem', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async swapToken(data: { token: string; tokenSymbol: string; action: 'buy' | 'sell'; amount: number; amountType?: 'token' | 'usd'; estimatedUSD?: number; chain?: string }) {
    return this.request<{
      transaction: any;
      action: string;
      token: string;
      tokenAmount: number;
      pricePerToken: number;
      totalUSD: number;
      slippage: number;
      gasFee: number;
      chain: string;
    }>('/portfolio/swap', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ Chat / AI ============

  async getChatHistory(from?: string, to?: string, sessionId?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (sessionId) params.set('sessionId', sessionId);
    const qs = params.toString();
    return this.request<any[]>(`/chat/history${qs ? `?${qs}` : ''}`);
  }

  async getConversations() {
    return this.request<{ id: string; title: string; time: string; messageCount: number; firstMessageAt: string; lastMessageAt: string }[]>('/chat/conversations');
  }

  async sendChatMessage(content: string, agentId?: string) {
    return this.request<{ userMessage: any; assistantMessage: any }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content, agentId }),
    });
  }

  async clearChatHistory() {
    return this.request('/chat/history', { method: 'DELETE' });
  }

  async deleteConversation(sessionId: string) {
    return this.request(`/chat/conversations/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  }

  // ============ Groups ============

  async getGroups() {
    return this.request<any[]>('/groups');
  }

  async getGroupMessages(groupId: string, cursor?: string, limit = 50) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.request<{ messages: any[]; nextCursor: string | null; hasMore: boolean }>(
      `/groups/${encodeURIComponent(groupId)}/messages?${params}`
    );
  }

  async sendGroupMessage(groupId: string, content: string) {
    return this.request<any>(`/groups/${encodeURIComponent(groupId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteGroupMessage(groupId: string, messageId: string) {
    return this.request<any>(`/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
    });
  }

  async joinGroup(groupId: string) {
    return this.request<any>(`/groups/${encodeURIComponent(groupId)}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: string) {
    return this.request<any>(`/groups/${encodeURIComponent(groupId)}/leave`, {
      method: 'POST',
    });
  }

  async getGroupMembers(groupId: string) {
    return this.request<any[]>(`/groups/${encodeURIComponent(groupId)}/members`);
  }

  // ============ User ============

  async getUserProfile() {
    return this.request<any>('/users/profile');
  }

  async updateProfile(data: { name?: string; avatar?: string; walletAddress?: string }) {
    return this.request<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ Credit Score ============

  async getCreditScore() {
    return this.request<any>('/credit/score');
  }

  async getCreditHistory() {
    return this.request<any[]>('/credit/history');
  }

  async getCreditEvents() {
    return this.request<any[]>('/credit/events');
  }

  // ============ Enterprise / Apply ============

  async submitEnterprise(data: { companyName: string; country: string; registrationNo?: string }) {
    return this.request<any>('/apply/enterprise/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEnterprises() {
    return this.request<any[]>('/apply/enterprise');
  }

  async advanceEnterprise(id: string) {
    return this.request<any>(`/apply/enterprise/${encodeURIComponent(id)}/advance`, {
      method: 'POST',
    });
  }

  async submitApplication(data: {
    enterpriseId: string; projectName: string; category: string;
    monthlyRevenue: number; requestedAmount: number; proposedApy: number;
    durationDays: number; description?: string; collateralType?: string;
    collateralValue?: number; revenueSource?: string;
  }) {
    return this.request<any>('/apply/projects/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApplications() {
    return this.request<any[]>('/apply/projects/applications');
  }

  // ============ Governance ============

  async getProposals() {
    return this.request<any[]>('/governance/proposals');
  }

  async createProposal(data: { title: string; description: string; category: string; durationDays?: number }) {
    return this.request<any>('/governance/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteOnProposal(proposalId: string, vote: 'for' | 'against') {
    return this.request<any>(`/governance/proposals/${encodeURIComponent(proposalId)}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  }

  // ============ Repayment ============

  async getRepaymentSchedule(projectId: string) {
    return this.request<any[]>(`/repayment/${encodeURIComponent(projectId)}/schedule`);
  }

  // ============ Liquidation ============

  async getCollateral(projectId: string) {
    return this.request<any[]>(`/liquidation/${encodeURIComponent(projectId)}/collateral`);
  }

  async getLiquidationEvents(projectId: string) {
    return this.request<any[]>(`/liquidation/${encodeURIComponent(projectId)}/events`);
  }

  async getLiquidationSummary(projectId: string) {
    return this.request<any>(`/liquidation/${encodeURIComponent(projectId)}/summary`);
  }
}

// Singleton instance
export const api = new ApiClient();
