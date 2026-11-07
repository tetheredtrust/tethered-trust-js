import type { TetheredTrust } from "./index.js";
export interface ToolDefinition { name: string; description: string; input_schema: Record<string, any>; read_only: boolean; }
export declare const toolDefinitions: ToolDefinition[];
export declare const SHOPPING_TOOLS: string[];
export declare function toOpenAITools(names?: string[]): { type: "function"; function: { name: string; description: string; parameters: Record<string, any> } }[];
export declare function toAnthropicTools(names?: string[]): { name: string; description: string; input_schema: Record<string, any> }[];
export declare function runTool(client: TetheredTrust | null, name: string, args?: Record<string, any> | string): Promise<any>;
