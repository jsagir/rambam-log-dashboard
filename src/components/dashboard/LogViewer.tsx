'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import type { Interaction } from '@/types/rambam';
import { formatLatency } from '@/lib/utils';

interface LogViewerProps {
  interactions: Interaction[];
  logDate?: string;
}

export function LogViewer({ interactions, logDate }: LogViewerProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  const filteredInteractions = filterLanguage === 'all'
    ? interactions
    : interactions.filter(i => i.language === filterLanguage || (!i.language && filterLanguage === 'unknown'));

  const languages = Array.from(new Set(interactions.map(i => i.language || 'unknown')));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Full Log Details</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Filter:</label>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Languages ({interactions.length})</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'unknown' ? 'Unknown' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredInteractions.map((interaction, idx) => {
          const interactionId = interactions.indexOf(interaction) + 1;
          const isExpanded = expandedId === interactionId;
          const hasErrors = interaction.errors.length > 0;
          const timestamp = interaction.timestamps.stt
            ? new Date(interaction.timestamps.stt).toLocaleTimeString()
            : 'N/A';

          return (
            <div
              key={interactionId}
              className={`border rounded-lg ${hasErrors ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            >
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : interactionId)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-sm font-semibold text-gray-500">#{interactionId}</span>
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{timestamp}</span>
                  {interaction.language && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {interaction.language}
                    </span>
                  )}
                  {hasErrors && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </span>
                  )}
                  <span className="text-sm text-gray-800 truncate flex-1">
                    {interaction.question_text}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                  {/* Question */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">Question</span>
                    </div>
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      <p className="text-sm text-gray-800">{interaction.question_text}</p>
                      <div className="mt-2 flex gap-3 text-xs text-gray-500">
                        {interaction.question_type && (
                          <span>Type: {interaction.question_type}</span>
                        )}
                        {interaction.language && (
                          <span>Language: {interaction.language}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Response */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-700">Response</span>
                    </div>
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      {interaction.response_text ? (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {interaction.response_text}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 italic">No response received</p>
                      )}
                    </div>
                  </div>

                  {/* Latencies */}
                  {Object.keys(interaction.latencies).length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-semibold text-gray-700">Performance</span>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {interaction.latencies.classification && (
                          <div className="bg-white rounded px-3 py-2 border border-gray-200">
                            <div className="text-xs text-gray-500">Classification</div>
                            <div className="text-sm font-medium text-gray-800">
                              {formatLatency(interaction.latencies.classification)}
                            </div>
                          </div>
                        )}
                        {interaction.latencies.first_response && (
                          <div className="bg-white rounded px-3 py-2 border border-gray-200">
                            <div className="text-xs text-gray-500">First Response</div>
                            <div className="text-sm font-medium text-gray-800">
                              {formatLatency(interaction.latencies.first_response)}
                            </div>
                          </div>
                        )}
                        {interaction.latencies.total && (
                          <div className="bg-white rounded px-3 py-2 border border-gray-200">
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="text-sm font-medium text-gray-800">
                              {formatLatency(interaction.latencies.total)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {hasErrors && (
                    <div className="mt-3">
                      <span className="text-sm font-semibold text-red-700">Errors</span>
                      <div className="mt-2 space-y-1">
                        {interaction.errors.map((error, errIdx) => (
                          <div
                            key={errIdx}
                            className="bg-red-100 border border-red-300 rounded px-3 py-2 text-sm text-red-800"
                          >
                            Code {error.code}: {error.type}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        Technical Details
                      </summary>
                      <div className="mt-2 space-y-1 pl-2">
                        {interaction.audio_id && <div>Audio ID: {interaction.audio_id}</div>}
                        {interaction.style && <div>Style: {interaction.style}</div>}
                        <div>Response Chunks: {interaction.response_chunks.length}</div>
                        <div>Message Codes: {interaction.msg_codes.join(', ')}</div>
                        {interaction.timestamps.waiting_audio && (
                          <div>
                            Classification Time: {new Date(interaction.timestamps.waiting_audio).toLocaleTimeString()}
                          </div>
                        )}
                        {interaction.timestamps.first_chunk && (
                          <div>
                            First Chunk: {new Date(interaction.timestamps.first_chunk).toLocaleTimeString()}
                          </div>
                        )}
                        {interaction.timestamps.finished && (
                          <div>
                            Finished: {new Date(interaction.timestamps.finished).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredInteractions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No interactions found for selected filter
        </div>
      )}
    </div>
  );
}
