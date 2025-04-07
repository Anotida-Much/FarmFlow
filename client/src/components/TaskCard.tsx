import { Task } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
  });

  // Handle task completion toggle
  const handleCompletion = (checked: boolean) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { completed: checked }
    });
  };

  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'overdue': return 'border-l-4 border-red-500';
      case 'today': return 'border-l-4 border-yellow-500';
      case 'upcoming': return 'border-l-4 border-green-500';
      case 'completed': return 'border-l-4 border-gray-400 opacity-70';
      default: return '';
    }
  };

  // Get priority badge class
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-yellow-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className={`${getStatusClass(task.status)} bg-white rounded p-3 shadow-sm dark:bg-gray-700`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <Checkbox 
            checked={task.completed} 
            onCheckedChange={handleCompletion}
            className="mt-1 rounded text-primary focus:ring-primary dark:bg-gray-600 dark:border-gray-500"
          />
          <div className="ml-3">
            <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {task.description}
              </p>
            )}
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="mr-2">
                <i className="bi bi-calendar-event mr-1"></i>
                <span>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
              </span>
              <span>
                <i className="bi bi-person mr-1"></i>
                <span>{task.assignedTo}</span>
              </span>
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(task.priority)}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
    </div>
  );
}
