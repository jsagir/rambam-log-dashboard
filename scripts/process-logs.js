#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const pythonDir = path.join(__dirname, '..', 'python');
const outputFile = path.join(__dirname, '..', 'public', 'dashboard-data.json');
const tempDir = '/tmp';

async function processLogs() {
  console.log('🔍 Processing logs for dashboard...');

  try {
    // Read all log files
    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.txt') || f.endsWith('.json'));

    if (files.length === 0) {
      console.log('⚠️  No log files found');
      fs.writeFileSync(outputFile, JSON.stringify({ results: [] }, null, 2));
      return;
    }

    console.log(`📁 Found ${files.length} log files`);

    const results = [];

    // Process each log file
    for (const filename of files) {
      try {
        console.log(`  Processing ${filename}...`);

        const logPath = path.join(logsDir, filename);
        const parsedPath = path.join(tempDir, `parsed-${Date.now()}.json`);
        const anomalyPath = path.join(tempDir, `anomaly-${Date.now()}.json`);

        // Parse
        execSync(
          `python3 ${path.join(pythonDir, 'parse_log.py')} "${logPath}" --output "${parsedPath}" --sessions`,
          { maxBuffer: 10 * 1024 * 1024, stdio: 'pipe' }
        );

        // Analyze
        execSync(
          `python3 ${path.join(pythonDir, 'detect_anomalies.py')} "${parsedPath}" --output "${anomalyPath}"`,
          { maxBuffer: 10 * 1024 * 1024, stdio: 'pipe' }
        );

        // Read results
        const parsedContent = fs.readFileSync(parsedPath, 'utf-8');
        const anomalyContent = fs.readFileSync(anomalyPath, 'utf-8');

        const parsed = JSON.parse(parsedContent);
        const anomalies = JSON.parse(anomalyContent);

        results.push({
          filename,
          log_date: parsed.log_date,
          parsed,
          anomalies,
        });

        console.log(`  ✅ ${filename} processed`);

        // Cleanup temp files
        try {
          fs.unlinkSync(parsedPath);
          fs.unlinkSync(anomalyPath);
        } catch (e) {}
      } catch (error) {
        console.error(`  ❌ Error processing ${filename}:`, error.message);
      }
    }

    // Sort by date
    results.sort((a, b) => {
      if (!a.log_date) return 1;
      if (!b.log_date) return -1;
      return a.log_date.localeCompare(b.log_date);
    });

    // Write combined results
    fs.writeFileSync(outputFile, JSON.stringify({ results }, null, 2));
    console.log(`\n✅ Dashboard data saved to ${outputFile}`);
    console.log(`📊 Processed ${results.length} logs successfully`);
  } catch (error) {
    console.error('❌ Error processing logs:', error);
    process.exit(1);
  }
}

processLogs();
