'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleFillIcon, InfoIcon } from './icons';

interface RAGResultProps {
  query: string;
  answer: string;
  sources: string[];
  chunks: number;
  confidence: number;
}

function PureRAGResult({
  query,
  answer,
  sources,
  chunks,
  confidence,
}: RAGResultProps) {
  const confidenceLevel = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
  const confidenceColor = 
    confidenceLevel === 'high' ? 'text-green-600' : 
    confidenceLevel === 'medium' ? 'text-yellow-600' : 
    'text-red-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Knowledge Base Search
        </span>
        <div className={`ml-auto flex items-center gap-1 text-xs ${confidenceColor}`}>
          {confidenceLevel === 'high' ? (
            <CheckCircleFillIcon size={12} />
          ) : (
            <InfoIcon size={12} />
          )}
          <span>{(confidence * 100).toFixed(0)}% confidence</span>
        </div>
      </div>

      {/* Query Display */}
      <div className="mb-3">
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Query:</span>
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 italic">
          "{query}"
        </p>
      </div>

      {/* Answer */}
      <div className="mb-3">
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Answer:</span>
        <div className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">
          {answer}
        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Sources ({chunks} chunks):
          </span>
          <div className="flex flex-wrap gap-1 mt-2">
            {sources.map((source, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md"
              >
                📄 {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Warning */}
      {confidenceLevel === 'low' && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ Low confidence result. The answer may not be accurate. Consider refining your query.
        </div>
      )}
    </motion.div>
  );
}

export const RAGResult = memo(PureRAGResult);
