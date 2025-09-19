import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const router = Router();
const prisma = new PrismaClient();

// GET /api/exports/:assessmentId/pdf
router.get("/:assessmentId/pdf", async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    // Validate assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { 
        id: true, 
        createdAt: true, 
        stdId: true,
        standard: { select: { code: true } }
      }
    });
    
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    // Query all questions for this standard
    const questions = await prisma.question.findMany({
      where: { clause: { stdId: assessment.stdId } },
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
    
    // Query all answers for this assessment
    const answers = await prisma.answer.findMany({
      where: { assessmentId: assessment.id },
      select: { 
        questionId: true, 
        value: true, 
        question: { select: { questionId: true } }
      }
    });
    
    // Map answers by questionId (human-readable)
    const answerMap = new Map(answers.map(a => [a.question.questionId, a.value]));
    
    // Group questions by clause
    const clauseMap = new Map<string, { ref: string; title: string; questions: any[] }>();
    for (const q of questions) {
      const ref = q.clause?.ref ?? 'UNSPEC';
      const title = q.clause?.title ?? 'Unspecified';
      if (!clauseMap.has(ref)) clauseMap.set(ref, { ref, title, questions: [] });
      clauseMap.get(ref)!.questions.push(q);
    }
    
    // Generate PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="RUR2_Assessment_${assessmentId}.pdf"`);
    
    // Stream PDF directly to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(16).text('RUR2 – R2v3.1 Pre-Certification Self-Assessment', { align: 'center' });
    doc.moveDown(2);
    
    // Summary page
    doc.fontSize(14).text('Assessment Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10)
       .text(`Assessment ID: ${assessment.id}`)
       .text(`Created: ${assessment.createdAt.toISOString()}`)
       .text(`Standard: ${assessment.standard?.code || 'Unknown'}`)
       .text(`Total Questions: ${questions.length}`)
       .text(`Required Questions: ${questions.filter(q => q.required).length}`);
    
    doc.moveDown(2);
    
    // Content by clause
    for (const [clauseRef, clauseData] of clauseMap.entries()) {
      doc.addPage();
      doc.fontSize(12).text(`${clauseRef}: ${clauseData.title}`, { underline: true });
      doc.moveDown();
      
      for (const question of clauseData.questions) {
        doc.fontSize(10);
        
        // Question text
        doc.text(`${question.questionId} — ${question.text}`, { continued: false });
        
        // Answer
        const answerValue = answerMap.get(question.questionId);
        const displayAnswer = answerValue !== null && answerValue !== undefined 
          ? String(answerValue) 
          : 'blank';
        doc.text(`Answer: ${displayAnswer}`, { indent: 20 });
        
        // Flags and metadata
        const flags = [];
        if (question.required) flags.push('Required');
        if (question.evidenceRequired) flags.push('Evidence Required');
        if (question.category_code) flags.push(`Category: ${question.category_code}`);
        
        if (flags.length > 0) {
          doc.text(`[${flags.join(', ')}]`, { indent: 20, fontSize: 8 });
        }
        
        doc.moveDown(0.5);
      }
    }
    
    // Footer with page numbers (PDFKit uses 0-based indexing internally)
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(`Page ${i - pages.start + 1} of ${pages.count}`, 
        50, doc.page.height - 50, { align: 'center' });
    }
    
    doc.end();
    
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// GET /api/exports/:assessmentId/excel
router.get("/:assessmentId/excel", async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    // Validate assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { 
        id: true, 
        createdAt: true, 
        stdId: true,
        standard: { select: { code: true } }
      }
    });
    
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    
    // Query all questions for this standard
    const questions = await prisma.question.findMany({
      where: { clause: { stdId: assessment.stdId } },
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
    
    // Query all answers for this assessment
    const answers = await prisma.answer.findMany({
      where: { assessmentId: assessment.id },
      select: { 
        questionId: true, 
        value: true, 
        question: { select: { questionId: true } }
      }
    });
    
    // Map answers by questionId (human-readable)
    const answerMap = new Map(answers.map(a => [a.question.questionId, a.value]));
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Assessment Summary']);
    summarySheet.addRow(['Assessment ID', assessment.id]);
    summarySheet.addRow(['Created', assessment.createdAt.toISOString()]);
    summarySheet.addRow(['Standard', assessment.standard?.code || 'Unknown']);
    summarySheet.addRow(['Total Questions', questions.length]);
    summarySheet.addRow(['Required Questions', questions.filter(q => q.required).length]);
    summarySheet.addRow(['Answered Questions', answers.length]);
    
    // Answers Sheet
    const answersSheet = workbook.addWorksheet('Answers');
    answersSheet.addRow([
      'clauseRef', 'questionId', 'text', 'answer', 'required', 
      'evidenceRequired', 'appendix', 'category_code', 'category', 'category_name'
    ]);
    
    for (const question of questions) {
      const answerValue = answerMap.get(question.questionId);
      const displayAnswer = answerValue !== null && answerValue !== undefined 
        ? String(answerValue) 
        : '';
        
      answersSheet.addRow([
        question.clause?.ref || 'UNSPEC',
        question.questionId,
        question.text,
        displayAnswer,
        question.required,
        question.evidenceRequired,
        question.appendix || '',
        question.category_code || '',
        question.category || '',
        question.category_name || ''
      ]);
    }
    
    // Coverage Sheet
    const coverageSheet = workbook.addWorksheet('Coverage');
    coverageSheet.addRow(['Clause', 'Total Questions', 'Answered Questions']);
    
    // Group by clause for coverage
    const clauseCounts = new Map<string, { total: number; answered: number }>();
    for (const question of questions) {
      const ref = question.clause?.ref || 'UNSPECIFIED';
      if (!clauseCounts.has(ref)) clauseCounts.set(ref, { total: 0, answered: 0 });
      clauseCounts.get(ref)!.total++;
      if (answerMap.has(question.questionId)) {
        clauseCounts.get(ref)!.answered++;
      }
    }
    
    // Sort clauses (CR1-CR10, APP-A-G, others)
    const sortedClauses = Array.from(clauseCounts.keys()).sort((a, b) => {
      if (a.startsWith('CR') && b.startsWith('CR')) {
        return parseInt(a.substring(2)) - parseInt(b.substring(2));
      }
      if (a.startsWith('APP-') && b.startsWith('APP-')) {
        return a.localeCompare(b);
      }
      if (a.startsWith('CR')) return -1;
      if (b.startsWith('CR')) return 1;
      if (a.startsWith('APP-')) return -1;
      if (b.startsWith('APP-')) return 1;
      return a.localeCompare(b);
    });
    
    for (const clauseRef of sortedClauses) {
      const counts = clauseCounts.get(clauseRef)!;
      coverageSheet.addRow([clauseRef, counts.total, counts.answered]);
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="RUR2_Assessment_${assessmentId}.xlsx"`);
    
    // Stream workbook directly to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Excel export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;