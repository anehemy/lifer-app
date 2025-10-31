import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveForgeApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const resolveOpenAIApiUrl = () => "https://api.openai.com/v1/chat/completions";

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function getCurrentProvider(): Promise<LLMProvider> {
  const db = await import('../db').then(m => m.getDb());
  const { globalSettings } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  let primaryProvider: LLMProvider = 'forge';
  
  if (db) {
    const primarySetting = await db.select().from(globalSettings).where(eq(globalSettings.settingKey, 'llm_primary_provider'));
    if (primarySetting.length > 0 && primarySetting[0].settingValue) {
      primaryProvider = primarySetting[0].settingValue as LLMProvider;
    }
  }
  
  return primaryProvider;
}

export async function invokeLLM(params: InvokeParams, retries = 3, delay = 1000): Promise<InvokeResult> {
  // Read provider settings from database
  const db = await import('../db').then(m => m.getDb());
  const { globalSettings } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  let primaryProvider: LLMProvider = 'forge';
  let fallbackProvider: LLMProvider | null = 'openai';
  
  if (db) {
    const primarySetting = await db.select().from(globalSettings).where(eq(globalSettings.settingKey, 'llm_primary_provider'));
    if (primarySetting.length > 0 && primarySetting[0].settingValue) {
      primaryProvider = primarySetting[0].settingValue as LLMProvider;
    }
    
    const fallbackSetting = await db.select().from(globalSettings).where(eq(globalSettings.settingKey, 'llm_fallback_provider'));
    if (fallbackSetting.length > 0 && fallbackSetting[0].settingValue) {
      const fallbackValue = fallbackSetting[0].settingValue;
      fallbackProvider = fallbackValue === 'none' ? null : (fallbackValue as LLMProvider);
    }
  }
  
  // Try primary provider with retries
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await invokeLLMInternal(params, primaryProvider);
    } catch (error) {
      console.error(`[LLM] ${primaryProvider} attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt === retries) {
        // Primary provider exhausted all retries
        if (fallbackProvider) {
          console.log(`[LLM] ${primaryProvider} failed after ${retries} attempts. Trying fallback: ${fallbackProvider}`);
          try {
            return await invokeLLMInternal(params, fallbackProvider);
          } catch (fallbackError) {
            console.error(`[LLM] Fallback ${fallbackProvider} also failed:`, fallbackError);
            throw new Error(`Both ${primaryProvider} and ${fallbackProvider} providers failed`);
          }
        } else {
          throw error; // No fallback configured
        }
      }
      
      // Exponential backoff: wait longer between each retry
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`[LLM] Retrying ${primaryProvider} in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('All retry attempts exhausted');
}

type LLMProvider = 'forge' | 'openai';

interface ProviderConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  contextWindow: number; // Total tokens for input + output
  timeout: number; // Request timeout in milliseconds
}

export async function getProviderConfig(provider: LLMProvider): Promise<ProviderConfig> {
  if (provider === 'forge') {
    const apiKey = ENV.forgeApiKey || '';
    if (!apiKey) {
      throw new Error('API key not configured for provider: forge');
    }
    return {
      apiUrl: resolveForgeApiUrl(),
      apiKey,
      model: 'gemini-2.5-flash',
      maxTokens: 32768,
      contextWindow: 1000000, // Gemini 2.5 Flash has 1M token context
      timeout: 60000, // 60 seconds
    };
  } else if (provider === 'openai') {
    // Get OpenAI key from environment variable (stored in Secrets)
    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (!openaiKey) {
      throw new Error('API key not configured for provider: openai');
    }
    
    // IMPORTANT: Always call OpenAI directly, ignore Manus proxy URLs
    // The system may inject OPENAI_BASE_URL pointing to Manus proxy,
    // but that requires sandbox tokens, not OpenAI API keys.
    // When user selects OpenAI provider, they want to use their own API key.
    const baseUrl = 'https://api.openai.com/v1';
    
    return {
      apiUrl: `${baseUrl}/chat/completions`,
      apiKey: openaiKey,
      model: 'gpt-4o-mini',
      maxTokens: 16384,
      contextWindow: 128000, // GPT-4o-mini has 128k context
      timeout: 60000, // 60 seconds
    };
  }
  
  throw new Error(`Unknown provider: ${provider}`);
}

async function invokeLLMInternal(params: InvokeParams, provider: LLMProvider = 'forge'): Promise<InvokeResult> {
  const config = await getProviderConfig(provider);
  
  if (!config.apiKey) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: config.model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Provider-specific config
  payload.max_tokens = config.maxTokens;
  
  if (provider === 'forge') {
    payload.thinking = {
      "budget_tokens": 128
    };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  console.log(`[LLM] Using provider: ${provider}, model: ${config.model}`);
  console.log(`[LLM] API URL: ${config.apiUrl}`);
  console.log(`[LLM] API Key (first 10 chars): ${config.apiKey.substring(0, 10)}...`);
  console.log(`[LLM] Request payload:`, JSON.stringify(payload, null, 2).substring(0, 500));
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Log full error details for debugging
      const errorText = await response.text();
      console.error(`[LLM] API Error (${provider}):`, {
        status: response.status,
        statusText: response.statusText,
        url: config.apiUrl,
        error: errorText
      });
      throw new Error(
        `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    return (await response.json()) as InvokeResult;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`LLM request timeout after ${config.timeout}ms`);
    }
    throw error;
  }
}
