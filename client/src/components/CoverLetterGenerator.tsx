/**
 * Cover Letter Generator Component
 * Generates and displays tailored cover letters for job applications
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Copy, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

interface CoverLetterGeneratorProps {
  resumeText: string;
  initialJobDescription?: string;
}

type Tone = "professional" | "friendly" | "enthusiastic";

export function CoverLetterGenerator({
  resumeText,
  initialJobDescription = "",
}: CoverLetterGeneratorProps) {
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [coverLetter, setCoverLetter] = useState("");
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCL = trpc.coverLetter.generate.useMutation();
  const calculateScore = trpc.coverLetter.calculateScore.useQuery(
    { coverLetter, jobDescription },
    { enabled: coverLetter.length > 0 && jobDescription.length > 0 }
  );

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCL.mutateAsync({
        resumeText,
        jobDescription,
        jobTitle: jobTitle || "Position",
        company: company || "Company",
        tone,
      });

      setCoverLetter(result.content);
      if (calculateScore.data) {
        setScore(calculateScore.data.score);
      }
      toast.success("Cover letter generated!");
    } catch (error) {
      toast.error("Failed to generate cover letter");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([coverLetter], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card className="w-full p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Cover Letter Generator</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Title</label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <Input
                placeholder="e.g., Google"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tone</label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Description</label>
            <Textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={5}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Cover Letter"}
          </Button>
        </div>
      </div>

      {coverLetter && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Generated Cover Letter</h4>
            {calculateScore.data && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateScore.data.score}%
                </div>
                <span className="text-xs text-gray-500">Match Score</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">{coverLetter}</pre>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={() => setTone(tone === "professional" ? "friendly" : tone === "friendly" ? "enthusiastic" : "professional")}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm text-gray-600 p-4 bg-blue-50 rounded-lg">
        <p className="font-semibold">💡 Tips for a Strong Cover Letter:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Customize with specific achievements from your resume</li>
          <li>Match the tone to the company culture</li>
          <li>Highlight how your skills align with job requirements</li>
          <li>Keep it concise and impactful (3-4 paragraphs)</li>
          <li>Proofread before sending</li>
        </ul>
      </div>
    </Card>
  );
}
