#!/usr/bin/env node

import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QuestionRow {
  questionId: string;
  clauseRef: string;
  text: string;
  responseType: string;
  required: boolean;
  evidenceRequired: boolean;
  appendix?: string;
  weight: number;
  helpText?: string;
}

const HEADER_SYNONYMS = {
  questionId: ['question_id', 'id', 'qid', 'q_id'],
  clauseRef: ['clause_ref', 'clause', 'requirement', 'citation'],
  text: ['text', 'question', 'prompt'],
  responseType: ['response_type', 'type'],
  required: ['required', 'is_required', 'mandatory'],
  evidenceRequired: ['evidence_required', 'requires_evidence'],
  appendix: ['appendix', 'scope'],
  weight: ['weight', 'score_weight'],
  helpText: ['help_text', 'guidance']
};

function mapHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      if (synonyms.includes(header)) {
        mapping[field] = i;
        break;
      }
    }
  }
  
  return mapping;
}

function parseRow(row: string[], mapping: Record<string, number>): QuestionRow | null {
  const questionId = row[mapping.questionId]?.trim();
  const clauseRef = row[mapping.clauseRef]?.trim();
  const text = row[mapping.text]?.trim();
  const responseType = row[mapping.responseType]?.trim();
  
  if (!questionId || !clauseRef || !text || !responseType) {
    return null;
  }
  
  return {
    questionId,
    clauseRef,
    text,
    responseType,
    required: ['true', '1', 'yes'].includes(row[mapping.required]?.toLowerCase()?.trim() || 'false'),
    evidenceRequired: ['true', '1', 'yes'].includes(row[mapping.evidenceRequired]?.toLowerCase()?.trim() || 'false'),
    appendix: row[mapping.appendix]?.trim() || undefined,
    weight: parseFloat(row[mapping.weight]?.trim() || '1'),
    helpText: row[mapping.helpText]?.trim() || undefined
  };
}

async function detectDelimiter(content: string): Promise<string> {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = content.split('\n')[0];
  
  let bestDelimiter = ',';
  let maxFields = 0;
  
  for (const delimiter of delimiters) {
    const fields = firstLine.split(delimiter).length;
    if (fields > maxFields) {
      maxFields = fields;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

async function importQuestions(filePath: string): Promise<void> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const delimiter = await detectDelimiter(content);
    
    console.log(`Using delimiter: "${delimiter}"`);
    
    const records: string[][] = await new Promise((resolve, reject) => {
      parse(content, {
        delimiter,
        skip_empty_lines: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
    
    if (records.length === 0) {
      console.log('No records found in CSV');
      return;
    }
    
    const headers = records[0];
    const mapping = mapHeaders(headers);
    
    console.log('Header mapping:', mapping);
    
    // Upsert StandardVersion
    const standardVersion = await prisma.standardVersion.upsert({
      where: { code: 'R2V3_1' },
      update: {},
      create: {
        code: 'R2V3_1',
        name: 'R2 v3.1'
      }
    });
    
    const questions: QuestionRow[] = [];
    const clauses = new Set<string>();
    let skipped = 0;
    
    for (let i = 1; i < records.length; i++) {
      const questionRow = parseRow(records[i], mapping);
      if (questionRow) {
        questions.push(questionRow);
        clauses.add(questionRow.clauseRef);
      } else {
        skipped++;
      }
    }
    
    console.log(`Parsed ${questions.length} questions, skipped ${skipped} invalid rows`);
    
    // Upsert Clauses
    for (const clauseRef of Array.from(clauses)) {
      await prisma.clause.upsert({
        where: { ref: clauseRef },
        update: {},
        create: {
          ref: clauseRef,
          title: `Clause ${clauseRef}`,
          stdId: standardVersion.id
        }
      });
    }
    
    // Upsert Questions
    let imported = 0;
    for (const question of questions) {
      const clause = await prisma.clause.findUnique({
        where: { ref: question.clauseRef }
      });
      
      if (clause) {
        await prisma.question.upsert({
          where: { questionId: question.questionId },
          update: {
            text: question.text,
            responseType: question.responseType,
            required: question.required,
            evidenceRequired: question.evidenceRequired,
            appendix: question.appendix,
            weight: question.weight,
            helpText: question.helpText
          },
          create: {
            questionId: question.questionId,
            clauseId: clause.id,
            text: question.text,
            responseType: question.responseType,
            required: question.required,
            evidenceRequired: question.evidenceRequired,
            appendix: question.appendix,
            weight: question.weight,
            helpText: question.helpText
          }
        });
        imported++;
      }
    }
    
    // Generate coverage report
    const coverage: Record<string, number> = {};
    
    // CR1..CR10
    for (let i = 1; i <= 10; i++) {
      const crRef = `CR${i}`;
      const count = await prisma.question.count({
        where: {
          clause: {
            ref: {
              startsWith: crRef
            }
          }
        }
      });
      coverage[crRef] = count;
    }
    
    // APP-A..APP-G
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      const appRef = `APP-${letter}`;
      const count = await prisma.question.count({
        where: {
          clause: {
            ref: {
              startsWith: appRef
            }
          }
        }
      });
      coverage[appRef] = count;
    }
    
    // Print coverage table
    console.log('\nCoverage Report:');
    console.log('================');
    
    for (let i = 1; i <= 10; i++) {
      const crRef = `CR${i}`;
      console.log(`${crRef.padEnd(8)}: ${coverage[crRef]} questions`);
    }
    
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      const appRef = `APP-${letter}`;
      console.log(`${appRef.padEnd(8)}: ${coverage[appRef]} questions`);
    }
    
    // Check for missing/duplicates
    const allQuestionIds = questions.map(q => q.questionId);
    const uniqueQuestionIds = new Set(allQuestionIds);
    const duplicates = allQuestionIds.length - uniqueQuestionIds.size;
    
    const otherClauses = await prisma.question.count({
      where: {
        clause: {
          ref: {
            notIn: [
              ...Array.from({length: 10}, (_, i) => `CR${i + 1}`),
              'APP-A', 'APP-B', 'APP-C', 'APP-D', 'APP-E', 'APP-F', 'APP-G'
            ]
          }
        }
      }
    });
    
    console.log(`\nMissing/Other: ${otherClauses} questions`);
    console.log(`Duplicates: ${duplicates}`);
    console.log(`\nTotal imported: ${imported}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this file is being run directly
const isMain = import.meta.url === new URL(process.argv[1], 'file:').href;

if (isMain) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ts-node import-questions.ts <csv-file>');
    process.exit(1);
  }
  
  importQuestions(filePath);
}

export { importQuestions };