
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Check, MoreVertical, Star, Shield, Flag, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoalForm } from "./goals/GoalForm";
import { useCbtJournal } from "@/hooks/use-cbt-journal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Confetti from "react-confetti";
import type { Goal } from "@/types";

type GoalFilter = "all" | "in-progress" | "completed" | "overdue";

export function GoalsMode() {
  const { goals, cbtEntries, addGoal, updateGoal, deleteGoal, completeGoal, linkGoalToCbtEntry, t } = useCbtJournal();
  const [filter, setFilter] = useState<GoalFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial size
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const filteredGoals = goals.filter((goal) => {
    if (filter === "all") return true;
    return goal.status === filter;
  });

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleCompleteGoal = async (id: string) => {
    await completeGoal(id);
    setShowConfetti(true);
  };
  
  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
  }
  
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setIsCreateOpen(true);
  }

  const closeAndResetForms = () => {
    setIsCreateOpen(false);
    setEditingGoal(null);
    setIsLinkOpen(null);
  };

  const getPriorityIcon = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return <Flag className="text-destructive h-4 w-4" />;
      case 'medium': return <Shield className="text-yellow-500 h-4 w-4" />;
      case 'low': return <Star className="text-green-500 h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: Goal['status']) => {
    switch(status) {
        case 'completed': return <Check className="text-green-500 h-4 w-4" />;
        case 'in-progress': return <Clock className="text-blue-500 h-4 w-4" />;
        case 'overdue': return <AlertTriangle className="text-destructive h-4 w-4" />;
        default: return null;
    }
  }

  return (
    <div className="p-2 relative">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} gravity={0.1} />}
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div className="flex-grow">
            <CardTitle>{t('goals.title')}</CardTitle>
            <CardDescription>{t('goals.description')}</CardDescription>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-grow sm:flex-grow-0">{t('goals.filter')}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter("all")}>{t('goals.all')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("in-progress")}>{t('goals.in_progress')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("completed")}>{t('goals.completed')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("overdue")}>{t('goals.overdue')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleOpenCreate}
              className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md sm:h-12 sm:w-12"
              aria-label={t('goals.new_button')}
              data-tour="goals-create"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <p className="text-gray-500">{t('goals.no_goals')}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm" data-tour="goals-card">
                  <CardHeader className="p-3 sm:p-4 flex flex-row items-start justify-between">
                    <div className="flex-grow">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                        {goal.title}
                      </h3>
                      {goal.description && <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{goal.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-300 mt-1">
                        <span className="flex items-center gap-1" title={t('goals.priority')}>
                          {getPriorityIcon(goal.priority)} {t(`goals.priority_${goal.priority}`)}
                        </span>
                        <span title={t('goals.difficulty')}>{t('goals.difficulty')}: {goal.difficulty}/10</span>
                      </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t('goals.more_options')}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleOpenEdit(goal)}>{t('goals.edit')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompleteGoal(goal.id)} disabled={goal.status === "completed"}>
                                <Check className="h-4 w-4 mr-1" /> {t('goals.complete')}
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setIsLinkOpen(goal.id)} disabled={!cbtEntries.length}>
                                {t('goals.link_to_journal')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteGoal(goal.id)} className="text-destructive">
                                {t('goals.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 sm:mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm flex items-center gap-1">
                            {getStatusIcon(goal.status)}
                            {t(`goals.status_${goal.status}`)}
                        </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goal_modal_title')}</DialogTitle>
          </DialogHeader>
          <GoalForm
            onSave={async (data) => {
              await addGoal(data as any);
              closeAndResetForms();
            }}
            onClose={closeAndResetForms}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent>
           <DialogHeader>
            <DialogTitle>{t('goal_edit_title')}</DialogTitle>
          </DialogHeader>
          <GoalForm
            initialData={editingGoal!}
            onSave={async (data) => {
              if (editingGoal) {
                await updateGoal(editingGoal.id, data);
              }
              closeAndResetForms();
            }}
            onClose={closeAndResetForms}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!isLinkOpen} onOpenChange={() => setIsLinkOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goals.link_to_journal')}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <select
              className="w-full p-2 border rounded bg-background text-foreground"
              onChange={(e) => {
                if (isLinkOpen && e.target.value) {
                  linkGoalToCbtEntry(isLinkOpen, e.target.value);
                  closeAndResetForms();
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>{t('goal_associate_placeholder')}</option>
              <option value="">{t('goal_associate_none')}</option>
              {cbtEntries.slice(0, 20).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.date} - {entry.note?.substring(0, 30) || `${t('entry_generic')} ${entry.id}`}...
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button onClick={closeAndResetForms} variant="ghost">{t('cancel')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
