/**
 * GoalMetric AI - Frontend API Client
 * Clean HTTP client communicating exclusively with backend API Gateway (/api/v1/*).
 * SECURITY: NEVER contains API keys or Supabase service_role keys.
 */

import { MatchFixture, PredictionResult, SubscriptionPlan, UserSession } from '../../types';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getHealth(): Promise<any> {
    const res = await fetch('/api/v1/health', { headers: this.getHeaders() });
    return res.json();
  }

  async getMatches(): Promise<{ data: MatchFixture[]; count: number; isDemoDataset: boolean }> {
    const res = await fetch('/api/v1/matches', { headers: this.getHeaders() });
    return res.json();
  }

  async getPredictionForMatch(matchId: string): Promise<{ data: PredictionResult; source: string }> {
    const res = await fetch(`/api/v1/predictions/match/${matchId}`, { headers: this.getHeaders() });
    return res.json();
  }

  async calculateCustomPrediction(payload: {
    homeTeam: any;
    awayTeam: any;
    odds?: any;
  }): Promise<{ data: PredictionResult; source: string }> {
    const res = await fetch('/api/v1/predictions/calculate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async getBacktestReport(): Promise<any> {
    const res = await fetch('/api/v1/predictions/backtest', { headers: this.getHeaders() });
    return res.json();
  }

  async calculateAdvancedPrediction(payload: {
    homeTeam: any;
    awayTeam: any;
    options?: any;
  }): Promise<any> {
    const res = await fetch('/api/v1/predictions/advanced-calculate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async getBillingPlans(): Promise<{ plans: SubscriptionPlan[]; currency: string; gateway: any }> {
    const res = await fetch('/api/v1/billing/plans', { headers: this.getHeaders() });
    return res.json();
  }

  async getSubscription(): Promise<{ subscription: any; plan: SubscriptionPlan; quota: any }> {
    const res = await fetch('/api/v1/billing/subscription', { headers: this.getHeaders() });
    return res.json();
  }

  async getTransactions(): Promise<{ transactions: any[] }> {
    const res = await fetch('/api/v1/billing/transactions', { headers: this.getHeaders() });
    return res.json();
  }

  async createCheckoutSession(planId: string, billingPeriod: 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    const res = await fetch('/api/v1/billing/checkout', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ planId, billingPeriod }),
    });
    return res.json();
  }

  async verifyCheckoutSession(payload: {
    sessionId: string;
    paymentMethodBrand?: string;
    paymentMethodLast4?: string;
    providedAmount?: number;
    providedCurrency?: string;
  }): Promise<any> {
    const res = await fetch('/api/v1/billing/verify-checkout', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async cancelSubscription(immediate: boolean = false): Promise<any> {
    const res = await fetch('/api/v1/billing/cancel', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ immediate }),
    });
    return res.json();
  }

  async reactivateSubscription(): Promise<any> {
    const res = await fetch('/api/v1/billing/reactivate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    return res.json();
  }

  async retryPayment(simulateSuccess: boolean = true): Promise<any> {
    const res = await fetch('/api/v1/billing/retry-payment', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ simulateSuccess }),
    });
    return res.json();
  }

  async simulateWebhook(payload: any): Promise<any> {
    const res = await fetch('/api/v1/billing/simulate-webhook', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async getWebhookAuditLog(): Promise<any> {
    const res = await fetch('/api/v1/billing/webhook-audit', { headers: this.getHeaders() });
    return res.json();
  }

  async exportQuantitativeAudit(): Promise<any> {
    const res = await fetch('/api/v1/predictions/export-audit', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Akses ditolak ke ekspor audit.');
    }
    return data;
  }

  async getCurrentUser(): Promise<{ user?: UserSession; isAuthenticated: boolean }> {
    const res = await fetch('/api/v1/auth/me', { headers: this.getHeaders() });
    return res.json();
  }

  async switchDemoRole(role: 'guest' | 'user' | 'admin'): Promise<{ token: string; user: UserSession; message: string }> {
    const res = await fetch('/api/v1/auth/switch-demo-role', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (data.token) {
      this.setToken(data.token);
    } else {
      this.setToken(null);
    }
    return data;
  }

  async getAdminStats(): Promise<any> {
    const res = await fetch('/api/v1/admin/stats', { headers: this.getHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Gagal mengakses resource admin');
    }
    return data;
  }
}

export const apiClient = new ApiClient();
