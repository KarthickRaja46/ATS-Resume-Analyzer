import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Sparkles, FileText, BarChart3, FileDown, Wand2, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { MultiRoleAnalyzer } from "@/components/MultiRoleAnalyzer";
import { TemplateSelector } from "@/components/TemplateSelector";
import { CoverLetterGenerator } from "@/components/CoverLetterGenerator";
import { ExportOptions } from "@/components/ExportOptions";
import { BenchmarkDashboard } from "@/components/BenchmarkDashboard";

type ToolsTab = "overview" | "match" | "export" | "templates" | "benchmark" | "cover-letter";

function resolveTab(pathname: string): ToolsTab {
  if (pathname.startsWith("/templates")) return "templates";
  if (pathname.startsWith("/benchmark")) return "benchmark";
  if (pathname.startsWith("/cover-letter")) return "cover-letter";
  if (pathname.startsWith("/tools/export")) return "export";
  if (pathname.startsWith("/tools/templates")) return "templates";
  if (pathname.startsWith("/tools/benchmark")) return "benchmark";
  if (pathname.startsWith("/tools/cover-letter")) return "cover-letter";
  if (pathname.startsWith("/tools/match")) return "match";
  return "overview";
}

export default function Tools({ params }: any) {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ToolsTab>(resolveTab(location));
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const historyQuery = trpc.resume.getHistory.useQuery(undefined, { enabled: !!user });
  const selectedResumeQuery = trpc.resume.getById.useQuery(
    { resumeId: selectedResumeId || 0 },
    { enabled: !!user && !!selectedResumeId }
  );
  const selectedAnalysisQuery = trpc.analysis.getByResumeId.useQuery(
    { resumeId: selectedResumeId || 0 },
    { enabled: !!user && !!selectedResumeId }
  );

  useEffect(() => {
    setActiveTab(resolveTab(location));
  }, [location]);

  useEffect(() => {
    if (!selectedResumeId && historyQuery.data?.length) {
      setSelectedResumeId(historyQuery.data[0].id);
    }
  }, [historyQuery.data, selectedResumeId]);

  useEffect(() => {
    if (selectedResumeQuery.data?.rawText) {
      setResumeText(selectedResumeQuery.data.rawText);
    }
  }, [selectedResumeQuery.data]);

  const currentResume = useMemo(() => {
    return historyQuery.data?.find((resume: any) => resume.id === selectedResumeId) ?? null;
  }, [historyQuery.data, selectedResumeId]);

  const analysis = selectedAnalysisQuery.data;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600 mb-6">Sign in to use templates, benchmarking, exports, and cover letter tools.</p>
          <Button onClick={() => setLocation("/dashboard")} className="w-full">Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 max-w-3xl">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit">Tools Hub</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Optimization tools in one place</h1>
            <p className="text-slate-600 text-lg">
              Move between matching, exporting, templates, benchmarking, and cover letters without leaving the app.
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
        </div>

        <Card className="p-6 border border-slate-200 bg-white/80 backdrop-blur">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Resume</p>
              <Select
                value={selectedResumeId?.toString() || ""}
                onValueChange={(value) => setSelectedResumeId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {historyQuery.data?.map((resume: any) => (
                    <SelectItem key={resume.id} value={resume.id.toString()}>
                      {resume.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Quick jump</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["Overview", "overview"],
                  ["Match", "match"],
                  ["Export", "export"],
                  ["Templates", "templates"],
                  ["Benchmark", "benchmark"],
                  ["Cover Letter", "cover-letter"],
                ].map(([label, tab]) => (
                  <Button key={tab} variant={activeTab === tab ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab as ToolsTab)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Selected resume</p>
              <p className="text-slate-900 font-semibold truncate">{currentResume?.fileName || "None selected"}</p>
              <p className="text-sm text-slate-500">{analysis ? `Job role: ${analysis.jobRole || "data-analyst-entry"}` : "No analysis loaded yet"}</p>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ToolsTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-white/80 backdrop-blur">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="match">Match</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
            <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { icon: Wand2, title: "Multi-Role Matching", copy: "Score a resume against multiple roles or a custom job post." },
                { icon: FileDown, title: "Export Options", copy: "Download ATS-ready resumes and analysis reports in several formats." },
                { icon: BookOpen, title: "Templates", copy: "Start from ATS-friendly templates by role and industry." },
                { icon: BarChart3, title: "Benchmarking", copy: "Compare your score against role-specific score bands." },
                { icon: Sparkles, title: "Cover Letters", copy: "Generate tailored cover letters from resume and job description." },
                { icon: FileText, title: "Analyze More", copy: "Keep your selected resume synced across tools while you refine it." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="p-6 border border-slate-200 bg-white">
                    <Icon className="w-10 h-10 text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.copy}</p>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="match" className="mt-6 space-y-6">
            <Card className="p-6 border border-slate-200 bg-white">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Resume content</h2>
              <Textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={12} placeholder="Select a resume or paste text here" />
            </Card>
            <Card className="p-6 border border-slate-200 bg-white">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Job description</h2>
              <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} placeholder="Paste a job description for custom analysis" />
            </Card>
            <MultiRoleAnalyzer resumeText={resumeText} jobDescription={jobDescription || undefined} />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            {selectedResumeId && currentResume ? (
              <ExportOptions
                resumeId={selectedResumeId}
                analysisId={analysis?.id}
                fileName={currentResume.fileName}
              />
            ) : (
              <Card className="p-6 border border-slate-200 bg-white">
                <p className="text-slate-600">Select a resume to enable exports.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplateSelector
              industry={analysis?.jobRole?.includes("finance") ? "finance" : "tech"}
              jobDescription={jobDescription}
              onTemplateSelect={() => setActiveTab("match")}
            />
          </TabsContent>

          <TabsContent value="benchmark" className="mt-6">
            {analysis ? (
              <BenchmarkDashboard userScore={analysis.jobScore} roleKey={analysis.jobRole || "data-analyst-entry"} />
            ) : (
              <Card className="p-6 border border-slate-200 bg-white">
                <p className="text-slate-600">Select a resume with analysis to view benchmarking.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cover-letter" className="mt-6">
            <CoverLetterGenerator resumeText={resumeText} initialJobDescription={jobDescription} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}