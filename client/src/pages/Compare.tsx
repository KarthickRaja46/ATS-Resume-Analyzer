import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Compare() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  const params = new URLSearchParams(window.location.search);
  const idsParam = params.get("ids");
  const ids = idsParam ? idsParam.split(",").map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
  
  const getHistoryQuery = trpc.resume.getHistory.useQuery(undefined, {
    enabled: !!user && ids.length > 0,
  });

  if (authLoading || getHistoryQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || ids.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Invalid Selection</h2>
          <p className="text-slate-600 mb-6">Please select valid resumes to compare.</p>
          <Button onClick={() => setLocation("/dashboard")} className="w-full">Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const resumes = (getHistoryQuery.data || []).filter((r: any) => ids.includes(r.id) && r.analysis);

  if (resumes.length < 2) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
         <Card className="p-8 text-center">
           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <p className="text-slate-600 mb-6">At least 2 processed resumes are needed to compare.</p>
           <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
         </Card>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md pt-4 pb-4 border-b border-slate-200 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
               <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="-ml-2">
                 <ArrowLeft className="w-4 h-4 mr-2" />
                 Back
               </Button>
               <h1 className="text-2xl font-bold text-slate-900 truncate">Compare Resumes</h1>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-8">
          <div className="min-w-max flex gap-4">
            <div className="w-48 flex-shrink-0">
               {/* Spacer for sticky col if needed */}
            </div>
            {resumes.map((r: any) => (
              <div key={r.id} className="w-72 flex-shrink-0 p-4 bg-white border border-blue-200 rounded-lg relative overflow-hidden shadow-sm">
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                 <p className="font-semibold text-slate-900 truncate" title={r.fileName}>{r.fileName}</p>
                 <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <div className="min-w-max flex gap-4 mt-4">
            <div className="w-48 flex-shrink-0 p-4 font-semibold text-slate-600 bg-slate-100 rounded-lg flex items-center">
               Intern Score
            </div>
            {resumes.map((r: any) => (
              <div key={r.id} className="w-72 flex-shrink-0 p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-3xl font-bold text-blue-600 shadow-sm">
                 {r.analysis?.internScore || 0}%
              </div>
            ))}
          </div>

          <div className="min-w-max flex gap-4 mt-4">
            <div className="w-48 flex-shrink-0 p-4 font-semibold text-slate-600 bg-slate-100 rounded-lg flex items-center">
               Entry-Level Score
            </div>
            {resumes.map((r: any) => (
              <div key={r.id} className="w-72 flex-shrink-0 p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-3xl font-bold text-green-600 shadow-sm">
                 {r.analysis?.jobScore || 0}%
              </div>
            ))}
          </div>

          <div className="min-w-max flex gap-4 mt-4">
            <div className="w-48 flex-shrink-0 p-4 font-semibold text-slate-600 bg-slate-100 rounded-lg flex items-center">
               Matched Keywords
            </div>
            {resumes.map((r: any) => (
              <div key={r.id} className="w-72 flex-shrink-0 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                 <div className="flex flex-wrap gap-2">
                   {JSON.parse(r.analysis?.matchedKeywordsJob || "[]").map((kw: string) => (
                     <span key={kw} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">{kw}</span>
                   ))}
                   {JSON.parse(r.analysis?.matchedKeywordsJob || "[]").length === 0 && (
                     <span className="text-slate-400 text-sm">None</span>
                   )}
                 </div>
              </div>
            ))}
          </div>

          <div className="min-w-max flex gap-4 mt-4">
            <div className="w-48 flex-shrink-0 p-4 font-semibold text-slate-600 bg-slate-100 rounded-lg flex items-center">
               Missing Keywords
            </div>
            {resumes.map((r: any) => (
              <div key={r.id} className="w-72 flex-shrink-0 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                 <div className="flex flex-wrap gap-2">
                   {JSON.parse(r.analysis?.missingKeywordsJob || "[]").map((kw: string) => (
                     <span key={kw} className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">{kw}</span>
                   ))}
                 </div>
              </div>
            ))}
          </div>
          
          <div className="min-w-max flex gap-4 mt-4">
             <div className="w-48 flex-shrink-0 p-4 font-semibold text-slate-600 bg-slate-100 rounded-lg flex items-center">
                Structure Validation
             </div>
             {resumes.map((r: any) => {
               const struct = JSON.parse(r.analysis?.structureValidation || "{}");
               return (
               <div key={r.id} className="w-72 flex-shrink-0 p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-sm">
                  {Object.entries(struct).filter(([k]) => k !== "missingSection").map(([k, v]) => (
                    <div key={k} className="flex gap-3 items-center text-sm font-medium">
                      {v ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                      <span className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                    </div>
                  ))}
               </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
}
