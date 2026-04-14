/**
 * Resume Template Selector Component
 * Browse and select pre-built resume templates
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

interface TemplateOption {
  id: number;
  name: string;
  description: string;
  industry: string;
  roleKey?: string;
}

interface TemplateSelectorProps {
  industry?: string;
  jobDescription?: string;
  onTemplateSelect?: (template: TemplateOption) => void;
}

export function TemplateSelector({
  industry,
  jobDescription,
  onTemplateSelect,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);

  const { data: allTemplates } = trpc.templates.getAll.useQuery();
  const { data: recommendedTemplates } = trpc.templates.getRecommendations.useQuery(
    { jobDescription: jobDescription || "", industry: industry || "tech" },
    { enabled: jobDescription !== undefined }
  );

  const industries = Array.from(
    new Set((allTemplates || []).map((t: TemplateOption) => t.industry))
  );

  const filteredTemplates = selectedCategory === "all"
    ? allTemplates
    : allTemplates?.filter((t: TemplateOption) => t.industry === selectedCategory);

  const handleSelectTemplate = (template: TemplateOption) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleApplyTemplate = () => {
    onTemplateSelect?.(selectedTemplate!);
    setIsDialogOpen(false);
    toast.success("Template applied! You can now customize your resume.");
  };

  return (
    <div className="w-full space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Resume Templates
          </h3>
          {recommendedTemplates && recommendedTemplates.length > 0 && (
            <Badge variant="default" className="bg-amber-500">
              {recommendedTemplates.length} Recommended
            </Badge>
          )}
        </div>

        {recommendedTemplates && recommendedTemplates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recommended for Your Job</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendedTemplates.map((template: TemplateOption) => (
                <Card
                  key={template.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-600">{template.description}</p>
                      <Badge className="mt-2" variant="outline">
                        {template.industry}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-medium">Browse All Templates</p>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All ({allTemplates?.length || 0})
            </Button>
            {industries.map((ind: string) => (
              <Button
                key={ind}
                variant={selectedCategory === ind ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(ind)}
              >
                {ind.charAt(0).toUpperCase() + ind.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates?.map((template: TemplateOption) => (
              <Card
                key={template.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 group-hover:text-blue-600">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.industry}
                      </Badge>
                      {template.roleKey && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {template.roleKey}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="font-semibold text-sm mb-2">Template Structure</h4>
              <p className="text-sm text-gray-600">
                This template includes optimized sections for:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Professional summary tailored to your industry</li>
                <li>Key skills section with relevant keywords</li>
                <li>Professional experience with achievement highlights</li>
                <li>Education and certifications</li>
                <li>Additional sections for your industry</li>
              </ul>
            </div>

            <div>
              <Badge className="mb-2">{selectedTemplate?.industry}</Badge>
              {selectedTemplate?.roleKey && (
                <Badge className="ml-2">{selectedTemplate.roleKey}</Badge>
              )}
            </div>

            <p className="text-xs text-gray-500">
              You can customize this template after applying it to match your specific experience.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} className="flex-1">
              <Zap className="w-4 h-4 mr-2" />
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
