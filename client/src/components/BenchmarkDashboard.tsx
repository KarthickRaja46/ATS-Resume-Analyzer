/**
 * Benchmark Dashboard Component
 * Displays score benchmarks and user performance comparison
 */

import React, { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, Target } from "lucide-react";

interface BenchmarkDashboardProps {
  userScore: number;
  roleKey: string;
  onBenchmarkLoad?: (data: any) => void;
}

export function BenchmarkDashboard({
  userScore,
  roleKey,
  onBenchmarkLoad,
}: BenchmarkDashboardProps) {
  const { data: benchmarkData, isLoading } = trpc.benchmark.calculatePercentile.useQuery({
    score: userScore,
    roleKey,
  });

  useMemo(() => {
    if (benchmarkData) {
      onBenchmarkLoad?.(benchmarkData);
    }
  }, [benchmarkData, onBenchmarkLoad]);

  if (isLoading) {
    return (
      <Card className="w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </Card>
    );
  }

  if (!benchmarkData) {
    return null;
  }

  const { benchmarkData: benchmark, percentile, ranking, comparison } = benchmarkData;

  const chartData = [
    { name: "25th %ile", value: benchmark.percentile25 },
    { name: "Median", value: benchmark.medianScore },
    { name: "Your Score", value: userScore },
    { name: "75th %ile", value: benchmark.percentile75 },
    { name: "Average", value: benchmark.averageScore },
  ];

  const getRankingColor = (rank: string) => {
    switch (rank) {
      case "Outstanding":
        return "bg-green-100 text-green-800";
      case "Excellent":
        return "bg-blue-100 text-blue-800";
      case "Good":
        return "bg-yellow-100 text-yellow-800";
      case "Fair":
        return "bg-orange-100 text-orange-800";
      case "Needs Improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">ATS Score Benchmark</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Score</span>
              <span className="text-2xl font-bold text-blue-600">{userScore}</span>
            </div>
            <Progress value={Math.min(userScore, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Percentile</span>
              <span className="text-2xl font-bold text-indigo-600">{percentile.toFixed(1)}th</span>
            </div>
            <Progress value={percentile} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ranking</span>
              <Badge className={getRankingColor(ranking)}>{ranking}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h4 className="font-semibold">Industry Comparison</h4>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Your Position
            </h5>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>vs Average</dt>
                <dd
                  className={`font-semibold ${comparison.vsAverage > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {comparison.vsAverage > 0 ? "+" : ""}{comparison.vsAverage}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>vs Median</dt>
                <dd
                  className={`font-semibold ${comparison.vsMedian > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {comparison.vsMedian > 0 ? "+" : ""}{comparison.vsMedian}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Next Goal
            </h5>
            <div className="text-sm space-y-2">
              <p>
                {percentile >= 90
                  ? "🎉 Exceptional performance!"
                  : percentile >= 75
                    ? `Reach 90th percentile (${benchmark.percentile90}/100)`
                    : `Target ${benchmark.medianScore}/100 (Median)`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h5 className="font-medium flex items-center gap-2">
          <Award className="w-4 h-4" />
          Key Insights
        </h5>
        <p className="text-sm text-gray-600">{comparison.interpretation}</p>

        <div className="pt-3 border-t space-y-2 text-sm">
          <p>
            <strong>Benchmark Distribution:</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <div className="font-semibold">{benchmark.percentile25}</div>
              <div className="text-gray-500">25th percentile</div>
            </div>
            <div>
              <div className="font-semibold">{benchmark.medianScore}</div>
              <div className="text-gray-500">Median</div>
            </div>
            <div>
              <div className="font-semibold">{benchmark.averageScore}</div>
              <div className="text-gray-500">Average</div>
            </div>
            <div>
              <div className="font-semibold">{benchmark.percentile75}</div>
              <div className="text-gray-500">75th percentile</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 pt-2">
            Based on {benchmark.samplesCount} analyzed resumes
          </p>
        </div>
      </Card>
    </div>
  );
}
