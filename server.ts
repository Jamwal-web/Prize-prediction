import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to execute Python CLI script with JSON payload
  function runPythonCLI(args: string[], inputPayload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const pyProcess = spawn('python3', [path.join(__dirname, 'backend', 'cli_predict.py'), ...args]);

      let stdout = '';
      let stderr = '';

      if (inputPayload) {
        pyProcess.stdin.write(JSON.stringify(inputPayload));
        pyProcess.stdin.end();
      }

      pyProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      pyProcess.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON from Python script: ${stdout.slice(0, 300)}`));
        }
      });

      pyProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'PricePredictor AI Fullstack',
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/products', async (req, res) => {
    try {
      const data = await runPythonCLI(['--catalog']);
      const category = req.query.category as string;
      if (category && category !== 'all') {
        const filtered = (data as any[]).filter((p) => p.category === category);
        return res.json(filtered);
      }
      res.json(data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch catalog' });
    }
  });

  app.get('/api/current-price/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const data = await runPythonCLI(['--live-quote', productId]);
      res.json(data);
    } catch (err: any) {
      console.error('Error fetching live quote:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch live price' });
    }
  });

  app.post('/api/predict', async (req, res) => {
    try {
      const payload = req.body;
      const result = await runPythonCLI([], payload);
      res.json(result);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      res.status(500).json({ error: err.message || 'Prediction execution error' });
    }
  });

  app.post('/api/upload-csv', async (req, res) => {
    try {
      const { csv_content } = req.body;
      if (!csv_content) {
        return res.status(400).json({ error: 'No CSV content provided.' });
      }
      const result = await runPythonCLI([], { action: 'parse_csv', csv_content });
      if (result.status === 'error') {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (err: any) {
      console.error('CSV parse failed:', err);
      res.status(500).json({ error: err.message || 'CSV processing error' });
    }
  });

  app.post('/api/export-csv', (req, res) => {
    try {
      const { historical_prices = [], forecasts = [], product_name = 'PricePredictor_Analysis' } = req.body;

      const rows: string[] = [];
      rows.push('Product,Record Type,Date,Historical Price (USD),Predicted Price (USD),Lower Bound 95% CI (USD),Upper Bound 95% CI (USD),Data Source');

      for (const hp of historical_prices) {
        rows.push(`"${product_name}","Historical","${hp.date}","${hp.price}","","","","${hp.source || 'Historical Record'}"`);
      }

      for (const fc of forecasts) {
        rows.push(`"${product_name}","Forecast","${fc.date}","","${fc.predicted_price}","${fc.lower_bound_95}","${fc.upper_bound_95}","PricePredictor AI Forecast Engine"`);
      }

      const csvData = rows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${product_name.toLowerCase().replace(/\s+/g, '_')}_forecast.csv"`);
      res.send(csvData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Export error' });
    }
  });

  app.get('/api/engine-status', (req, res) => {
    const cppBinary = path.join(__dirname, 'backend', 'cpp_engine', 'forecast_engine');
    const cppExists = fs.existsSync(cppBinary);
    res.json({
      cpp_engine_available: cppExists,
      active_engine: cppExists ? 'C++ Native DSA Core' : 'Python DSA Fallback Engine',
      environment: 'Linux Web Container (Node 22 + Python 3.10)',
      supported_algorithms: [
        { id: 'ensemble', name: 'Auto-Ensemble (Optimal Multi-Model Blend)', badge: 'Recommended' },
        { id: 'cpp_engine', name: 'C++ DSA Forecasting Engine (Holt-Winters)', badge: cppExists ? 'Compiled C++' : 'Python DSA Fallback' },
        { id: 'linear', name: 'Linear Trend Regression (OLS)', badge: 'Statistical' },
        { id: 'random_forest', name: 'Random Forest Regressor (Decision Trees)', badge: 'Non-linear' },
        { id: 'holt_winters', name: 'Double Exponential Smoothing', badge: 'Time-series' }
      ]
    });
  });

  // Vite Integration
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[+] PricePredictor AI server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
