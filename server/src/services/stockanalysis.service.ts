import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { Socket } from 'socket.io';

export interface StockAnalysisOptions {
  tickers: string[];
}

class StockAnalysisService extends EventEmitter {
  private getPythonPath(): string {
    const isWindows = process.platform === 'win32';
    const venvPath = path.join(process.cwd(), 'tools', 'stock-analysis', '.venv');
    
    // Check if the virtual environment exists, if it does, use its python
    if (fs.existsSync(venvPath)) {
      if (isWindows) {
        return path.join(venvPath, 'Scripts', 'python.exe');
      } else {
        return path.join(venvPath, 'bin', 'python');
      }
    }
    
    // Fallback to system python
    return isWindows ? 'python' : 'python3';
  }

  public runAnalysis(options: StockAnalysisOptions, sessionId: string, socket?: Socket): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[StockAnalysis] Starting analysis for: ${options.tickers.join(', ')}`);
      
      const pythonPath = this.getPythonPath();
      const scriptPath = path.join(process.cwd(), 'tools', 'stock-analysis', 'run_headless.py');
      const tickersArg = options.tickers.join(',');
      
      const rootEnvPath = path.resolve(process.cwd(), '.env');
      
      // Construct environment variables
      const env: Record<string, string | undefined> = { 
        ...process.env, 
        ENV_FILE: rootEnvPath,
        PYTHONIOENCODING: 'utf-8' // Force UTF-8 to prevent GBK decode errors on Windows
      };
      
      if (env.LOKA_AI_API_KEY) {
        env.AIHUBMIX_KEY = env.LOKA_AI_API_KEY; // For DeepSeek
        env.OPENAI_API_KEY = env.LOKA_AI_API_KEY;
      }
      if (env.LOKA_AI_MODEL) {
        env.OPENAI_MODEL = env.LOKA_AI_MODEL;
      }
      if (env.LOKA_AI_BASE_URL) {
        // LiteLLM expects the base URL without /chat/completions
        const baseUrl = env.LOKA_AI_BASE_URL.replace('/chat/completions', '');
        env.OPENAI_API_BASE = baseUrl;
        env.OPENAI_BASE_URL = baseUrl;
      }

      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        '--tickers', tickersArg
      ], {
        cwd: path.dirname(scriptPath),
        env: env as NodeJS.ProcessEnv
      });

    let jsonBuffer = '';

    // Standard output captures the final JSON report
    pythonProcess.stdout.on('data', (data) => {
      jsonBuffer += data.toString();
    });

    // Standard error captures the real-time thinking logs
    pythonProcess.stderr.on('data', (data) => {
      const logs = data.toString().split('\\n');
      for (const logLine of logs) {
        if (logLine.trim()) {
          console.log(`[StockAnalysis Log] ${logLine.trim()}`);
          if (socket) {
            socket.emit('agent:stockanalysis:progress', {
              sessionId,
              log: logLine.trim()
            });
          }
        }
      }
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`[StockAnalysis] Process exited with code ${code}`);
        if (socket) {
          socket.emit('agent:stockanalysis:error', {
            sessionId,
            error: `Process exited with code ${code}`
          });
        }
        return;
      }

      try {
        const jsonMatch = jsonBuffer.match(/\\{.*\\}/s);
        const reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonBuffer);
        
        // build combined markdown response
        let finalReport = "";
        for (const [ticker, data] of Object.entries((reportData as any))) {
           if ((data as any).markdown) {
               finalReport += `\\n${(data as any).markdown}\\n`;
           } else if ((data as any).error) {
               finalReport += `\\n**⚠️ Error analyzing ${ticker}:** ${(data as any).error}\\n`;
           }
        }
        
        console.log(`[StockAnalysis] Analysis complete for ${options.tickers.join(', ')}`);
        
        if (socket) {
          socket.emit('agent:stockanalysis:done', {
            sessionId,
            report: finalReport
          });
        }
        resolve();
      } catch (e: any) {
        console.error(`[StockAnalysis] Failed to parse output! Error: ${e.message}`);
        console.error(`[StockAnalysis] Buffer size: ${jsonBuffer.length} chars. Starts with: ${jsonBuffer.slice(0, 50)}`);
        if (socket) {
          socket.emit('agent:stockanalysis:error', {
            sessionId,
            error: `Failed to parse AI output: ${e.message}`
          });
        }
        reject(new Error(`Failed to parse AI output: ${e.message}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error(`[StockAnalysis] Process error:`, err);
      if (socket) {
        socket.emit('agent:stockanalysis:error', {
          sessionId,
          error: err.message
        });
      }
      reject(err);
    });
  });
  }
}

export const stockAnalysisService = new StockAnalysisService();
