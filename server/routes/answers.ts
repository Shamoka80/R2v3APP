import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// POST /api/answers/:assessmentId/batch
const batchAnswersSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    value: z.any()
  })).min(1).max(100)
});

router.post("/:assessmentId/batch", async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;
    const { answers } = batchAnswersSchema.parse(req.body);
    
    // Verify assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });
    
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    // Batch upsert answers in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let upserted = 0;
      for (const answer of answers) {
        // Find the question by questionId to get the internal id
        const question = await tx.question.findUnique({
          where: { questionId: answer.questionId }
        });
        
        if (question) {
          await tx.answer.upsert({
            where: {
              assessmentId_questionId: {
                assessmentId,
                questionId: question.id
              }
            },
            update: {
              value: answer.value
            },
            create: {
              assessmentId,
              questionId: question.id,
              value: answer.value
            }
          });
          upserted++;
        }
      }
      return { upserted };
    });
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request body", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;