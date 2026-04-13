import { COOKIE_NAME } from "@shared/const";
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
        return await getResumesByUserId(ctx.user.id);
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
          internScore: input.internScore,
          jobScore: input.jobScore,
          matchedKeywordsIntern: JSON.stringify(input.matchedKeywordsIntern),
          missingKeywordsIntern: JSON.stringify(input.missingKeywordsIntern),
          matchedKeywordsJob: JSON.stringify(input.matchedKeywordsJob),
          missingKeywordsJob: JSON.stringify(input.missingKeywordsJob),
          structureValidation: JSON.stringify(input.structureValidation),
          recommendations: JSON.stringify(input.recommendations),
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
});

export type AppRouter = typeof appRouter;
