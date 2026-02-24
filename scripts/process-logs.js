#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const pythonDir = path.join(__dirname, '..', 'python');
const outputFile = path.join(__dirname, '..', 'public', 'dashboard-data.json');
const tempDir = '/tmp';

// Topic classification based on keywords
function classifyTopic(question) {
  const rules = [
    { keywords: ['חרד','הרד','haredi','צבא','army','enlist','defend','מתגייס','idf'], topic: 'Haredi / Army / Draft' },
    { keywords: ['נצרות','christianity','islam','עבודה זרה','idolatry'], topic: 'Interfaith' },
    { keywords: ['שבת','shabbat','sabbath','כשרות','בשר','חלב','kashrut'], topic: 'Shabbat / Halacha' },
    { keywords: ['נעליים','shoes','jewelry','תכשיט','table','שולחן','לובש','wear'], topic: 'Personal / Lifestyle' },
    { keywords: ['נתניהו','netanyahu','government','כנסת','knesset','election'], topic: 'Modern Politics' },
    { keywords: ['קפטן','captain','ספורט','sport','כדורגל','football','team','מנהיג'], topic: 'Sports / Leadership' },
    { keywords: ['קראים','karaite','reform','conservative'], topic: 'Jewish Sects' },
    { keywords: ['מוזיאון','museum','סובלנות','tolerance'], topic: 'Meta / Museum' },
    { keywords: ['רפואה','health','doctor','רופא','body','גוף'], topic: 'Science / Medicine' },
    { keywords: ['תורה','torah','study','לימוד','תלמוד'], topic: 'Torah Study' },
    { keywords: ['בוקר','morning','פנים','face','נקיון','clean'], topic: 'Daily Practice' },
  ];

  const q = question.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some(k => q.includes(k))) return rule.topic;
  }
  return 'General Question';
}

// Sensitivity rating based on topic and content
function rateSensitivity(topic, question) {
  const q = question.toLowerCase();
  if (topic === 'Interfaith' && (q.includes('עבודה זרה') || q.includes('idolatry'))) return 'critical';
  if (['Haredi / Army / Draft', 'Modern Politics'].includes(topic)) return 'high';
  if (['Interfaith', 'Jewish Sects', 'Shabbat / Halacha'].includes(topic)) return 'medium';
  return 'low';
}

// VIP detection - finds named visitors
function detectVIP(question) {
  // Pattern: someone introduces a named person
  const patterns = [
    /נמצא איתנו.*?(\p{L}+ \p{L}+)/u,          // Hebrew: "with us is [Name]"
    /we have with us.*?([A-Z][a-z]+ [A-Z][a-z]+)/i,  // English
    /עורך|editor|minister|professor|prof\.|dr\./i,    // Title keywords
  ];
  for (const p of patterns) {
    const match = question.match(p);
    if (match) return match[1] || 'VIP detected';
  }
  return null;
}

// Enrich interaction with topic, sensitivity, and VIP detection
function enrichInteraction(interaction) {
  const topic = classifyTopic(interaction.question);
  const sensitivity = rateSensitivity(topic, interaction.question);
  const vip = detectVIP(interaction.question);

  return {
    ...interaction,
    topic,
    sensitivity,
    vip,
  };
}

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

        // Parse (anomaly detection is now built into parse_log.py)
        execSync(
          `python3 ${path.join(pythonDir, 'parse_log.py')} "${logPath}" --output "${parsedPath}"`,
          { maxBuffer: 10 * 1024 * 1024, stdio: 'pipe' }
        );

        // Read parsed results
        const parsedContent = fs.readFileSync(parsedPath, 'utf-8');
        const parsed = JSON.parse(parsedContent);

        // Enrich each interaction with topic, sensitivity, VIP
        if (parsed.interactions && Array.isArray(parsed.interactions)) {
          parsed.interactions = parsed.interactions.map(enrichInteraction);
        }

        // Create anomalies field from parsed.summary.anomaly_summary for component compatibility
        const anomalies = {
          summary: {
            critical_count: parsed.summary?.anomaly_summary?.critical ?
              Object.values(parsed.summary.anomaly_summary.critical).reduce((a, b) => a + b, 0) : 0,
            warning_count: parsed.summary?.anomaly_summary?.warnings ?
              Object.values(parsed.summary.anomaly_summary.warnings).reduce((a, b) => a + b, 0) : 0,
          },
          metrics: {
            languages: parsed.summary?.languages ? {
              hebrew: parsed.summary.languages.filter(l => l.includes('he')).length || parsed.interactions?.filter(i => i.response_language?.includes('he')).length || 0,
              english: parsed.summary.languages.filter(l => l.includes('en')).length || parsed.interactions?.filter(i => i.response_language?.includes('en')).length || 0,
              null: parsed.summary.languages.filter(l => !l || l === 'unknown').length || 0,
            } : { hebrew: 0, english: 0, null: 0 },
            latencies: {
              first_response: {
                avg: parsed.summary?.latency_stats?.generation_start_ms?.avg || 0,
              },
            },
          },
        };

        results.push({
          filename,
          log_date: parsed.log_date,
          time_range: parsed.time_range,
          parsed,
          anomalies,
        });

        console.log(`  ✅ ${filename} processed`);

        // Cleanup temp files
        try {
          fs.unlinkSync(parsedPath);
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

    // Print summary statistics
    const totalInteractions = results.reduce((sum, r) => sum + (r.parsed.summary?.total_interactions || 0), 0);
    const criticalCount = results.reduce((sum, r) => {
      const critical = r.parsed.summary?.anomaly_summary?.critical || {};
      return sum + Object.values(critical).reduce((a, b) => a + b, 0);
    }, 0);

    console.log(`📈 Total interactions: ${totalInteractions}`);
    if (criticalCount > 0) {
      console.log(`🔴 Critical anomalies found: ${criticalCount}`);
    }
  } catch (error) {
    console.error('❌ Error processing logs:', error);
    process.exit(1);
  }
}

processLogs();
