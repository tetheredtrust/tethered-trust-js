export interface TetheredTrustOptions { apiKey?: string | null; baseUrl?: string; sandbox?: boolean; fetch?: typeof fetch; timeoutMs?: number; retries?: number; }
export declare const TOOLS: Record<string, ["GET" | "POST", string]>;
export declare class TetheredTrustError extends Error { status: number; body: any; code?: string; retryable: boolean; retryAfterSeconds: number | null; }
export declare class TetheredTrust {
  constructor(options?: TetheredTrustOptions);
  /** Any tool by its MCP name, e.g. call("check_cart_before_checkout", { owned, line_items }). */
  call(tool: string, args?: Record<string, any>): Promise<any>;
  request(method: "GET" | "POST", path: string, body?: any): Promise<any>;
  validatePlan(plan: { setup: any[]; purchase: any[] }): Promise<any>;
  recheckPlan(planId: string): Promise<any>;
  getPlan(planId: string): Promise<any>;
  check(existing: string | object, candidate: string | object, extra?: object): Promise<any>;
  checkBatch(checks: any[]): Promise<any>;
  findParts(model: string, partType?: string): Promise<any>;
  resolve(query: string): Promise<any>;
  suggest(q: string, role?: string): Promise<any>;
  verifyReceipt(jwsOrId: string): Promise<any>;
  reportOutcome(checkId: string, outcome: string, evidence?: any): Promise<any>;
  usage(): Promise<any>;
  checkCart(input: object): Promise<any>;
  identify(product: string, extra?: object): Promise<any>;
  standards(): Promise<any>;
  upgrades(model: string, goal?: string): Promise<any>;
  fixPlan(plan: object): Promise<any>;
  fit(input: object): Promise<any>;
  enrich(items: any[], extra?: object): Promise<any>;
  identifyPhoto(input: object): Promise<any>;
  coverage(category?: string): Promise<any>;
  [method: string]: any;
}
