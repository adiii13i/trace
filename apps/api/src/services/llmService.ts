export interface VerificationResult {
  verified: boolean;
  reasoning: string;
}

type ChatResult = { text: string };
// Provider-agnostic chat call. Picks the right API based on env.
async function callLLM(system: string, user: string, maxTokens: number): Promise<ChatResult> {
  const provider = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();

  if (provider === 'groq') {
    return callGroq(system, user, maxTokens);
  }
  return callAnthropic(system, user, maxTokens);
}

async function callAnthropic(system: string, user: string, maxTokens: number): Promise<ChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({
      model:      process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  return { text: data.content?.[0]?.text ?? '' };
}

async function callGroq(system: string, user: string, maxTokens: number): Promise<ChatResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  // Groq speaks the OpenAI chat-completions format — system prompt
  // goes inside the messages array, not as a separate field.
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);

  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? '' };
}

function stripJsonFences(raw: string): string {
  return raw.replace(/```json|```/g, '').trim();
}

// Public functions used by the rest of the app

export async function verifyTaskWithLLM(
  taskTitle: string,
  taskDescription: string,
  acceptanceCriteria: string[],
  commitMessage: string,
  diffSnippet: string
): Promise<VerificationResult> {
  const system = `You are a senior code reviewer. Your only job is to decide whether a git commit satisfies a specific engineering task.
Respond ONLY with a JSON object — no markdown, no explanation outside the JSON:
{"verified": true, "reasoning": "one short paragraph"}`;

  const user = `TASK: ${taskTitle}

DESCRIPTION:
${taskDescription}

ACCEPTANCE CRITERIA:
${acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

COMMIT MESSAGE:
${commitMessage}

GIT DIFF:
${diffSnippet}

Does this commit satisfy the task?`;

  const { text } = await callLLM(system, user, 512);

  try {
    const parsed = JSON.parse(stripJsonFences(text));
    return {
      verified:  Boolean(parsed.verified),
      reasoning: String(parsed.reasoning ?? ''),
    };
  } catch {
    return { verified: false, reasoning: 'Could not parse LLM response.' };
  }
}

export async function generateTasksFromPrompt(
  projectName: string,
  prompt: string,
  repoUrl: string
): Promise<Array<{
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: string;
  estimatedPoints: number;
}>> {
  const system = `You are a technical project manager. Break down a software project into specific, actionable engineering tasks.
Respond ONLY with a JSON array — no markdown, no preamble:
[{"title":"...","description":"...","acceptanceCriteria":["..."],"priority":"critical|high|medium|low","estimatedPoints":1}]`;

  const user = `Project name: ${projectName}
Repository: ${repoUrl}
Requirements: ${prompt}

Generate 5-10 concrete, independently-completable engineering tasks.`;

  const { text } = await callLLM(system, user, 2048);

  try {
    return JSON.parse(stripJsonFences(text));
  } catch {
    return [];
  }
}
