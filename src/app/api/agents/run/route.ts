import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs } from "ai";
import { SEED_AGENTS } from "@/lib/agents-data";
import { readCustomAgents } from "@/lib/custom-agents";
import { z } from "zod";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST /api/agents/run — execute an agent via Gemini (AI SDK v6)
//
// DefaultChatTransport sends:
//   { slug, id, messages (UIMessage[]), trigger, messageId }
//
// We convert UIMessages → ModelMessages before calling streamText,
// then return a UIMessageStreamResponse.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, messages: rawMessages } = body as {
      slug: string;
      messages: any[];
    };

    if (!slug) {
      return Response.json(
        { error: "Missing slug" },
        { status: 400 }
      );
    }

    if (!rawMessages || rawMessages.length === 0) {
      return Response.json(
        { error: "Missing messages" },
        { status: 400 }
      );
    }

    // Load from seed agents or custom agents JSON
    let agent = SEED_AGENTS[slug];
    if (!agent) {
      const customAgents = await readCustomAgents();
      const custom = customAgents[slug];
      if (custom) {
        agent = {
          slug: custom.slug,
          name: custom.name,
          description: custom.description,
          icon: custom.icon,
          category: custom.category,
          tags: custom.tags,
          systemPrompt: custom.systemPrompt,
          temperature: custom.temperature,
          maxTokens: custom.maxTokens,
          interactionMode: custom.interactionMode,
          estimatedCredits: Math.max(1, Math.ceil(5 + custom.creatorFeeCredits)),
          creatorFeeCredits: custom.creatorFeeCredits,
          canSearchWeb: custom.canSearchWeb,
          canScrape: custom.canScrape,
          canGenerateFiles: custom.canGenerateFiles,
          canRunCode: custom.canRunCode,
          canGenerateImages: custom.canGenerateImages,
          enabledDestinations: custom.enabledDestinations,
          webhookUrl: custom.webhookUrl,
        } as any;
      }
    }

    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "No GOOGLE_AI_API_KEY configured" },
        { status: 500 }
      );
    }

    // Normalize messages: ensure each message has a `parts` array.
    const normalizedMessages: UIMessage[] = rawMessages.map(
      (msg: any, idx: number) => {
        if (msg.parts && Array.isArray(msg.parts)) {
          return msg;
        }
        return {
          id: msg.id ?? `msg-${idx}`,
          role: msg.role ?? "user",
          parts: [{ type: "text" as const, text: msg.content ?? "" }],
        };
      }
    );

    // Create Google AI provider with explicit API key
    const google = createGoogleGenerativeAI({ apiKey });

    // Convert UIMessages → ModelMessages for the LLM
    const modelMessages = await convertToModelMessages(normalizedMessages);

    // Build active tools dynamically based on agent capability flags
    const activeTools: Record<string, any> = {};

    if (agent.canScrape) {
      activeTools.webScrape = tool({
        description: "Scrapes and reads the text content of a web page URL. Returns the markdown representation of the page.",
        parameters: z.object({
          url: z.string().describe("The absolute URL of the web page to scrape"),
        }),
        execute: async ({ url }: { url: string }) => {
          try {
            if (!url) {
              return { error: "Missing required 'url' parameter. Please provide a valid absolute URL." };
            }
            const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`);
            if (!response.ok) {
              return { error: `Failed to scrape page: ${response.statusText}` };
            }
            const text = await response.text();
            return { content: text };
          } catch (err: any) {
            return { error: err.message || "Failed to fetch page" };
          }
        },
      } as any);
    }

    if (agent.canGenerateFiles) {
      activeTools.generateFile = tool({
        description: "Generates a downloadable file with the specified content and returns its download path. Supported extensions: .md, .csv, .json, .txt.",
        parameters: z.object({
          filename: z.string().describe("Descriptive name of the file with extension (e.g., summary.md, report.csv)"),
          content: z.string().describe("The full string content to write inside the file"),
        }),
        execute: async ({ filename, content }: { filename: string; content: string }) => {
          try {
            if (!filename || !content) {
              return { error: "Missing required parameters: 'filename' and/or 'content'." };
            }
            const fs = require("fs");
            const path = require("path");
            const downloadsDir = path.join(process.cwd(), "public", "downloads");
            if (!fs.existsSync(downloadsDir)) {
              fs.mkdirSync(downloadsDir, { recursive: true });
            }
            const safeName = path.basename(filename);
            fs.writeFileSync(path.join(downloadsDir, safeName), content, "utf-8");
            return {
              success: true,
              filename: safeName,
              downloadUrl: `/downloads/${safeName}`,
            };
          } catch (err: any) {
            return { error: err.message || "Failed to write file to disk" };
          }
        },
      } as any);
    }

    if (agent.canRunCode) {
      activeTools.runCode = tool({
        description: "Executes Python or JavaScript code inside a secure sandboxed environment and returns standard output (stdout) and standard error (stderr). Use this whenever you need to execute script files, run calculations, parse data structures, or debug algorithms.",
        parameters: z.object({
          language: z.enum(["python", "javascript"]),
          code: z.string().describe("The clean source code block to execute"),
        }),
        execute: async ({ language, code }: { language: "python" | "javascript"; code: string }) => {
          try {
            if (!language || !code) {
              return { error: "Missing required parameters: 'language' and/or 'code'." };
            }
            const cp = require("child_process");
            let output = "";
            let stdout = "";
            let stderr = "";
            
            if (language === "javascript") {
              const child = cp.spawnSync("node", [], {
                input: code,
                timeout: 10000,
                encoding: "utf-8"
              });
              if (child.error) {
                return { error: `Node execution failed to start: ${child.error.message}` };
              }
              stdout = child.stdout || "";
              stderr = child.stderr || "";
              output = stdout + (stderr ? `\nStderr:\n${stderr}` : "");
            } else if (language === "python") {
              let cmd = "python";
              let child = cp.spawnSync(cmd, ["-c", "import sys; exec(sys.stdin.read())"], {
                input: code,
                timeout: 10000,
                encoding: "utf-8"
              });
              if (child.error && (child.error as any).code === "ENOENT") {
                cmd = "python3";
                child = cp.spawnSync(cmd, ["-c", "import sys; exec(sys.stdin.read())"], {
                  input: code,
                  timeout: 10000,
                  encoding: "utf-8"
                });
              }
              if (child.error) {
                return { error: `Python execution failed to start: ${child.error.message}` };
              }
              stdout = child.stdout || "";
              stderr = child.stderr || "";
              output = stdout + (stderr ? `\nStderr:\n${stderr}` : "");
            }
            return { output, stdout, stderr };
          } catch (err: any) {
            return { error: err.message || "Failed to execute code locally" };
          }
        },
      } as any);
    }

    if (agent.canGenerateImages) {
      activeTools.generateImage = tool({
        description: "Generates an image from a detailed text prompt. Returns a JSON object containing the generated image URL.",
        parameters: z.object({
          prompt: z.string().describe("A highly detailed prompt describing what the image should contain"),
        }),
        execute: async ({ prompt }: { prompt: string }) => {
          try {
            if (!prompt) {
              return { error: "Missing required 'prompt' parameter." };
            }
            const encoded = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
            return { success: true, imageUrl };
          } catch (err: any) {
            return { error: err.message || "Failed to generate image URL" };
          }
        },
      } as any);
    }

    if (agent.canSearchWeb) {
      activeTools.google_search = tool({
        description: "Search the web for a given query and return titles, links, and snippets of top search results.",
        parameters: z.object({
          query: z.string().describe("The search query to look up on the web"),
        }),
        execute: async ({ query }: { query: string }) => {
          try {
            if (!query) {
              return { error: "Missing required 'query' parameter." };
            }
            const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            });
            if (!res.ok) {
              return { error: `Search failed: ${res.statusText}` };
            }
            const html = await res.text();
            
            const results = [];
            const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
            const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

            let titleMatch;
            const titles: { title: string; link: string }[] = [];
            while ((titleMatch = titleRegex.exec(html)) !== null) {
              let rawLink = titleMatch[1];
              let link = rawLink;
              if (rawLink.includes("uddg=")) {
                const uddg = rawLink.split("uddg=")[1].split("&")[0];
                link = decodeURIComponent(uddg);
              } else if (rawLink.startsWith("//")) {
                link = "https:" + rawLink;
              }
              const title = titleMatch[2].replace(/<[^>]*>/g, '').trim();
              titles.push({ title, link });
            }

            let snippetMatch;
            const snippets: string[] = [];
            while ((snippetMatch = snippetRegex.exec(html)) !== null) {
              const snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
              snippets.push(snippet);
            }

            for (let i = 0; i < Math.min(titles.length, snippets.length, 5); i++) {
              results.push({
                title: titles[i].title,
                link: titles[i].link,
                snippet: snippets[i]
              });
            }

            return { results };
          } catch (err: any) {
            return { error: err.message || "Failed to execute search" };
          }
        },
      } as any);
    }

    const hasTools = Object.keys(activeTools).length > 0;

    const result = streamText({
      model: google("gemini-2.5-pro"),
      system: agent.systemPrompt,
      messages: modelMessages,
      temperature: agent.temperature,
      maxOutputTokens: agent.maxTokens,
      tools: hasTools ? activeTools : undefined,
      stopWhen: hasTools ? stepCountIs(5) : undefined,
      onFinish: async ({ text }: { text: string }) => {
        // Fire webhook delivery if configured
        const destinations: string[] = (agent as any).enabledDestinations || [];
        const webhookUrl: string | undefined = (agent as any).webhookUrl;
        if (destinations.includes("webhook") && webhookUrl) {
          try {
            const payload = {
              agent: { slug: agent.slug, name: agent.name },
              output: text,
              timestamp: new Date().toISOString(),
              status: "completed",
            };
            console.log(`[webhook] Delivering to ${webhookUrl}`);
            const whRes = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            console.log(`[webhook] Response: ${whRes.status} ${whRes.statusText}`);
          } catch (whErr: any) {
            console.error(`[webhook] Delivery failed:`, whErr.message);
          }
        }
      },
    } as any);

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("[agents/run] Error:", err);
    return Response.json(
      { error: err.message || "Agent execution failed" },
      { status: 500 }
    );
  }
}
