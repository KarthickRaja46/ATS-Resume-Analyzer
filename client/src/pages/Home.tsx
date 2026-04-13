import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Zap, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            ATS Resume Analyzer
          </div>
          {isAuthenticated && (
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>Dashboard</Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                Optimize Your Resume for Data Analyst Roles
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Get instant ATS scoring, keyword analysis, and AI-powered suggestions to make your resume stand out to recruiters and pass automated screening systems.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
              onClick={handleGetStarted}
            >
              Analyze Your Resume
            </Button>
          </div>

          {/* Sample Preview Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Sample Analysis Report</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="font-medium text-slate-700">Data Analyst Intern</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="w-[92%] h-full bg-green-500 rounded-full"></div>
                    </div>
                    <span className="font-bold text-green-600">92%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="font-medium text-slate-700">Entry-Level Data Analyst</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="w-[64%] h-full bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="font-bold text-blue-600">64%</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Matched Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {["Python", "SQL", "Power BI", "Excel"].map((kw) => (
                      <span key={kw} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-600">Everything you need to pass ATS screening and land interviews</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Real-Time Scoring",
                description: "Instant ATS compatibility scores for both Intern and Entry-Level roles",
              },
              {
                icon: Zap,
                title: "Keyword Analysis",
                description: "See exactly which keywords you're missing and how to add them naturally",
              },
              {
                icon: Shield,
                title: "Structure Validation",
                description: "Ensure your resume has all required sections for optimal parsing",
              },
              {
                icon: CheckCircle2,
                title: "AI Suggestions",
                description: "Get personalized rewrite suggestions powered by advanced AI",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <Icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Optimize Your Resume?</h2>
          <p className="text-xl text-blue-100 mb-8">Get your ATS score in seconds and start improving your resume today.</p>
          <Button
            size="lg"
            className="bg-white hover:bg-slate-100 text-blue-600 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            onClick={handleGetStarted}
          >
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
}
