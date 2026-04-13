import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Upload() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.resume.upload.useMutation();
  const analysisMutation = trpc.analysis.create.useMutation();

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
          <p className="text-slate-600">Please log in to analyze your resume.</p>
        </Card>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Upload file to S3 via backend
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      const { fileKey, fileUrl, rawText } = await uploadResponse.json();

      // Save resume to database
      const resumeResult = await uploadMutation.mutateAsync({
        fileName: selectedFile.name,
        fileKey,
        fileUrl,
        rawText,
      });

      // Analyze resume and save analysis
      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: rawText }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Analysis failed");
      }

      const analysis = await analysisResponse.json();

      // Get the resume ID from the response
      const resumeId = (resumeResult as any)?.id;
      
      if (!resumeId) {
        console.error("Resume result:", resumeResult);
        throw new Error("Failed to get resume ID from response");
      }

      // Save analysis to database
      await analysisMutation.mutateAsync({
        resumeId: resumeId,
        internScore: analysis.internScore,
        jobScore: analysis.jobScore,
        matchedKeywordsIntern: analysis.matchedKeywordsIntern,
        missingKeywordsIntern: analysis.missingKeywordsIntern,
        matchedKeywordsJob: analysis.matchedKeywordsJob,
        missingKeywordsJob: analysis.missingKeywordsJob,
        structureValidation: analysis.structureValidation,
        recommendations: analysis.recommendations,
      });

      toast.success("Resume analyzed successfully!");
      if (resumeId) {
        setLocation(`/results/${resumeId}`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Upload Your Resume</h1>
          <p className="text-base sm:text-lg text-slate-600">
            Upload your PDF resume to get instant ATS scoring and optimization recommendations
          </p>
        </div>

        {/* Upload Card */}
        <Card className="p-8 border-2 border-slate-200">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-slate-400"
            }`}
          >
            <UploadIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Drag and drop your resume</h3>
            <p className="text-slate-600 mb-4">or</p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-4"
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <p className="text-sm text-slate-500">PDF files only • Max 10MB</p>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setLocation("/")}
              disabled={isAnalyzing}
            >
              Cancel
            </Button>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Real-Time Analysis",
              description: "Get instant ATS scores for both Data Analyst Intern and Entry-Level roles",
            },
            {
              title: "Keyword Matching",
              description: "See which keywords you have and which ones you're missing",
            },
            {
              title: "AI Suggestions",
              description: "Receive personalized recommendations to improve your resume",
            },
          ].map((item, i) => (
            <Card key={i} className="p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
