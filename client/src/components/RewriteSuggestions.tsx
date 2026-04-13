import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, Lightbulb } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RewriteSuggestionsProps {
  analysisId: number;
  resumeText: string;
  targetRole: "intern" | "job";
  roleLabel: string;
}

export default function RewriteSuggestions({
  analysisId,
  resumeText,
  targetRole,
  roleLabel,
}: RewriteSuggestionsProps) {
  const [copied, setCopied] = useState<number | null>(null);

  const generateMutation = trpc.suggestions.generate.useMutation();
  const summaryMutation = trpc.suggestions.summary.useMutation();
  const savedSuggestionsQuery = trpc.suggestions.byAnalysisId.useQuery(
    { analysisId },
    { enabled: Number.isFinite(analysisId) }
  );

  const handleGenerateSuggestions = async () => {
    if (!resumeText) {
      toast.error("Resume text is required");
      return;
    }
    try {
      await generateMutation.mutateAsync({
        analysisId,
        resumeText,
        targetRole,
      });
      await savedSuggestionsQuery.refetch();
    } catch (error) {
      toast.error("Failed to generate suggestions");
    }
  };

  const handleGenerateSummary = async () => {
    if (!resumeText) {
      toast.error("Resume text is required");
      return;
    }
    try {
      await summaryMutation.mutateAsync({
        analysisId,
        resumeText,
        targetRole,
      });
      await savedSuggestionsQuery.refetch();
    } catch (error) {
      toast.error("Failed to generate summary");
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(index);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  const isLoading = generateMutation.isPending || summaryMutation.isPending;
  const generatedNoItems =
    Boolean(generateMutation.data) &&
    !generateMutation.data?.summaryRewrite &&
    generateMutation.data?.bulletSuggestions.length === 0;

  return (
    <Card className="p-4 sm:p-8 border border-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0" />
          AI-Powered Rewrite Suggestions
        </h2>
        <span className={`text-sm px-3 py-1 rounded-full font-semibold shadow-sm border ${
          targetRole === 'intern'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
        }`}>
          For {roleLabel}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-slate-600">
          Get personalized suggestions to improve your resume for this specific role. Our AI analyzes your content and provides rewritten bullet points with better keywords and impact.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            size="lg"
            className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
            onClick={handleGenerateSuggestions}
            disabled={isLoading}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                Generate Suggestions
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleGenerateSummary}
            disabled={isLoading}
          >
            {summaryMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Key Improvements"
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Saved in DB: {savedSuggestionsQuery.data?.length ?? 0} entries
        </p>
      </div>

      {generatedNoItems && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Suggestions were generated but no structured rewrite items were returned. Try again or use Key Improvements.
          </p>
        </div>
      )}

      {generateMutation.data && (
        <div className="space-y-6">
          {generateMutation.data.summaryRewrite && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">Professional Summary Rewrite</h3>
              <p className="text-slate-700 mb-3">{generateMutation.data.summaryRewrite}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(generateMutation.data.summaryRewrite || "", 0)}
                className="gap-2"
              >
                {copied === 0 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          )}

          {generateMutation.data.bulletSuggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Bullet Point Improvements</h3>
              <div className="space-y-4">
                {generateMutation.data.bulletSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Original</p>
                      <p className="text-slate-700">{suggestion.original}</p>
                    </div>
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs font-semibold text-green-700 uppercase mb-1">Suggested</p>
                      <p className="text-slate-900 font-medium">{suggestion.suggested}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Improvement</p>
                      <p className="text-sm text-slate-600">{suggestion.improvement}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(suggestion.suggested, index + 1)}
                      className="gap-2"
                    >
                      {copied === index + 1 ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {summaryMutation.data && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-2">Key Improvements</h3>
          <p className="text-slate-700">{summaryMutation.data}</p>
        </div>
      )}
    </Card>
  );
}
