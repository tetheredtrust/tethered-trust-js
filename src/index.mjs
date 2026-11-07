// Tethered Trust client for JavaScript/TypeScript, version 0.51.2. No dependencies.
// Node 18+:  curl -O https://tetheredtrust.com/sdk/tethered-trust.mjs   then   import { TetheredTrust } from "./tethered-trust.mjs";
//            (Node can't import from an https:// URL by default.)
// Deno and browsers:  import { TetheredTrust } from "https://tetheredtrust.com/sdk/tethered-trust.mjs";
// Usage:
//   const tt = new TetheredTrust({ sandbox: true });                  // sandbox: free, never charged
//   const plan = await tt.validatePlan({ setup: ["Lenovo ThinkPad T480"], purchase: [{ text: "Crucial CT16G4SFRA32A", quantity: 2 }] });
//   if (plan.decision === "insufficient_evidence") console.log(plan.questions);
export class TetheredTrustError extends Error {
  constructor(status, body) { super(body?.error || `HTTP ${status}`); this.status = status; this.body = body; this.code = body?.code; this.retryable = Boolean(body?.retryable); this.retryAfterSeconds = body?.retry_after_seconds ?? null; }
}
// Every MCP tool, as [method, path]. call(name, args) reaches any of them.
export const TOOLS = {"how_it_works":["GET","/how-it-works"],"list_coverage":["GET","/coverage"],"check_cart_before_checkout":["POST","/checkout/check"],"enrich_catalog":["POST","/enrich"],"identify_product":["POST","/identify"],"list_standards":["GET","/standards"],"resolve_product":["GET","/resolve"],"validate_purchase_plan":["POST","/plan"],"fix_purchase_plan":["POST","/plan/fix"],"plan_upgrade":["POST","/upgrades"],"identify_from_photo":["POST","/identify/photo"],"recheck_plan":["POST","/plans/recheck"],"check_batch":["POST","/check/batch"],"check_compatibility":["POST","/check"],"find_parts":["POST","/parts"],"check_recalls":["POST","/recalls"],"verify_page":["POST","/verify"],"verify_mcp":["POST","/verify/mcp"],"watch_decision":["POST","/watch"],"attach_order":["POST","/receipts/attach"],"dispute_packet":["POST","/packet"],"file_claim":["POST","/claims"],"decision_status":["POST","/watch/status"],"check_fit":["POST","/fit"],"verify_receipt":["POST","/receipts/verify"],"report_outcome":["POST","/outcome"]};
export class TetheredTrust {
  constructor({ apiKey = null, baseUrl = "https://tetheredtrust.com", sandbox = false, fetch: f = globalThis.fetch, timeoutMs = 30000, retries = 1 } = {}) {
    this.apiKey = apiKey; this.root = baseUrl.replace(/\/+$/, "") + (sandbox ? "/v1/sandbox" : "/v1"); this.fetch = f; this.timeoutMs = timeoutMs; this.retries = retries;
  }
  /** Any tool by its MCP name, e.g. call("check_cart_before_checkout", { owned, line_items }). */
  call(tool, args = {}) {
    const t = TOOLS[tool];
    if (!t) throw new Error(`Unknown tool ${tool}`);
    if (t[0] === "GET") return this.request("GET", t[1] + (Object.keys(args).length ? "?" + new URLSearchParams(args) : ""));
    return this.request("POST", t[1], args);
  }
  /** Retries once on retryable errors (429, 503, 5xx), honoring retry_after_seconds up to 10 s. Never retries 402. */
  async request(method, path, body, attempt = 0) {
    const res = await this.fetch(this.root + path, { method, headers: { "Content-Type": "application/json", ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(this.timeoutMs) });
    const data = await res.json().catch(() => ({ error: "Unexpected response" }));
    if (!res.ok) {
      const err = new TetheredTrustError(res.status, data);
      if (err.retryable && res.status !== 402 && attempt < this.retries) {
        await new Promise((r) => setTimeout(r, Math.min(10, err.retryAfterSeconds ?? 2) * 1000));
        return this.request(method, path, body, attempt + 1);
      }
      throw err;
    }
    return data;
  }
  /** Whole setup + cart. Returns { decision, results, system_checks, required_accessories, substitutions, questions, receipt, plan_id }. */
  validatePlan(plan) { return this.request("POST", "/plan", plan); }
  recheckPlan(planId) { return this.request("POST", "/plans/recheck", { plan_id: planId }); }
  getPlan(planId) { return this.request("GET", `/plans/${encodeURIComponent(planId)}`); }
  check(existing, candidate, extra = {}) { return this.request("POST", "/check", { existing, candidate, ...extra }); }
  checkBatch(checks) { return this.request("POST", "/check/batch", { checks }); }
  findParts(model, partType) { return this.request("POST", "/parts", { model, part_type: partType }); }
  resolve(query) { return this.request("GET", `/resolve?query=${encodeURIComponent(query)}`); }
  suggest(q, role = "any") { return this.request("GET", `/suggest?q=${encodeURIComponent(q)}&role=${role}`); }
  verifyReceipt(jwsOrId) { return this.request("POST", "/receipts/verify", String(jwsOrId).startsWith("rcpt_") ? { receipt_id: jwsOrId } : { jws: jwsOrId }); }
  reportOutcome(checkId, outcome, evidence) { return this.request("POST", "/outcome", { check_id: checkId, outcome, evidence }); }
  usage() { return this.request("GET", "/usage"); }
  checkCart(input) { return this.request("POST", "/checkout/check", input); }
  identify(product, extra = {}) { return this.request("POST", "/identify", { product, ...extra }); }
  standards() { return this.request("GET", "/standards"); }
  upgrades(model, goal) { return this.request("POST", "/upgrades", { model, goal }); }
  fixPlan(plan) { return this.request("POST", "/plan/fix", plan); }
  fit(input) { return this.request("POST", "/fit", input); }
  enrich(items, extra = {}) { return this.request("POST", "/enrich", { items, ...extra }); }
  identifyPhoto(input) { return this.request("POST", "/identify/photo", input); }
  coverage(category) { return this.request("GET", "/coverage" + (category ? "?category=" + encodeURIComponent(category) : "")); }
  webhooks() { return this.request("GET", "/webhooks/list"); }
  createWebhook(url, events) { return this.request("POST", "/webhooks", { url, events }); }
  deleteWebhook(id) { return this.request("POST", "/webhooks/delete", { id }); }
}
export default TetheredTrust;
