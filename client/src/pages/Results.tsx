import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Share2, Loader2, ArrowLeft, TrendingUp, Radar as RadarIcon } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import RewriteSuggestions from "@/components/RewriteSuggestions";
import SkillGapAnalysis from "@/components/SkillGapAnalysis";
import { BenchmarkDashboard } from "@/components/BenchmarkDashboard";
import { AIChatBox, Message } from "@/components/AIChatBox";
import { Sparkles as SparklesIcon } from "lucide-react";

export default function Results({ params }: any) {
  const resumeId = params?.resumeId || "";
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [analysis, setAnalysis] = useState<any>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const getAnalysisQuery = trpc.analysis.getByResumeId.useQuery(
    { resumeId: parseInt(resumeId) },
    { enabled: !!user && !!resumeId }
  );

  const getResumeQuery = trpc.resume.getById.useQuery(
    { resumeId: parseInt(resumeId) },
    { enabled: !!user && !!resumeId }
  );

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response: string) => {
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
    },
    onError: (err) => {
      console.error("AI Error:", err);
      toast.error(err.message || "AI Error: Please ensure your OPENAI_API_KEY is set in .env.local");
    }
  });

  useEffect(() => {
    if (getAnalysisQuery.data) {
      const data = getAnalysisQuery.data;
      setAnalysis({
        id: data.id,
        jobRole: data.jobRole,
        internScore: data.internScore,
        jobScore: data.jobScore,
        matchedKeywordsIntern: JSON.parse(data.matchedKeywordsIntern),
        missingKeywordsIntern: JSON.parse(data.missingKeywordsIntern),
        matchedKeywordsJob: JSON.parse(data.matchedKeywordsJob),
        missingKeywordsJob: JSON.parse(data.missingKeywordsJob),
        structureValidation: JSON.parse(data.structureValidation),
        recommendations: JSON.parse(data.recommendations),
        skillMatrix: data.skillMatrix ? JSON.parse(data.skillMatrix) : {},
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

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(newMessages);
    
    // Provide analysis context to the AI
    const analysisContext = `
      Resume Text: ${resumeText.substring(0, 1000)}...
      Intern Score: ${analysis.internScore}%
      Job Score: ${analysis.jobScore}%
      Missing Skills: ${analysis.missingKeywordsJob.slice(0, 10).join(", ")}
    `;
    
    chatMutation.mutate({ 
      messages: newMessages,
      context: analysisContext
    });
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

  const SkillRadar = ({ data }: { data: any }) => {
    const radarData = Object.entries(data).map(([skill, value]) => ({
      subject: skill,
      A: value,
      fullMark: 100,
    }));

    if (radarData.length === 0) return null;

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Skills"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => setLocation("/dashboard")}
                className="mb-2 -ml-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your ATS Analysis Report</h1>
            </div>
            <div className="flex flex-row flex-wrap gap-2 w-full md:w-auto">
              <Button
                onClick={handleShare}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white gap-2 border border-blue-600 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* ─── PHASE 1: HIGH-LEVEL DASHBOARD ─── */}
        <div className="grid lg:grid-cols-12 gap-6 mb-8">
          <Card className="lg:col-span-4 p-6 border border-slate-200 flex flex-col justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <ScoreGauge score={analysis.jobScore} label="Primary Role Match" />
          </Card>
          
          <Card className="lg:col-span-4 p-6 border border-slate-200 bg-white shadow-sm flex flex-col items-center">
            <h3 className="text-center font-bold text-slate-800 mb-4 flex items-center justify-center gap-2 text-md">
              <RadarIcon className="w-5 h-5 text-blue-600" />
              Skill Proficiency
            </h3>
            <SkillRadar data={analysis.skillMatrix} />
          </Card>

          <Card className="lg:col-span-4 p-6 border border-slate-200 flex flex-col justify-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <ScoreGauge score={analysis.internScore} label="General Foundation" />
          </Card>
        </div>

        {/* ─── PHASE 2: KEYWORD ANALYSIS (Side-by-Side) ─── */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
           <Card className="p-6 border border-slate-200 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Keywords Found</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.matchedKeywordsJob.map((kw: string) => (
                <span key={kw} className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-tight">
                  {kw}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6 border border-slate-200 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Priority Skills to Add</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeywordsJob.map((kw: string) => (
                <span key={kw} className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-100 uppercase tracking-tight">
                  {kw}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* ─── PHASE 3: STRUCTURE & SUGGESTIONS ─── */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
           {/* Structure Validation */}
           <Card className="lg:col-span-1 p-6 border border-slate-200 bg-white">
            <h3 className="font-bold text-slate-900 mb-6">Resume Health Check</h3>
            <div className="space-y-3">
              {Object.entries(analysis.structureValidation)
                .filter(([key]) => key !== "missingSection")
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {value ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                ))}
            </div>
          </Card>

          {/* Recommendations Summary */}
          <Card className="lg:col-span-2 p-6 border border-slate-200 bg-white">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Strategic Recommendations
            </h3>
            <div className="space-y-4">
              {analysis.recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className={`shrink-0 w-2 h-2 mt-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-500' : 'bg-blue-400'
                  }`} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ─── PHASE 4: BENCHMARKING ─── */}
        <div className="mb-12">
          <BenchmarkDashboard
            userScore={analysis.jobScore}
            roleKey={analysis.jobRole || "data-analyst-entry"}
          />
        </div>

        {/* ─── PHASE 5: INTERACTIVE COACHING (THE CLOSER) ─── */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
                <RewriteSuggestions
                    analysisId={analysis.id}
                    resumeText={resumeText}
                    targetRole="job"
                    roleLabel="Target Role"
                />
                <SkillGapAnalysis
                    resumeText={resumeText}
                    targetRole="job"
                    roleLabel="Target Role"
                />
            </div>

            <Card className="p-8 border-2 border-blue-500 bg-white shadow-2xl overflow-hidden relative">
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 z-0" />
              
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-slate-950 mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6 text-blue-600" />
                  AI Career Coach
                </h2>
                <p className="text-slate-600 text-sm mb-6">
                  Personalized advice based on your resume and market trends. Ask anything.
                </p>
                <AIChatBox
                   messages={chatMessages}
                   onSendMessage={handleSendMessage}
                   isLoading={chatMutation.isPending}
                   height="450px"
                   className="border-blue-100"
                   emptyStateMessage="Ready to optimize? Ask me how to improve your score!"
                   suggestedPrompts={[
                     "How can I emphasize 'Stakeholder Management'?",
                     "Give me 3 projects for a Data Analyst portfolio.",
                     "Rewrite my skills section for maximum impact.",
                   ]}
                />
              </div>
            </Card>
        </div>

        <div className="mb-0">
          <Card className="p-8 border border-slate-200 bg-slate-900 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to try another version?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Iterative refinement is the key to passing ATS. Upload a revised version and see how your score improves.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
                    onClick={() => setLocation("/upload")}
                >
                    Analyze New Resume
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800"
                    onClick={() => setLocation("/dashboard")}
                >
                    Go to Dashboard
                </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
