# tethered-trust

Fit, compatibility and recall checks for AI agents **before they buy**: "will this SSD work in my PS5?", "does this charger work with my laptop?", "is this cart safe to check out?". Every answer is a decision (`supported`, `conditional`, `incompatible`, `insufficient_evidence`) with the rules checked, manufacturer sources and a signed receipt.

- Zero dependencies, Node 18+, Deno, Bun and browsers
- Ready-made tool definitions for OpenAI, Anthropic and the Vercel AI SDK
- Same tools as the [Tethered Trust MCP server](https://tetheredtrust.com/agents) (`https://tetheredtrust.com/mcp`)

```sh
npm install tethered-trust
```

## Quick start

```js
import { TetheredTrust } from "tethered-trust";

const tt = new TetheredTrust({ sandbox: true }); // sandbox: free, never charged

const cart = await tt.checkCart({
  owned: ["Nintendo Switch 2"],
  line_items: [{ id: "li_1", title: "SanDisk microSD Express card 256GB", quantity: 1 }],
});

if (cart.safe_to_checkout) {
  // place the order, then link the receipt to it (free):
  await tt.call("attach_order", { receipt_id: cart.receipt.id, order_id: "112-5550001" });
} else {
  console.log(cart.action, cart.questions, cart.required_accessories);
}
```

Drop `sandbox: true` for live answers. Without a key you get a small free daily allowance; after that, add an API key with prepaid credits (`apiKey: "tt_..."`, buy at [tetheredtrust.com/credits](https://tetheredtrust.com/credits)) or pay per answer in USDC with [x402](https://tetheredtrust.com/pricing).

## Give the tools to your model

### OpenAI

```js
import OpenAI from "openai";
import { TetheredTrust } from "tethered-trust";
import { toOpenAITools, runTool, SHOPPING_TOOLS } from "tethered-trust/tools";

const tt = new TetheredTrust({ apiKey: process.env.TETHERED_TRUST_KEY });
const openai = new OpenAI();
const messages = [{ role: "user", content: "Will a Samsung 990 PRO with heatsink work in my PS5 Pro?" }];
const res = await openai.chat.completions.create({ model: "gpt-4.1", messages, tools: toOpenAITools(SHOPPING_TOOLS) });
for (const call of res.choices[0].message.tool_calls ?? []) {
  const result = await runTool(tt, call.function.name, call.function.arguments);
  // send result back as a { role: "tool", tool_call_id: call.id, content: JSON.stringify(result) } message
}
```

### Anthropic

```js
import Anthropic from "@anthropic-ai/sdk";
import { toAnthropicTools, runTool, SHOPPING_TOOLS } from "tethered-trust/tools";

const msg = await new Anthropic().messages.create({
  model: "claude-sonnet-4-5", max_tokens: 1024, tools: toAnthropicTools(SHOPPING_TOOLS),
  messages: [{ role: "user", content: "Is this TV mount OK for my LG OLED65C5PUA? Sanus VLT7" }],
});
for (const block of msg.content) if (block.type === "tool_use") console.log(await runTool(null, block.name, block.input));
```

Or skip the code: Claude, ChatGPT, Cursor and VS Code can connect to the MCP server directly. See [tetheredtrust.com/agents](https://tetheredtrust.com/agents).

### Vercel AI SDK

```js
import { tool, jsonSchema } from "ai";
import { TetheredTrust } from "tethered-trust";
import { toolDefinitions, SHOPPING_TOOLS } from "tethered-trust/tools";

const tt = new TetheredTrust();
export const tetheredTrustTools = Object.fromEntries(
  toolDefinitions.filter((t) => SHOPPING_TOOLS.includes(t.name)).map((t) => [
    t.name,
    tool({ description: t.description, inputSchema: jsonSchema(t.input_schema), execute: (args) => tt.call(t.name, args) }),
  ]),
);
```

## What to do with the answer

| `decision` | Do this |
|---|---|
| `supported` | Proceed; relay any caveats. |
| `conditional` | Proceed only once every item in `conditions` is met (add the adapter, confirm firmware). |
| `incompatible` | Don't buy. Use `substitutions` or `fix_purchase_plan`. |
| `insufficient_evidence` | Ask the person the returned `questions`, then check again. |

Carts of $500 or more come back with a `high_value` notice. Keep the `receipt`; after ordering, `attach_order` turns it into a [Decision Record](https://tetheredtrust.com/spec/decision-record). If an answer was wrong, `file_claim` within 60 days refunds the fee ([claims](https://tetheredtrust.com/claims)).

## Links

- Docs and MCP setup: https://tetheredtrust.com/agents
- API description: https://tetheredtrust.com/v1 · OpenAPI: https://tetheredtrust.com/openapi.json
- Pricing: https://tetheredtrust.com/pricing · Terms: https://tetheredtrust.com/api-terms

Answers are informational; confirm with the manufacturer before buying. MIT licensed. © Chimes In LLC.
