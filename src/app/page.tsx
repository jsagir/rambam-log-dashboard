'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Activity, AlertCircle } from 'lucide-react';
import type { ParsedLog, AnomalyReport, DashboardStats } from '@/types/rambam';
import { getHealthStatus } from '@/lib/utils';
import { TimelineChart } from '@/components/dashboard/TimelineChart';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedLog, setParsedLog] = useState<ParsedLog | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyReport | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  }, []);

  const analyzeLog = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setParsedLog(result.parsed);
      setAnomalies(result.anomalies);

      // Compute stats
      const healthStatus = getHealthStatus(
        result.anomalies.summary.critical_count,
        result.anomalies.summary.warning_count
      );

      setStats({
        totalInteractions: result.parsed.total_interactions,
        languages: result.anomalies.metrics.languages,
        sessionCount: result.parsed.sessions?.length || 0,
        healthStatus,
        criticalCount: result.anomalies.summary.critical_count,
        warningCount: result.anomalies.summary.warning_count,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze log file');
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rambam Log Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Museum of Tolerance Jerusalem - AI Holographic System Monitoring
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Log Date Banner */}
        {parsedLog?.log_date && (
          <div className="bg-blue-600 text-white rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Log Date: {parsedLog.log_date}</h2>
              {parsedLog.time_range && (
                <p className="text-sm text-blue-100">
                  {new Date(parsedLog.time_range.start).toLocaleTimeString()} - {new Date(parsedLog.time_range.end).toLocaleTimeString()}
                </p>
              )}
            </div>
            <FileText className="h-8 w-8 opacity-75" />
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Upload Log File</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".txt,.json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              <button
                onClick={analyzeLog}
                disabled={!file || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md
                  hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
                <span className="text-gray-400">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Interactions"
              value={stats.totalInteractions.toString()}
              icon={<Activity className="h-6 w-6 text-blue-600" />}
            />
            <StatCard
              title="Sessions"
              value={stats.sessionCount.toString()}
              icon={<FileText className="h-6 w-6 text-green-600" />}
            />
            <StatCard
              title="Critical Issues"
              value={stats.criticalCount.toString()}
              icon={<AlertCircle className="h-6 w-6 text-red-600" />}
              alert={stats.criticalCount > 0}
            />
            <StatCard
              title="Overall Health"
              value={stats.healthStatus}
              icon={<Activity className="h-6 w-6 text-gray-600" />}
            />
          </div>
        )}

        {/* Languages Breakdown */}
        {stats && Object.keys(stats.languages).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.languages).map(([lang, count]) => (
                <div key={lang} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {lang === 'unknown' ? '❓ Unknown' : lang}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / stats.totalInteractions) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[3rem] text-right">
                      {count} ({Math.round((count / stats.totalInteractions) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {anomalies && (
          <>
            {/* Critical Anomalies */}
            {anomalies.critical.length > 0 && (
              <AnomaliesSection
                title="🔴 Critical Issues"
                anomalies={anomalies.critical}
                severity="critical"
              />
            )}

            {/* Warning Anomalies */}
            {anomalies.warning.length > 0 && (
              <AnomaliesSection
                title="🟡 Warnings"
                anomalies={anomalies.warning}
                severity="warning"
              />
            )}

            {/* Operational Anomalies */}
            {anomalies.operational.length > 0 && (
              <AnomaliesSection
                title="🟢 Operational Notes"
                anomalies={anomalies.operational}
                severity="operational"
              />
            )}
          </>
        )}

        {/* Timeline Chart - Show trends over time */}
        {parsedLog?.interactions && parsedLog.interactions.length > 0 && (
          <TimelineChart interactions={parsedLog.interactions} />
        )}

        {/* Performance Metrics */}
        {anomalies?.metrics.latencies && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(anomalies.metrics.latencies).map(([type, metrics]) => {
                if (typeof metrics === 'object' && 'avg' in metrics) {
                  return (
                    <MetricCard
                      key={type}
                      title={type.replace('_', ' ')}
                      avg={metrics.avg}
                      min={metrics.min}
                      max={metrics.max}
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!stats && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Getting Started
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Upload a Rambam log file (.txt or .json format)</li>
                  <li>Click "Analyze" to process the log</li>
                  <li>View critical insights, anomalies, and performance metrics</li>
                  <li>Monitor system health in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  alert = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-6 ${
        alert ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

function AnomaliesSection({
  title,
  anomalies,
  severity,
}: {
  title: string;
  anomalies: any[];
  severity: 'critical' | 'warning' | 'operational';
}) {
  const colors = {
    critical: 'border-red-300 bg-red-50',
    warning: 'border-amber-300 bg-amber-50',
    operational: 'border-green-300 bg-green-50',
  };

  return (
    <div className={`rounded-lg border ${colors[severity]} p-6 mb-8`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {anomalies.map((anomaly, idx) => (
          <div key={idx} className="bg-white rounded-md p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">{anomaly.type}</span>
              {anomaly.interaction_id && (
                <span className="text-xs text-gray-500">Interaction #{anomaly.interaction_id}</span>
              )}
            </div>
            <p className="text-sm text-gray-700">{anomaly.description}</p>
            {anomaly.timestamp && (
              <span className="text-xs text-gray-500 mt-2 block">
                {new Date(anomaly.timestamp).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  avg,
  min,
  max,
}: {
  title: string;
  avg: number;
  min: number;
  max: number;
}) {
  return (
    <div className="border border-gray-200 rounded-md p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 capitalize">{title}</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Average:</span>
          <span className="font-medium">{Math.round(avg)}ms</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Min:</span>
          <span className="font-medium">{Math.round(min)}ms</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Max:</span>
          <span className="font-medium">{Math.round(max)}ms</span>
        </div>
      </div>
    </div>
  );
}
