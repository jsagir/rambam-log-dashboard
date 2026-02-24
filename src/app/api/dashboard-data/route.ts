import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

export async function GET() {
  try {
    const logsDir = join(process.cwd(), 'logs');
    const tempDir = '/tmp';
    const pythonDir = join(process.cwd(), 'python');

    // Read all log files from logs directory
    let files;
    try {
      files = await readdir(logsDir);
    } catch (error) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No logs available yet',
      });
    }

    const logFiles = files.filter(f => f.endsWith('.txt') || f.endsWith('.json'));

    if (logFiles.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No log files found',
      });
    }

    const results = [];

    // Process each log file
    for (const filename of logFiles) {
      try {
        const logPath = join(logsDir, filename);
        const parsedPath = join(tempDir, `parsed-${Date.now()}.json`);
        const anomalyPath = join(tempDir, `anomaly-${Date.now()}.json`);

        // Parse
        await exec(
          `python3 ${join(pythonDir, 'parse_log.py')} "${logPath}" --output "${parsedPath}" --sessions`,
          { maxBuffer: 10 * 1024 * 1024 }
        );

        // Analyze
        await exec(
          `python3 ${join(pythonDir, 'detect_anomalies.py')} "${parsedPath}" --output "${anomalyPath}"`,
          { maxBuffer: 10 * 1024 * 1024 }
        );

        // Read results
        const parsedContent = await readFile(parsedPath, 'utf-8');
        const anomalyContent = await readFile(anomalyPath, 'utf-8');

        const parsed = JSON.parse(parsedContent);
        const anomalies = JSON.parse(anomalyContent);

        results.push({
          filename,
          log_date: parsed.log_date,
          parsed,
          anomalies,
        });
      } catch (error: any) {
        console.error(`Error processing ${filename}:`, error);
        results.push({
          filename,
          error: error.message,
        });
      }
    }

    // Sort by date
    results.sort((a, b) => {
      if (!a.log_date) return 1;
      if (!b.log_date) return -1;
      return a.log_date.localeCompare(b.log_date);
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      results: results.filter(r => !r.error),
    });
  } catch (error: any) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
