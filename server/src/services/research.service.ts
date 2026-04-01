import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// e:\LJC\BlockChain\Hetu\lokacash\server\src\services -> \server\tools\last30days-skill
const LAST30DAYS_PATH = path.join(__dirname, '../../tools/last30days-skill');

export const researchService = {
  runDeepResearch(
    topic: string, 
    options: { deep?: boolean; days?: number } = {},
    onProgress?: (log: string) => void
  ) {
    const args = [
      path.join(LAST30DAYS_PATH, 'scripts', 'last30days.py'),
      topic,
      options.deep ? '--deep' : '--quick',
      options.days ? `--days=${options.days}` : '--days=30',
    ].filter(Boolean) as string[];

    return new Promise<{ summary: string; topic: string; timestamp: string }>((resolve, reject) => {
      const pythonExe = path.join(LAST30DAYS_PATH, '.venv', 'Scripts', 'python.exe');

      console.log(`[researchService] Starting deep research on: "${topic}"`);

      const venvScripts = path.join(LAST30DAYS_PATH, '.venv', 'Scripts');
      const child = spawn(pythonExe, args, {
        cwd: LAST30DAYS_PATH,
        env: { ...process.env, PATH: `${venvScripts}${path.delimiter}${process.env.PATH || ''}` },
      });

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderrData += text;
        if (onProgress && text.trim()) {
          onProgress(text.trim());
        }
      });

      // 5 minutes hard timeout
      const timeoutSec = options.deep ? 300 : 180;
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Timeout after ${timeoutSec} seconds`));
      }, timeoutSec * 1000);

      child.on('close', async (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          console.error('[researchService] Execution error:', stderrData);
          return reject(new Error(`Script exited with code ${code}:\n${stderrData}`));
        }
        
        let finalSummary = stdoutData.trim();

        // Optional AI synthesis step
        if (process.env.LOKA_AI_API_KEY && process.env.LOKA_AI_BASE_URL && process.env.LOKA_AI_MODEL) {
          try {
            if (onProgress) {
              onProgress('⏳ \u001b[95mAI Synthesis\u001b[0m Analyzing data and generating final report...');
            }
            
            let apiUrl = process.env.LOKA_AI_BASE_URL.replace(/\/$/, '');
            if (!apiUrl.endsWith('/chat/completions')) {
              apiUrl += '/chat/completions';
            }
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LOKA_AI_API_KEY}`
              },
              body: JSON.stringify({
                model: process.env.LOKA_AI_MODEL,
                messages: [
                  { 
                    role: 'system', 
                    content: `You are an expert research analyst. I will provide you with a raw data report scraped from multiple sources (Reddit, YouTube, etc) about a specific topic.
Your job is to synthesize this raw data into a highly readable, professional, and well-structured briefing.
Rules:
1. Use clear, engaging headings regarding the topic.
2. Group related themes and summarize what people are actually saying.
3. Quote specific top comments or transcript highlights if they are particularly insightful, using block quotes (> ...).
4. Do NOT just list the sources one by one. Synthesize the narrative!
5. Include a "Key Patterns" section at the end with numbered insights. The numbering MUST start from 1 and be contiguous (1, 2, 3...).
6. Keep the formatting in clean Markdown. Use **bold** for emphasis, use headings (##) for sections.
7. NEVER invent data - strictly use ONLY what is present in the raw report.
8. Do NOT include a report title - the frontend will handle that.
9. Do NOT mention model names or generation metadata.
10. Keep it concise but insightful. Aim for 400-800 words.`
                  },
                  { 
                    role: 'user', 
                    content: `Here is the raw research report to synthesize for topic "${topic}":\n\n${finalSummary}` 
                  }
                ],
                temperature: 0.3
              })
            });

            if (response.ok) {
              const data = await response.json() as any;
              if (data.choices && data.choices[0]?.message?.content) {
                finalSummary = data.choices[0].message.content.trim();
                if (onProgress) {
                  onProgress('✓ \u001b[95mAI Synthesis\u001b[0m Report generated successfully');
                }
              }
            } else {
              const errText = await response.text();
              console.error('[researchService] AI Synthesis API error:', errText);
              if (onProgress) {
                onProgress(`❌ \u001b[91mAI Synthesis\u001b[0m API Error (${response.status}). Falling back to raw data.`);
              }
            }
          } catch (err: any) {
            console.error('[researchService] AI Synthesis exception:', err);
            if (onProgress) {
              onProgress('❌ \u001b[91mAI Synthesis\u001b[0m Network error. Falling back to raw data.');
            }
          }
        }

        resolve({
          summary: finalSummary,
          topic,
          timestamp: new Date().toISOString()
        });
      });
      
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
};
