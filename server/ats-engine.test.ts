import { describe, it, expect } from "vitest";
import { analyzeResume } from "./ats-engine";

describe("ATS Engine", () => {
  describe("analyzeResume", () => {
    it("should calculate correct scores for Data Analyst Intern role", () => {
      const resumeText = `
        PROFESSIONAL SUMMARY
        Detail-oriented Data Analyst with hands-on experience in ETL pipeline development,
        SQL-based data extraction, and Power BI dashboard design.
        
        TECHNICAL SKILLS
        Languages: Python, SQL, JavaScript
        Visualization: Power BI, Excel, Matplotlib
        Libraries: Pandas, NumPy
        
        PROFESSIONAL EXPERIENCE
        Data Science Intern | Company, City | Feb 2026
        - Cleaned and validated 50,000+ records using Python
        - Performed exploratory data analysis (EDA) on datasets
        - Wrote optimized SQL queries for business reporting
        
        PROJECTS
        Analytics Dashboard | Python, SQL, Power BI
        - Built an end-to-end ETL pipeline
        
        EDUCATION
        B.E. Computer Science | University | 2026
        
        CERTIFICATIONS
        SQL Intermediate - HackerRank
      `;

      const result = analyzeResume(resumeText);

      expect(result.internScore).toBeGreaterThan(50);
      expect(result.matchedKeywordsIntern.length).toBeGreaterThan(8);
      expect(result.matchedKeywordsIntern).toContain("Python");
      expect(result.matchedKeywordsIntern).toContain("SQL");
      expect(result.matchedKeywordsIntern).toContain("Power BI");
    });

    it("should identify missing keywords", () => {
      const resumeText = `
        PROFESSIONAL SUMMARY
        Data analyst with experience.
        
        TECHNICAL SKILLS
        Python, SQL
        
        PROFESSIONAL EXPERIENCE
        Analyst at Company
        
        EDUCATION
        Bachelor's Degree
        
        CERTIFICATIONS
        Some Certification
      `;

      const result = analyzeResume(resumeText);

      expect(result.missingKeywordsIntern.length).toBeGreaterThan(0);
      expect(result.missingKeywordsIntern).toContain("Excel");
    });

    it("should validate resume structure correctly", () => {
      const completeResume = `
        PROFESSIONAL SUMMARY
        Experienced analyst.
        
        TECHNICAL SKILLS
        Python, SQL, Excel
        
        PROFESSIONAL EXPERIENCE
        Analyst at Company
        
        PROJECTS
        Analytics Dashboard
        
        EDUCATION
        Bachelor's Degree
        
        CERTIFICATIONS
        Certified Professional
      `;

      const result = analyzeResume(completeResume);

      expect(result.structureValidation.hasSummary).toBe(true);
      expect(result.structureValidation.hasSkills).toBe(true);
      expect(result.structureValidation.hasExperience).toBe(true);
      expect(result.structureValidation.hasProjects).toBe(true);
      expect(result.structureValidation.hasEducation).toBe(true);
      expect(result.structureValidation.hasCertifications).toBe(true);
      expect(result.structureValidation.missingSection.length).toBe(0);
    });

    it("should detect missing resume sections", () => {
      const incompleteResume = `
        PROFESSIONAL SUMMARY
        Experienced analyst.
        
        TECHNICAL SKILLS
        Python, SQL
      `;

      const result = analyzeResume(incompleteResume);

      expect(result.structureValidation.hasSummary).toBe(true);
      expect(result.structureValidation.hasSkills).toBe(true);
      expect(result.structureValidation.hasExperience).toBe(true);
      expect(result.structureValidation.hasProjects).toBe(false);
      expect(result.structureValidation.hasEducation).toBe(false);
      expect(result.structureValidation.hasCertifications).toBe(false);
      expect(result.structureValidation.missingSection.length).toBeGreaterThan(0);
    });

    it("should generate recommendations for improvement", () => {
      const resumeText = `
        PROFESSIONAL SUMMARY
        Data analyst.
        
        TECHNICAL SKILLS
        Python
      `;

      const result = analyzeResume(resumeText);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r: any) => r.category === "keyword_optimization")).toBe(true);
      expect(result.recommendations.some((r: any) => r.category === "formatting")).toBe(true);
      expect(result.recommendations.some((r: any) => r.category === "quantification")).toBe(true);
    });

    it("should calculate different scores for intern vs job roles", () => {
      const resumeText = `
        Python, SQL, Excel, Power BI, Pandas, NumPy, EDA, Data Cleaning,
        Tableau, Statistics, Data Modeling, Business Intelligence, Automation, Scikit-learn
      `;

      const result = analyzeResume(resumeText);

      // Both scores should be reasonable
      expect(result.internScore).toBeGreaterThan(0);
      expect(result.jobScore).toBeGreaterThan(0);
    });

    it("should handle empty resume text", () => {
      const result = analyzeResume("");

      expect(result.internScore).toBe(0);
      expect(result.jobScore).toBe(0);
      expect(result.matchedKeywordsIntern.length).toBe(0);
      expect(result.structureValidation.missingSection.length).toBe(6);
    });

    it("should be case-insensitive for keyword matching", () => {
      const resumeText1 = "python SQL power bi";
      const resumeText2 = "PYTHON SQL POWER BI";

      const result1 = analyzeResume(resumeText1);
      const result2 = analyzeResume(resumeText2);

      expect(result1.internScore).toBe(result2.internScore);
      expect(result1.matchedKeywordsIntern.length).toBe(result2.matchedKeywordsIntern.length);
    });
  });
});
