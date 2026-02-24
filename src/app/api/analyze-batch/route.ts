import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const exec = promisify(require('child_process').exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const tempDir = '/tmp';
    const pythonDir = join(process.cwd(), 'python');
    const results = [];

    // Process each file
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadPath = join(tempDir, `rambam-${Date.now()}-${file.name}`);
        const parsedPath = join(tempDir, `parsed-${Date.now()}.json`);
        const anomalyPath = join(tempDir, `anomaly-${Date.now()}.json`);

        await writeFile(uploadPath, buffer);

        // Parse
        await exec(
          `python3 ${join(pythonDir, 'parse_log.py')} "${uploadPath}" --output "${parsedPath}" --sessions`,
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
          filename: file.name,
          log_date: parsed.log_date,
          parsed,
          anomalies,
        });

        // Cleanup
        await unlink(uploadPath).catch(() => {});
        await unlink(parsedPath).catch(() => {});
        await unlink(anomalyPath).catch(() => {});
      } catch (error: any) {
        console.error(`Error processing ${file.name}:`, error);
        results.push({
          filename: file.name,
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
      results,
    });
  } catch (error: any) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process files', details: error.message },
      { status: 500 }
    );
  }
}
