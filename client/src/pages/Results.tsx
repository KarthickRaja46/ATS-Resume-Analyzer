import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Download, Share2, Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import RewriteSuggestions from "@/components/RewriteSuggestions";

export default function Results({ params }: any) {
  const resumeId = params?.resumeId || "";
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [analysis, setAnalysis] = useState<any>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(true);

  const getAnalysisQuery = trpc.analysis.getByResumeId.useQuery(
    { resumeId: parseInt(resumeId) },
    { enabled: !!user && !!resumeId }
  );

  const getResumeQuery = trpc.resume.getById.useQuery(
    { resumeId: parseInt(resumeId) },
    { enabled: !!user && !!resumeId }
  );

  useEffect(() => {
    if (getAnalysisQuery.data) {
      const data = getAnalysisQuery.data;
      setAnalysis({
        id: data.id,
        internScore: data.internScore,
        jobScore: data.jobScore,
        matchedKeywordsIntern: JSON.parse(data.matchedKeywordsIntern),
        missingKeywordsIntern: JSON.parse(data.missingKeywordsIntern),
        matchedKeywordsJob: JSON.parse(data.matchedKeywordsJob),
        missingKeywordsJob: JSON.parse(data.missingKeywordsJob),
        structureValidation: JSON.parse(data.structureValidation),
        recommendations: JSON.parse(data.recommendations),
      });
      setLoading(false);
    }
  }, [getAnalysisQuery.data]);

  useEffect(() => {
    if (getResumeQuery.data) {
      setResumeText(getResumeQuery.data.rawText || "");
    }
  }, [getResumeQuery.data]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Analysis Not Found</h2>
          <p className="text-slate-600 mb-4">The analysis you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const handleDownload = () => {
    const reportText = `
ATS Resume Analysis Report
==========================

Data Analyst Intern Role
Score: ${analysis.internScore}%

Matched Keywords (${analysis.matchedKeywordsIntern.length}):
${analysis.matchedKeywordsIntern.join(", ")}

Missing Keywords (${analysis.missingKeywordsIntern.length}):
${analysis.missingKeywordsIntern.join(", ")}

---

Entry-Level Data Analyst Role
Score: ${analysis.jobScore}%

Matched Keywords (${analysis.matchedKeywordsJob.length}):
${analysis.matchedKeywordsJob.join(", ")}

Missing Keywords (${analysis.missingKeywordsJob.length}):
${analysis.missingKeywordsJob.join(", ")}

---

Resume Structure Validation
${Object.entries(analysis.structureValidation)
  .filter(([key]) => key !== "missingSection")
  .map(([key, value]) => `${key}: ${value ? "✓" : "✗"}`)
  .join("\n")}

---

Recommendations
${analysis.recommendations.map((rec: any) => `${rec.title}: ${rec.description}`).join("\n\n")}
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(reportText));
    element.setAttribute("download", `ats-report-${new Date().toISOString().split("T")[0]}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Report downloaded!");
  };

  const handleShare = () => {
    const shareText = `I just analyzed my resume with ATS Resume Analyzer!\n\nData Analyst Intern: ${analysis.internScore}%\nEntry-Level Data Analyst: ${analysis.jobScore}%\n\nCheck it out: ${window.location.href}`;

    if (navigator.share) {
      navigator.share({
        title: "My ATS Resume Analysis",
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share text copied to clipboard!");
    }
  };

  const ScoreGauge = ({ score, label }: { score: number; label: string }) => {
    const getColor = (score: number) => {
      if (score >= 85) return "from-green-500 to-green-600";
      if (score >= 70) return "from-blue-500 to-blue-600";
      if (score >= 50) return "from-yellow-500 to-yellow-600";
      return "from-red-500 to-red-600";
    };

    const getTextColor = (score: number) => {
      if (score >= 85) return "text-green-600";
      if (score >= 70) return "text-blue-600";
      if (score >= 50) return "text-yellow-600";
      return "text-red-600";
    };

    return (
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 339.29} 339.29`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={getColor(score).split(" ")[1]} />
                <stop offset="100%" stopColor={getColor(score).split(" ")[3]} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTextColor(score)}`}>{score}%</div>
            </div>
          </div>
        </div>
        <p className="font-semibold text-slate-900">{label}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-slate-900">Your ATS Analysis Report</h1>
            <p className="text-slate-600 mt-2">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* ATS Scores */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 border border-slate-200">
            <ScoreGauge score={analysis.internScore} label="Data Analyst Intern" />
          </Card>
          <Card className="p-8 border border-slate-200">
            <ScoreGauge score={analysis.jobScore} label="Entry-Level Data Analyst" />
          </Card>
        </div>

        {/* Keyword Analysis */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Intern Keywords */}
          <Card className="p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Data Analyst Intern Keywords</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Matched ({analysis.matchedKeywordsIntern.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedKeywordsIntern.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Missing ({analysis.missingKeywordsIntern.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywordsIntern.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Job Keywords */}
          <Card className="p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Entry-Level Data Analyst Keywords</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Matched ({analysis.matchedKeywordsJob.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedKeywordsJob.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Missing ({analysis.missingKeywordsJob.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywordsJob.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Resume Structure */}
        <Card className="p-8 border border-slate-200 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Resume Structure Validation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis.structureValidation)
              .filter(([key]) => key !== "missingSection")
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {value ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  )}
                  <span className="text-slate-900 font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Improvement Recommendations
          </h2>
          <div className="space-y-4">
            {analysis.recommendations.map((rec: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    rec.category === "keyword_optimization" ? "bg-blue-600" :
                    rec.category === "formatting" ? "bg-purple-600" :
                    "bg-green-600"
                  }`}>
                    {rec.category.replace(/_/g, " ")}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                    <p className="text-slate-600 mt-1">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* LLM Suggestions */}
        <div className="mt-12 space-y-6">
          <RewriteSuggestions
            analysisId={analysis.id}
            resumeText={resumeText}
            targetRole="intern"
            roleLabel="Data Analyst Intern"
          />
          <RewriteSuggestions
            analysisId={analysis.id}
            resumeText={resumeText}
            targetRole="job"
            roleLabel="Entry-Level Data Analyst"
          />
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setLocation("/upload")}
          >
            Analyze Another Resume
          </Button>
        </div>
      </div>
    </div>
  );
}
