import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Zap, Shield, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/upload");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              ATS Optimizer
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Button variant="ghost" onClick={() => setLocation("/dashboard")}>Dashboard</Button>
            )}
            <Button variant="outline" onClick={() => window.open('https://github.com', '_blank')}>GitHub</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
              <Zap className="w-4 h-4" />
              AI-Powered Resume Analysis
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Land Your Dream <span className="text-blue-600">Tech Role.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                The most advanced ATS Resume Analyzer. Get instant scores, AI-powered keyword extraction, and personalized career coaching to beat automated screening.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 text-lg rounded-xl shadow-xl hover:shadow-blue-200 transition-all font-bold"
                onClick={handleGetStarted}
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-7 text-lg rounded-xl bg-white"
                onClick={() => setLocation("/tools")}
              >
                Explore Tools
              </Button>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No account needed
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                PDF Support
              </div>
            </div>
          </div>

          {/* Premium Preview UI */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-slate-200 overflow-hidden">
               {/* Mock UI for Visual Power */}
               <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Analysis Score</p>
                    <p className="text-2xl font-black text-blue-600 italic">92% Match</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Python", "SQL", "Cloud", "Agile"].map(s => (
                      <span key={s} className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-16">Three steps to a perfect resume</h2>
          <div className="grid md:grid-cols-3 gap-12">
             {[
              { step: "01", title: "Upload PDF", desc: "Drag and drop your current resume. We support all standard PDF formats." },
              { step: "02", title: "AI Analysis", desc: "Our engine compares your text against real-world job descriptions." },
              { step: "03", title: "Optimize", desc: "Use our AI coach to rewrite bullets and fill missing keyword gaps." }
             ].map((item, i) => (
               <div key={i} className="space-y-4">
                 <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-xl font-bold">{item.step}</div>
                 <h3 className="text-xl font-bold">{item.title}</h3>
                 <p className="text-slate-600">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12 border-b border-slate-800 pb-12">
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
                 <span className="text-white font-bold text-xl">ATS Optimizer</span>
               </div>
               <p className="max-w-xs text-sm text-slate-400">
                 The ultimate career development tool for students and professionals. Built with advanced AI to boost your interview success.
               </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
              <div className="space-y-4">
                <p className="text-white font-semibold">Project</p>
                <div className="flex flex-col gap-2 text-sm">
                  <span className="hover:text-white cursor-pointer" onClick={() => setLocation("/upload")}>Analyze</span>
                  <span className="hover:text-white cursor-pointer" onClick={() => setLocation("/tools")}>Tools</span>
                  <span className="hover:text-white cursor-pointer" onClick={() => setLocation("/templates")}>Templates</span>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-white font-semibold">Dev</p>
                <div className="flex flex-col gap-2 text-sm">
                  <a href="https://github.com/KarthickRaja46" target="_blank" className="hover:text-white">GitHub</a>
                  <a href="#" className="hover:text-white">Portfolio</a>
                  <a href="#" className="hover:text-white">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 Karthick Raja. All rights reserved.</p>
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1">Made with <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> for Developers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
