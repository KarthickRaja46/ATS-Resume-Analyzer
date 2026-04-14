/**
 * Export Options Component
 * Allows users to export resume and analysis in multiple formats
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileJson, FileText } from "lucide-react";
import { toast } from "sonner";

interface ExportOptionsProps {
  resumeId: number;
  analysisId?: number;
  fileName: string;
}

type ExportFormat = "pdf" | "docx" | "markdown" | "json" | "csv";

export function ExportOptions({
  resumeId,
  analysisId,
  fileName,
}: ExportOptionsProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportResume = trpc.export.resume.useMutation();
  const exportReport = trpc.export.analysisReport.useMutation();

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    pdf: <FileText className="w-4 h-4" />,
    docx: <FileText className="w-4 h-4" />,
    markdown: <FileText className="w-4 h-4" />,
    json: <FileJson className="w-4 h-4" />,
    csv: <FileText className="w-4 h-4" />,
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (analysisId && includeAnalysis) {
        // Export analysis report
        const result = await exportReport.mutateAsync({
          analysisId,
          format: format as "pdf" | "json" | "markdown",
        });

        // Download file
        downloadFile(result.dataUrl, result.filename);
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } else {
        // Export resume
        const result = await exportResume.mutateAsync({
          resumeId,
          format,
          includeAnalysis: false,
        });

        downloadFile(result.dataUrl, result.filename);
        toast.success(`Resume exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error("Failed to export");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full p-6 space-y-4">
      <h3 className="text-lg font-semibold">Export Options</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF Document
                </span>
              </SelectItem>
              <SelectItem value="docx">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Word Document
                </span>
              </SelectItem>
              <SelectItem value="markdown">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Markdown
                </span>
              </SelectItem>
              <SelectItem value="json">
                <span className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  JSON
                </span>
              </SelectItem>
              <SelectItem value="csv">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analysisId && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAnalysis"
              checked={includeAnalysis}
              onCheckedChange={(checked) => setIncludeAnalysis(checked as boolean)}
            />
            <label htmlFor="includeAnalysis" className="text-sm font-medium cursor-pointer">
              Include analysis report with resume
            </label>
          </div>
        )}

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Resume"}
        </Button>
      </div>

      <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
        <p>
          <strong>Formats:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>PDF:</strong> Best for viewing and printing
          </li>
          <li>
            <strong>Word:</strong> Editable format
          </li>
          <li>
            <strong>Markdown:</strong> Plain text with formatting
          </li>
          <li>
            <strong>JSON:</strong> Machine-readable format
          </li>
          <li>
            <strong>CSV:</strong> Spreadsheet format for bulk data
          </li>
        </ul>
      </div>
    </Card>
  );
}

function downloadFile(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
