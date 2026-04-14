import { COOKIE_NAME, JOB_ROLES } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createResume,
  getResumesByUserId,
  getResumeById,
  createAnalysis,
  getAnalysisByResumeId,
  getAnalysisById,
  createRewriteSuggestion,
  getRewriteSuggestionsByAnalysisId,
} from "./db";
import { analyzeMultiRole, analyzeCustomRole } from "./multi-role-analysis";
import { exportResume, exportAnalysisReport, exportBulkAnalyses } from "./export-service";
import { generateCoverLetter, calculateCoverLetterScore } from "./cover-letter-generator";
import { calculateUserPercentile, compareMultipleRoles, generateBenchmarkReport, calculateScoreProgression } from "./benchmarking";
import { getAllTemplates, getTemplateByRole, getTemplatesByIndustry, applyTemplate, getTemplateRecommendations } from "./template-manager";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  resume: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        rawText: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const resume = await createResume(
          ctx.user.id,
          input.fileName,
          input.fileKey,
          input.fileUrl,
          input.rawText
        );
        
        return resume;
      }),
    
    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const resumes = await getResumesByUserId(ctx.user.id);
        const db = await (await import("./db")).getDb();
        if (db && resumes.length > 0) {
          const analyses = await db.collection("analyses")
            .find({ userId: ctx.user.id })
            .toArray();
          return resumes.map(r => {
            const rAnalysis = analyses.find(a => a.resumeId === r.id);
            return {
              ...r,
              analysis: rAnalysis ?? null
            };
          });
        }
        return resumes.map(r => ({ ...r, analysis: null }));
      }),
    
    getById: protectedProcedure
      .input(z.object({ resumeId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const resume = await getResumeById(input.resumeId);
        if (!resume || resume.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return resume;
      }),
  }),

  suggestions: router({
    generate: protectedProcedure
      .input(
        z.object({
          analysisId: z.number(),
          resumeText: z.string(),
          targetRole: z.enum(["intern", "job"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const analysis = await getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { generateRewriteSuggestions } = await import("./llm-suggestions");
        const result = await generateRewriteSuggestions(
          input.resumeText,
          input.targetRole
        );

        const writes = result.bulletSuggestions.map(suggestion =>
          createRewriteSuggestion({
            analysisId: input.analysisId,
            originalText: suggestion.original,
            suggestedText: suggestion.suggested,
            category: suggestion.improvement,
            accepted: 0,
          })
        );

        if (result.summaryRewrite) {
          writes.push(
            createRewriteSuggestion({
              analysisId: input.analysisId,
              originalText: "",
              suggestedText: result.summaryRewrite,
              category: "summary_rewrite",
              accepted: 0,
            })
          );
        }

        await Promise.all(writes);
        return result;
      }),
    
    summary: protectedProcedure
      .input(
        z.object({
          analysisId: z.number(),
          resumeText: z.string(),
          targetRole: z.enum(["intern", "job"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const analysis = await getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { generateImprovementSummary } = await import("./llm-suggestions");
        const summary = await generateImprovementSummary(
          input.resumeText,
          input.targetRole
        );

        if (summary) {
          await createRewriteSuggestion({
            analysisId: input.analysisId,
            originalText: "",
            suggestedText: summary,
            category: "improvement_summary",
            accepted: 0,
          });
        }

        return summary;
      }),

    byAnalysisId: protectedProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const analysis = await getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return getRewriteSuggestionsByAnalysisId(input.analysisId);
      }),
      
    gapAnalysis: protectedProcedure
      .input(
        z.object({
          resumeText: z.string(),
          targetRole: z.enum(["intern", "job"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const { generateSkillGapAnalysis } = await import("./llm-suggestions");
        return await generateSkillGapAnalysis(input.resumeText, input.targetRole);
      }),
  }),

  analysis: router({
    create: protectedProcedure
      .input(z.object({
        resumeId: z.number(),
        internScore: z.number(),
        jobScore: z.number(),
        matchedKeywordsIntern: z.array(z.string()),
        missingKeywordsIntern: z.array(z.string()),
        matchedKeywordsJob: z.array(z.string()),
        missingKeywordsJob: z.array(z.string()),
        structureValidation: z.any(),
        recommendations: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const analysis = await createAnalysis({
          resumeId: input.resumeId,
          userId: ctx.user.id,
          jobRole: "data-analyst-entry",
          jobDescription: null,
          internScore: input.internScore,
          jobScore: input.jobScore,
          matchedKeywordsIntern: JSON.stringify(input.matchedKeywordsIntern),
          missingKeywordsIntern: JSON.stringify(input.missingKeywordsIntern),
          matchedKeywordsJob: JSON.stringify(input.matchedKeywordsJob),
          missingKeywordsJob: JSON.stringify(input.missingKeywordsJob),
          structureValidation: JSON.stringify(input.structureValidation),
          recommendations: JSON.stringify(input.recommendations),
          customKeywords: null,
          benchmarkPercentile: null,
        });
        
        return analysis;
      }),
    
    getByResumeId: protectedProcedure
      .input(z.object({ resumeId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const analysis = await getAnalysisByResumeId(input.resumeId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return analysis;
      }),
  }),

  // NEW: Multi-role analysis
  multiRole: router({
    analyze: protectedProcedure
      .input(z.object({
        resumeText: z.string(),
        jobDescription: z.string().optional(),
        customKeywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return analyzeMultiRole(input.resumeText, input.customKeywords, input.jobDescription);
      }),

    analyzeCustomRole: protectedProcedure
      .input(z.object({
        resumeText: z.string(),
        jobDescription: z.string(),
        customKeywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return analyzeCustomRole(input.resumeText, input.jobDescription, input.customKeywords);
      }),
  }),

  // NEW: Export service
  export: router({
    resume: protectedProcedure
      .input(z.object({
        resumeId: z.number(),
        format: z.enum(["pdf", "docx", "markdown", "json", "csv"]),
        includeAnalysis: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const resume = await getResumeById(input.resumeId);
        if (!resume || resume.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const analysis = await getAnalysisByResumeId(input.resumeId);
        const result = await exportResume(resume, analysis ?? undefined, {
          format: input.format as any,
          includeAnalysis: input.includeAnalysis,
        });

        return {
          filename: result.filename,
          mimeType: result.mimeType,
          dataUrl: `data:${result.mimeType};base64,${Buffer.isBuffer(result.buffer) ? result.buffer.toString("base64") : Buffer.from(result.buffer).toString("base64")}`,
        };
      }),

    analysisReport: protectedProcedure
      .input(z.object({
        analysisId: z.number(),
        format: z.enum(["pdf", "json", "markdown"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const analysis = await getAnalysisById(input.analysisId);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const resume = await getResumeById(analysis.resumeId);
        if (!resume) throw new TRPCError({ code: "NOT_FOUND" });

        const result = await exportAnalysisReport(resume, analysis, input.format as any);

        return {
          filename: result.filename,
          mimeType: result.mimeType,
          dataUrl: `data:${result.mimeType};base64,${Buffer.isBuffer(result.buffer) ? result.buffer.toString("base64") : Buffer.from(result.buffer).toString("base64")}`,
        };
      }),

    bulkExport: protectedProcedure
      .input(z.object({
        analysisIds: z.array(z.number()),
        format: z.enum(["csv", "json"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const result = await exportBulkAnalyses([], input.format);

        return {
          filename: result.filename,
          mimeType: result.mimeType,
          dataUrl: `data:${result.mimeType};base64,${Buffer.isBuffer(result.buffer) ? result.buffer.toString("base64") : Buffer.from(result.buffer).toString("base64")}`,
        };
      }),
  }),

  // NEW: Cover letter generation
  coverLetter: router({
    generate: protectedProcedure
      .input(z.object({
        resumeText: z.string(),
        jobDescription: z.string(),
        jobTitle: z.string().optional(),
        company: z.string().optional(),
        tone: z.enum(["professional", "friendly", "enthusiastic"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const result = await generateCoverLetter({
          resumeText: input.resumeText,
          jobDescription: input.jobDescription,
          jobTitle: input.jobTitle,
          company: input.company,
          tone: input.tone,
        });

        return result;
      }),

    calculateScore: publicProcedure
      .input(z.object({
        coverLetter: z.string(),
        jobDescription: z.string(),
      }))
      .query(({ input }) => {
        const score = calculateCoverLetterScore(input.coverLetter, input.jobDescription);
        return { score: Math.round(score * 10) / 10 };
      }),
  }),

  // NEW: Benchmarking
  benchmark: router({
    calculatePercentile: publicProcedure
      .input(z.object({
        score: z.number(),
        roleKey: z.string(),
      }))
      .query(({ input }) => {
        return calculateUserPercentile(input.score, input.roleKey);
      }),

    compareRoles: publicProcedure
      .input(z.object({
        scores: z.record(z.string(), z.number()),
      }))
      .query(({ input }) => {
        return compareMultipleRoles(input.scores);
      }),

    generateReport: publicProcedure
      .input(z.object({
        score: z.number(),
        roleKey: z.string(),
      }))
      .query(({ input }) => {
        const report = generateBenchmarkReport(input.score, input.roleKey);
        return { report };
      }),

    trackProgression: publicProcedure
      .input(z.object({
        scores: z.array(z.object({
          date: z.date(),
          score: z.number(),
        })),
      }))
      .query(({ input }) => {
        return calculateScoreProgression(input.scores);
      }),
  }),

  // NEW: Templates
  templates: router({
    getAll: publicProcedure.query(() => {
      return getAllTemplates();
    }),

    getByRole: publicProcedure
      .input(z.object({ roleKey: z.string() }))
      .query(({ input }) => {
        return getTemplateByRole(input.roleKey);
      }),

    getByIndustry: publicProcedure
      .input(z.object({ industry: z.string() }))
      .query(({ input }) => {
        return getTemplatesByIndustry(input.industry);
      }),

    getRecommendations: publicProcedure
      .input(z.object({
        jobDescription: z.string(),
        industry: z.string(),
      }))
      .query(({ input }) => {
        return getTemplateRecommendations(input.jobDescription, input.industry);
      }),

    applyTemplate: publicProcedure
      .input(z.object({
        resumeText: z.string(),
        templateId: z.number(),
      }))
      .query(({ input }) => {
        const template = getAllTemplates().find((t) => t.id === input.templateId);
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });
        return applyTemplate(input.resumeText, template);
      }),
  }),

  // NEW: Utility routes
  util: router({
    getJobRoles: publicProcedure.query(() => {
      return Object.values(JOB_ROLES).map((role) => ({
        key: role.key,
        label: role.label,
        industry: role.industry,
      }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
