import { Router } from 'express';
import multer from 'multer';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Import the function from CLI tool
import { importQuestions } from '../tools/import-questions';

router.post('/import-questions', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }

    // Write uploaded file to temporary location
    const tempPath = join(process.cwd(), 'temp-import.csv');
    writeFileSync(tempPath, req.file.buffer);

    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await importQuestions(tempPath);
      console.log = originalLog;
      
      // Clean up temp file
      unlinkSync(tempPath);
      
      res.json({
        success: true,
        message: 'Questions imported successfully',
        logs: logs
      });
    } catch (error) {
      console.log = originalLog;
      unlinkSync(tempPath);
      
      res.status(500).json({
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/import-questions/coverage', async (req, res) => {
  try {
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
    
    // Total questions
    const total = await prisma.question.count();
    
    res.json({
      coverage,
      total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get coverage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;