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
router.get('/:id/questions', async (req, res) => {
  const { id } = req.params;

  const a = await prisma.assessment.findUnique({
    where: { id },
    select: { id: true, stdId: true, standard: { select: { code: true } } }
  });
  if (!a) return res.status(404).json({ error: 'Assessment not found' });

  // Pull all questions linked to this assessment's standard by joining via Clause
  const qs = await prisma.question.findMany({
    where: { clause: { stdId: a.stdId } },
    select: {
      id: true,
      questionId: true,
      text: true,
      required: true,
      evidenceRequired: true,
      responseType: true,
      appendix: true,
      category: true,
      category_code: true,
      category_name: true,
      clause: { select: { ref: true, title: true } }
    },
    orderBy: [{ clause: { ref: 'asc' } }, { questionId: 'asc' }]
  });

  // Before grouping, fetch current answers (map by Question.questionId, not Question.id)
  const existing = await prisma.answer.findMany({
    where: { assessmentId: a.id },
    select: { questionId: true, value: true, question: { select: { questionId: true } } }
  });
  const aMap = new Map(existing.map(x => [x.question.questionId, x.value]));

  // Group by clause.ref
  const map = new Map<string, { clauseRef: string; clauseTitle: string; questions: any[] }>();
  for (const q of qs) {
    const ref = q.clause?.ref ?? 'UNSPEC';
    const title = q.clause?.title ?? 'Unspecified';
    if (!map.has(ref)) map.set(ref, { clauseRef: ref, clauseTitle: title, questions: [] });
    const { clause, ...rest } = q as any;
    map.get(ref)!.questions.push({ ...rest, answer: aMap.get(rest.questionId) ?? null });
  }

  const groups = Array.from(map.values());
  const totalQuestions = qs.length;
  const requiredCount = qs.filter(q => q.required).length;

  res.json({
    assessmentId: a.id,
    standardCode: a.standard?.code ?? null,
    groups,
    totalQuestions,
    requiredCount
  });
});


export default router;