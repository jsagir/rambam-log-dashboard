'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/dashboard-data.json');
        const result = await response.json();

        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        // Normalize to ensure always an array (never undefined/null)
        const normalizedData = Array.isArray(result?.results) ? result.results : [];

        if (normalizedData.length > 0) {
          setData(normalizedData);
        } else {
          setError('No log data available yet. Logs will be processed during the next deployment.');
        }
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img
                src="/motj-logo.png"
                alt="Museum of Tolerance Jerusalem"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Rambam System Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Museum of Tolerance Jerusalem - AI Holographic Experience Monitoring
                </p>
              </div>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex gap-3">
              <div className="text-red-600">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Data</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && Array.isArray(data) && data.length > 0 && (
          <ExecutiveDashboard data={Array.isArray(data) ? data : []} />
        )}
      </main>
    </div>
  );
}
