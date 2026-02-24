import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const exec = promisify(require('child_process').exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempDir = '/tmp';
    const uploadPath = join(tempDir, `rambam-${Date.now()}-${file.name}`);
    const parsedPath = join(tempDir, `parsed-${Date.now()}.json`);
    const anomalyPath = join(tempDir, `anomaly-${Date.now()}.json`);

    await writeFile(uploadPath, buffer);

    try {
      // Run parsing script
      console.log('Running parser...');
      const pythonDir = join(process.cwd(), 'python');

      await exec(
        `python3 ${join(pythonDir, 'parse_log.py')} "${uploadPath}" --output "${parsedPath}" --sessions`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large logs
      );

      // Run anomaly detection
      console.log('Running anomaly detection...');
      await exec(
        `python3 ${join(pythonDir, 'detect_anomalies.py')} "${parsedPath}" --output "${anomalyPath}"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );

      // Read results
      const parsedContent = await readFile(parsedPath, 'utf-8');
      const anomalyContent = await readFile(anomalyPath, 'utf-8');

      const parsed = JSON.parse(parsedContent);
      const anomalies = JSON.parse(anomalyContent);

      // Clean up temp files
      await unlink(uploadPath).catch(() => {});
      await unlink(parsedPath).catch(() => {});
      await unlink(anomalyPath).catch(() => {});

      return NextResponse.json({
        success: true,
        parsed,
        anomalies,
      });
    } catch (processingError: any) {
      console.error('Processing error:', processingError);

      // Clean up on error
      await unlink(uploadPath).catch(() => {});
      await unlink(parsedPath).catch(() => {});
      await unlink(anomalyPath).catch(() => {});

      return NextResponse.json(
        {
          error: 'Failed to process log file',
          details: processingError.message,
          stderr: processingError.stderr,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
