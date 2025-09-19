import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// POST /api/assessments
const createAssessmentSchema = z.object({
  stdCode: z.string().optional().default("R2V3_1")
});

router.post("/", async (req, res) => {
  try {
    const { stdCode } = createAssessmentSchema.parse(req.body);
    
    const standard = await prisma.standardVersion.findFirst({
      where: { code: stdCode }
    });
    
    if (!standard) {
      return res.status(404).json({ error: "Standard version not found" });
    }
    
    const assessment = await prisma.assessment.create({
      data: {
        stdId: standard.id
      }
    });
    
    res.json({
      id: assessment.id,
      stdId: assessment.stdId,
      createdAt: assessment.createdAt
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request body", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/assessments/:id/questions
router.get("/:id/questions", async (req, res) => {
  try {
    const assessmentId = req.params.id;
    
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        standard: {
          include: {
            clauses: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });
    
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    const groups = assessment.standard.clauses.map(clause => ({
      clauseRef: clause.ref,
      clauseTitle: clause.title,
      questions: clause.questions.map(question => ({
        id: question.id,
        questionId: question.questionId,
        text: question.text,
        required: question.required,
        evidenceRequired: question.evidenceRequired,
        responseType: question.responseType,
        appendix: question.appendix,
        category: question.category,
        category_code: question.category_code,
        category_name: question.category_name
      }))
    }));
    
    const totalQuestions = groups.reduce((sum, group) => sum + group.questions.length, 0);
    const requiredCount = groups.reduce((sum, group) => 
      sum + group.questions.filter(q => q.required).length, 0);
    
    res.json({
      assessmentId: assessment.id,
      standardCode: assessment.standard.code,
      groups,
      totalQuestions,
      requiredCount
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;