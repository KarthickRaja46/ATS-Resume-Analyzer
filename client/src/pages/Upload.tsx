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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    } else {
      toast.error("Please upload PDF files only");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files.length > 0) {
      const files = Array.from(e.currentTarget.files).filter(f => f.type === "application/pdf");
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
      } else {
        toast.error("Please upload PDF files only");
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select a PDF file");
      return;
    }

    setIsAnalyzing(true);
    let successIds: number[] = [];

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error(`Upload failed for ${file.name}`);
        const { fileKey, fileUrl, rawText } = await uploadResponse.json();

        const resumeResult = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileKey,
          fileUrl,
          rawText,
        });

        const analysisResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: rawText }),
        });

        if (!analysisResponse.ok) throw new Error(`Analysis failed for ${file.name}`);
        const analysis = await analysisResponse.json();

        const resumeId = (resumeResult as any)?.id;
        if (!resumeId) throw new Error("Failed to get resume ID from response");

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
        
        successIds.push(resumeId);
      }

      toast.success(successIds.length > 1 ? "Resumes analyzed!" : "Resume analyzed!");
      if (successIds.length > 1) {
        setLocation(`/compare?ids=${successIds.join(",")}`);
      } else if (successIds.length === 1) {
        setLocation(`/results/${successIds[0]}`);
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
        <Card className="p-4 sm:p-8 border-2 border-slate-200">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-colors ${
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
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <p className="text-sm text-slate-500">PDF files only • Max 10MB • You can select multiple</p>
          </div>

          {/* Selected File Display */}
          {selectedFiles.length > 0 && (
            <div className="mt-8 space-y-3">
              {selectedFiles.map((file, i) => (
                <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate" title={file.name}>{file.name}</p>
                      <p className="text-sm text-slate-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(i)}
                      className="text-slate-600 hover:text-slate-900 flex-shrink-0"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analyze Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}...
                </>
              ) : (
                selectedFiles.length > 1 ? "Analyze Batch" : "Analyze Resume"
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
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
