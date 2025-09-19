import { useEffect, useState, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "../../api";

interface Question {
  id: string;
  questionId: string;
  text: string;
  required: boolean;
  evidenceRequired: boolean;
  responseType: string;
  appendix: string | null;
  category: string | null;
  category_code: string | null;
  category_name: string | null;
}

interface ClauseGroup {
  clauseRef: string;
  clauseTitle: string;
  questions: Question[];
}

interface QuestionsResponse {
  assessmentId: string;
  standardCode: string;
  groups: ClauseGroup[];
  totalQuestions: number;
  requiredCount: number;
}

interface Answer {
  questionId: string;
  value: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function QuestionsTab() {
  const [match, params] = useRoute("/assessments/:id");
  const assessmentId = params?.id;
  
  const [questionsData, setQuestionsData] = useState<QuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local answer state keyed by questionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({});
  
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const pendingAnswers = useRef<Set<string>>(new Set());

  // Load questions on mount
  useEffect(() => {
    if (!assessmentId) return;

    const loadQuestions = async () => {
      try {
        setLoading(true);
        const data = await apiGet<QuestionsResponse>(`/api/assessments/${assessmentId}/questions`);
        setQuestionsData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [assessmentId]);

  // Debounced batch save function
  const savePendingAnswers = useCallback(async () => {
    if (!assessmentId || pendingAnswers.current.size === 0) return;

    const answersToSave: Answer[] = Array.from(pendingAnswers.current).map(questionId => ({
      questionId,
      value: answers[questionId]
    }));

    // Mark all pending as saving
    const statusUpdates: Record<string, SaveStatus> = {};
    answersToSave.forEach(({ questionId }) => {
      statusUpdates[questionId] = 'saving';
    });
    setSaveStatuses(prev => ({ ...prev, ...statusUpdates }));

    try {
      await apiPost<{ upserted: number }>(`/api/answers/${assessmentId}/batch`, {
        answers: answersToSave
      });
      
      // Mark all as saved
      answersToSave.forEach(({ questionId }) => {
        statusUpdates[questionId] = 'saved';
      });
      setSaveStatuses(prev => ({ ...prev, ...statusUpdates }));
      
      // Clear pending answers
      pendingAnswers.current.clear();
      
      // Auto-hide saved status after 2 seconds
      setTimeout(() => {
        setSaveStatuses(prev => {
          const newStatuses = { ...prev };
          answersToSave.forEach(({ questionId }) => {
            if (newStatuses[questionId] === 'saved') {
              newStatuses[questionId] = 'idle';
            }
          });
          return newStatuses;
        });
      }, 2000);
      
    } catch (err) {
      // Mark all as error
      answersToSave.forEach(({ questionId }) => {
        statusUpdates[questionId] = 'error';
      });
      setSaveStatuses(prev => ({ ...prev, ...statusUpdates }));
    }
  }, [assessmentId, answers]);

  // Handle answer change with debouncing
  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    pendingAnswers.current.add(questionId);
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout
    debounceTimeout.current = setTimeout(savePendingAnswers, 600);
  }, [savePendingAnswers]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      // Immediately save pending changes
      if (pendingAnswers.current.size > 0) {
        savePendingAnswers();
      }
    };
  }, [savePendingAnswers]);

  if (!match || !assessmentId) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-dimgrey">Loading questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!questionsData) return null;

  const renderQuestion = (question: Question) => {
    const questionFieldId = `question-${question.questionId}`;
    const currentAnswer = answers[question.questionId] || '';
    const saveStatus = saveStatuses[question.questionId] || 'idle';

    if (question.responseType === 'yes_no') {
      return (
        <div className="space-y-3" role="group" aria-labelledby={questionFieldId}>
          <Label 
            id={questionFieldId}
            className="text-sm font-medium text-foreground"
            data-testid={`q-${question.questionId}-label`}
          >
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          <RadioGroup 
            value={currentAnswer} 
            onValueChange={(value) => handleAnswerChange(question.questionId, value)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="Yes" 
                id={`${questionFieldId}-yes`}
                data-testid={`q-${question.questionId}-yes`}
              />
              <Label htmlFor={`${questionFieldId}-yes`} className="text-sm">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="No" 
                id={`${questionFieldId}-no`}
                data-testid={`q-${question.questionId}-no`}
              />
              <Label htmlFor={`${questionFieldId}-no`} className="text-sm">
                No
              </Label>
            </div>
          </RadioGroup>

          <div className="flex items-center space-x-2 text-xs">
            {saveStatus === 'saving' && <span className="text-blue-600">Saving...</span>}
            {saveStatus === 'saved' && <span className="text-green-600">Saved</span>}
            {saveStatus === 'error' && <span className="text-red-600">Error</span>}
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <Label 
            htmlFor={questionFieldId}
            className="text-sm font-medium text-foreground"
            data-testid={`q-${question.questionId}-label`}
          >
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          <Input
            id={questionFieldId}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
            data-testid={`q-${question.questionId}-input`}
          />

          <div className="flex items-center space-x-2 text-xs">
            {saveStatus === 'saving' && <span className="text-blue-600">Saving...</span>}
            {saveStatus === 'saved' && <span className="text-green-600">Saved</span>}
            {saveStatus === 'error' && <span className="text-red-600">Error</span>}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {questionsData.totalQuestions}
              </div>
              <div className="text-sm text-dimgrey">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {questionsData.requiredCount}
              </div>
              <div className="text-sm text-dimgrey">Required</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {questionsData.standardCode}
              </div>
              <div className="text-sm text-dimgrey">Standard</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Groups */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Assessment Questions</h3>
          
          <Accordion type="multiple" className="space-y-2">
            {questionsData.groups.map((group) => (
              <AccordionItem 
                key={group.clauseRef} 
                value={group.clauseRef}
                data-testid={`clause-${group.clauseRef}`}
              >
                <AccordionTrigger className="text-left">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium">
                      {group.clauseRef}: {group.clauseTitle}
                    </span>
                    <span className="text-sm text-dimgrey bg-muted px-2 py-1 rounded">
                      {group.questions.length} questions
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    {group.questions.map((question, index) => (
                      <div 
                        key={question.id}
                        className="border-l-2 border-muted pl-4"
                        data-testid={`q-${question.questionId}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-dimgrey font-mono">
                            {question.questionId}
                          </span>
                          {question.evidenceRequired && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Evidence Required
                            </span>
                          )}
                        </div>
                        
                        {renderQuestion(question)}
                        
                        {question.category && (
                          <div className="text-xs text-dimgrey mt-2">
                            Category: {question.category_name || question.category}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}