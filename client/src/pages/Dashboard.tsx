import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Loader2, AlertCircle, Plus, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const getHistoryQuery = trpc.resume.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600">Please log in to view your dashboard.</p>
        </Card>
      </div>
    );
  }

  const resumes = getHistoryQuery.data || [];
  const isLoading = getHistoryQuery.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Your Dashboard</h1>
            <p className="text-slate-600 mt-2">View and manage your resume analyses</p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => setLocation("/upload")}
          >
            <Plus className="w-5 h-5" />
            Analyze New Resume
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Analyses</p>
                <p className="text-3xl font-bold text-slate-900">{resumes.length}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Last Analysis</p>
                <p className="text-xl font-bold text-slate-900">
                  {resumes.length > 0
                    ? new Date(resumes[0]?.createdAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <FileText className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Account Status</p>
                <p className="text-xl font-bold text-slate-900">Active</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Resume History */}
        <Card className="border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Analysis History</h2>
          </div>

          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No analyses yet</h3>
              <p className="text-slate-600 mb-6">
                Upload your first resume to get started with ATS analysis
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setLocation("/upload")}
              >
                Upload Resume
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {resumes.map((resume: any) => (
                <div
                  key={resume.id}
                  className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/results/${resume.id}`)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <FileText className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{resume.fileName}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Analyzed on {new Date(resume.createdAt).toLocaleDateString()} at{" "}
                          {new Date(resume.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto mt-2 sm:mt-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/results/${resume.id}`);
                      }}
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="mt-12 p-8 border border-slate-200 bg-blue-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Need Help?</h3>
          <p className="text-slate-700 mb-4">
            Our ATS Resume Analyzer helps you optimize your resume for Data Analyst positions. Upload your resume to get:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Real-time ATS compatibility scores
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Keyword matching analysis
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Personalized improvement recommendations
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
