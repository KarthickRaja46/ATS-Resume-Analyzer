import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Target, BookOpen, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SkillGapAnalysisProps {
  resumeText: string;
  targetRole: "intern" | "job";
  roleLabel: string;
}

export default function SkillGapAnalysis({
  resumeText,
  targetRole,
  roleLabel,
}: SkillGapAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);

  const gapAnalysisMutation = trpc.suggestions.gapAnalysis.useMutation();

  const handleGenerateAnalysis = async () => {
    if (!resumeText) {
      toast.error("Resume text is required");
      return;
    }
    try {
      const result = await gapAnalysisMutation.mutateAsync({
        resumeText,
        targetRole,
      });
      setAnalysis(result);
      toast.success("Skill gap analysis generated!");
    } catch (error) {
      toast.error("Failed to generate skill gap analysis");
    }
  };

  const isLoading = gapAnalysisMutation.isPending;

  return (
    <Card className="p-4 sm:p-8 border border-slate-200 mt-6 bg-slate-50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-500 flex-shrink-0" />
          Skill Gap Analysis & Course Recommendations
        </h2>
        <span className={`text-sm px-3 py-1 rounded-full font-semibold shadow-sm border ${
          targetRole === 'intern'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
        }`}>
          For {roleLabel}
        </span>
      </div>

      {!analysis ? (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-6">
            Discover the critical skills you're missing for this role and get targeted course recommendations to close the gap.
          </p>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            onClick={handleGenerateAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Skills...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Analyze My Skill Gaps
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-100 border border-indigo-200 rounded-lg">
            <h3 className="font-semibold text-indigo-900 mb-2">Overall Assessment</h3>
            <p className="text-indigo-800">{analysis.summary}</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Critical Missing Skills</h3>
            <div className="grid gap-4">
              {analysis.gaps.map((gap: any, idx: number) => (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{gap.missingSkill}</h4>
                      <p className="text-sm text-slate-600 mt-1">{gap.importance}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <div className="text-sm">
                      <span className="text-slate-500">Recommended action: </span>
                      <span className="font-medium text-indigo-600">{gap.courseRecommendation.title}</span>
                      <span className="text-slate-400"> on {gap.courseRecommendation.platform}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setAnalysis(null)}>
              Reset Analysis
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
