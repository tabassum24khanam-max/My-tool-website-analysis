'use client';

import type { Metric } from '@/lib/types';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface MetricValueProps<T> {
  metric: Metric<T>;
  format?: (value: T) => string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricValue<T>({
  metric,
  format,
  label,
  size = 'md',
}: MetricValueProps<T>) {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl font-semibold',
    lg: 'text-3xl font-bold',
  };

  if (metric.status === 'unavailable') {
    return (
      <div className="relative">
        {label && <p className="metric-label mb-1">{label}</p>}
        <div className="flex items-center gap-2">
          <span className={`${sizeClasses[size]} text-[var(--text-muted)]`}>—</span>
          <span className="badge-unavailable">
            N/A
            <button
              className="ml-0.5"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <Info size={12} />
            </button>
          </span>
        </div>
        {showTooltip && (
          <div className="absolute z-50 mt-1 max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text-secondary)] shadow-lg">
            {metric.reason}
          </div>
        )}
      </div>
    );
  }

  const displayValue = format ? format(metric.value) : String(metric.value);
  const badge =
    metric.status === 'measured' ? (
      <span className="badge-measured">Measured</span>
    ) : (
      <span className="badge-estimated">
        Estimate
        {metric.confidence !== 'high' && ` (${metric.confidence})`}
      </span>
    );

  const tooltipText =
    metric.status === 'measured'
      ? `Source: ${metric.source}`
      : `Method: ${metric.method}`;

  return (
    <div className="relative">
      {label && <p className="metric-label mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <span className={sizeClasses[size]}>{displayValue}</span>
        <div className="flex items-center gap-1">
          {badge}
          <button
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Info size={12} />
          </button>
        </div>
      </div>
      {showTooltip && (
        <div className="absolute z-50 mt-1 max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text-secondary)] shadow-lg">
          {tooltipText}
        </div>
      )}
    </div>
  );
}

export function MetricBool({
  metric,
  trueLabel = 'Yes',
  falseLabel = 'No',
  label,
}: {
  metric: Metric<boolean>;
  trueLabel?: string;
  falseLabel?: string;
  label?: string;
}) {
  return (
    <MetricValue
      metric={metric}
      format={(v) => (v ? trueLabel : falseLabel)}
      label={label}
      size="sm"
    />
  );
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatCurrency(n: number): string {
  return `$${formatNumber(n)}`;
}
