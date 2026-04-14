/**
 * Multi-Role Analyzer Component
 * Allows analyzing resume against multiple job roles with custom job descriptions
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface MultiRoleAnalyzerProps {
  resumeText: string;
  jobDescription?: string;
  onAnalysisComplete?: (results: any) => void;
}

export function MultiRoleAnalyzer({
  resumeText,
  jobDescription,
  onAnalysisComplete,
}: MultiRoleAnalyzerProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const analyzeMultiRole = trpc.multiRole.analyze.useMutation();
  const analyzeCustomRole = trpc.multiRole.analyzeCustomRole.useMutation();

  const handleAnalyze = async (useCustom: boolean = false) => {
    setIsAnalyzing(true);

    try {
      if (useCustom && jobDescription) {
        const result = await analyzeCustomRole.mutateAsync({
          resumeText,
          jobDescription,
        });
        setResults(result);
        onAnalysisComplete?.(result);
      } else {
        const result = await analyzeMultiRole.mutateAsync({
          resumeText,
          jobDescription,
        });
        setResults(result);
        onAnalysisComplete?.(result);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full p-6 space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Multi-Role Analysis</h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Button
              onClick={() => handleAnalyze(false)}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Against All Roles"}
            </Button>
          </div>

          {jobDescription && (
            <div>
              <Button
                onClick={() => handleAnalyze(true)}
                disabled={isAnalyzing}
                variant="outline"
                className="w-full"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Custom Job Description"}
              </Button>
            </div>
          )}
        </div>

        {results && (
          <div className="space-y-4 mt-6">
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                {results.slice(0, 3).map((result: any, idx: number) => (
                  <TabsTrigger key={idx} value={idx.toString()}>
                    {result.score >= 70 ? (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    )}
                    <span className="hidden sm:inline">{result.score}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {(Array.isArray(results) ? results : [results]).map((result: any, idx: number) => (
                <TabsContent key={idx} value={idx.toString()} className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{result.roleName}</h4>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {result.score}%
                      </span>
                      <Badge
                        variant={result.score >= 70 ? "default" : "outline"}
                      >
                        {result.score >= 80
                          ? "Excellent"
                          : result.score >= 60
                            ? "Good"
                            : "Fair"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm text-green-700 mb-2">
                        ✓ Matched Keywords ({result.matchedKeywords.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedKeywords.slice(0, 5).map((kw: string) => (
                          <Badge key={kw} variant="outline">
                            {kw}
                          </Badge>
                        ))}
                        {result.matchedKeywords.length > 5 && (
                          <Badge variant="outline">
                            +{result.matchedKeywords.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm text-red-700 mb-2">
                        ✗ Missing Keywords ({result.missingKeywords.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.slice(0, 5).map((kw: string) => (
                          <Badge key={kw} variant="outline" className="opacity-60">
                            {kw}
                          </Badge>
                        ))}
                        {result.missingKeywords.length > 5 && (
                          <Badge variant="outline">
                            +{result.missingKeywords.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {result.recommendations && result.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Recommendations
                        </h5>
                        <ul className="space-y-1">
                          {result.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </Card>
  );
}
