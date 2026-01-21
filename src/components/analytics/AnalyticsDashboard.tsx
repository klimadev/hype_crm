'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import { useMemo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  delay = 0,
}: StatCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-500'
      : trend === 'down'
      ? 'text-red-500'
      : 'text-zinc-500';

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`flex items-center gap-0.5 text-sm font-medium ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-zinc-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface MiniChartProps {
  data: number[];
  height?: number;
  color?: string;
  showTrend?: boolean;
}

export function MiniChart({ data, height = 40, color = '#6366f1', showTrend = true }: MiniChartProps) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = height - ((value - minValue) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const trend = data.length >= 2 ? (data[data.length - 1] > data[0] ? 'up' : 'down') : 'neutral';

  return (
    <div className="flex items-end gap-1">
      <svg width="100%" height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      {showTrend && (
        <div
          className={`flex-shrink-0 ${
            trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-zinc-400'
          }`}
        >
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
        </div>
      )}
    </div>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressRingPercentage({
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#6366f1',
  trackColor = '#e5e7eb',
  label,
  showPercentage = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {Math.round(progress)}%
          </span>
          {label && (
            <span className="text-xs text-zinc-500">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface ActivityFeedItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  maxItems?: number;
}

export function ActivityFeed({ items, maxItems = 5 }: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {displayItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3"
        >
          <div
            className={`flex-shrink-0 p-2 rounded-lg ${
              item.iconColor || 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
            }`}
          >
            {item.icon || <Activity className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {item.title}
            </p>
            <p className="text-sm text-zinc-500 truncate">{item.description}</p>
          </div>
          <span className="text-xs text-zinc-400 whitespace-nowrap">{item.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const percentage = (stage.value / maxValue) * 100;
        const dropOff = index > 0 ? stages[index - 1].value - stage.value : 0;
        const dropOffPercentage = index > 0 ? (dropOff / stages[index - 1].value) * 100 : 0;

        return (
          <motion.div
            key={stage.label}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className="h-10 rounded-lg flex items-center justify-between px-4 text-white text-sm font-medium"
              style={{
                width: `${Math.max(percentage, 20)}%`,
                backgroundColor: stage.color || `hsl(${240 + index * 20}, 70%, 50%)`,
              }}
            >
              <span>{stage.label}</span>
              <span>{stage.value}</span>
            </div>
            {index > 0 && (
              <div className="absolute -top-3 right-0 text-xs text-zinc-500">
                -{Math.round(dropOffPercentage)}%
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

interface DashboardMetrics {
  totalLeads: number;
  totalProducts: number;
  totalRevenue: number;
  conversionRate: number;
  leadsTrend: number;
  revenueTrend: number;
  conversionTrend: number;
}

interface AnalyticsDashboardProps {
  metrics: DashboardMetrics;
  recentActivity?: ActivityFeedItem[];
  funnelData?: FunnelStage[];
  leadsChartData?: number[];
  revenueChartData?: number[];
}

export function AnalyticsDashboard({
  metrics,
  recentActivity,
  funnelData,
  leadsChartData,
  revenueChartData,
}: AnalyticsDashboardProps) {
  const {
    totalLeads,
    totalProducts,
    totalRevenue,
    conversionRate,
    leadsTrend,
    revenueTrend,
    conversionTrend,
  } = metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Leads"
          value={totalLeads.toLocaleString()}
          change={leadsTrend}
          changeLabel="vs último mês"
          trend={leadsTrend >= 0 ? 'up' : 'down'}
          icon={<Users className="w-6 h-6" />}
          delay={0}
        />
        <StatCard
          title="Produtos Ativos"
          value={totalProducts.toLocaleString()}
          icon={<Target className="w-6 h-6" />}
          delay={0.1}
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`}
          change={revenueTrend}
          changeLabel="vs último mês"
          trend={revenueTrend >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="w-6 h-6" />}
          delay={0.2}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          change={conversionTrend}
          changeLabel="vs último mês"
          trend={conversionTrend >= 0 ? 'up' : 'down'}
          icon={<TrendingUp className="w-6 h-6" />}
          delay={0.3}
        />
      </div>

      {leadsChartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Evolução de Leads
            </h3>
            <MiniChart data={leadsChartData} height={60} />
          </div>
          {revenueChartData && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Receita dos Últimos Meses
              </h3>
              <MiniChart data={revenueChartData} height={60} color="#10b981" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {funnelData && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Funil de Vendas
            </h3>
            <FunnelChart stages={funnelData} />
          </div>
        )}

        {recentActivity && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Atividade Recente
            </h3>
            <ActivityFeed items={recentActivity} />
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickStatsRowProps {
  stats: {
    label: string;
    value: string | number;
    sublabel?: string;
    icon?: React.ReactNode;
  }[];
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
        >
          {stat.icon && (
            <div className="text-zinc-400">{stat.icon}</div>
          )}
          <div>
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {stat.value}
            </p>
            {stat.sublabel && (
              <p className="text-xs text-zinc-400">{stat.sublabel}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
