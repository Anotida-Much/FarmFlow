import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Priority is required",
  }),
  assignedTo: z.string().min(1, "Assignee is required"),
  recurring: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function Tasks() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowAddModal(false);
      toast({
        title: "Task created",
        description: "Your task has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update task (complete/uncomplete) mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Task updated",
        description: "Task status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowDeleteConfirm(false);
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Task form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      priority: "medium",
      assignedTo: "Self",
      recurring: undefined,
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    ? tasks
        .filter((task) => {
          // First apply status filter
          if (filter !== "all") {
            if (filter === "completed" && !task.completed) return false;
            if (filter === "overdue" && task.status !== "overdue") return false;
            if (filter === "today" && task.status !== "today") return false;
            if (filter === "upcoming" && task.status !== "upcoming") return false;
          }
          
          // Then apply search filter
          if (searchTerm) {
            return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
          }
          
          return true;
        })
        .sort((a, b) => {
          // Sort based on selected criteria
          if (sortBy === "dueDate") {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (sortBy === "priority") {
            const priorityOrder = { "critical": 0, "high": 1, "medium": 2, "low": 3 };
            return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
          }
          if (sortBy === "assignedTo") {
            return a.assignedTo.localeCompare(b.assignedTo);
          }
          return 0;
        })
    : [];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white">Task Management</h2>
        <Button 
          className="flex items-center bg-primary hover:bg-primary-dark text-white"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-lg mr-2"></i> New Task
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"}
              className={filter === "all" ? "bg-primary text-white" : ""}
              onClick={() => setFilter("all")}
            >
              All Tasks
            </Button>
            <Button 
              variant={filter === "overdue" ? "default" : "outline"} 
              className={filter === "overdue" ? "bg-red-500 text-white" : ""}
              onClick={() => setFilter("overdue")}
            >
              Overdue
            </Button>
            <Button 
              variant={filter === "today" ? "default" : "outline"}
              className={filter === "today" ? "bg-yellow-500 text-white" : ""}
              onClick={() => setFilter("today")}
            >
              Today
            </Button>
            <Button 
              variant={filter === "upcoming" ? "default" : "outline"}
              className={filter === "upcoming" ? "bg-green-500 text-white" : ""}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </Button>
            <Button 
              variant={filter === "completed" ? "default" : "outline"}
              className={filter === "completed" ? "bg-gray-500 text-white" : ""}
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search tasks..."
                className="pl-8 pr-3 py-1 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="bi bi-search absolute left-3 top-2 text-gray-400"></i>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="assignedTo">Assigned To</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-full h-16" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-600">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Checkbox />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Title</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Priority</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Assigned To</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <tr 
                        key={task.id} 
                        className={`${task.completed ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} border-b dark:border-gray-700`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              updateTaskMutation.mutate({
                                id: task.id,
                                data: { completed: !!checked }
                              });
                            }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div 
                            className={task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}
                          >
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.status === 'overdue' ? 'bg-red-500 text-white' :
                            task.status === 'today' ? 'bg-yellow-500 text-white' :
                            task.status === 'upcoming' ? 'bg-green-500 text-white' :
                            'bg-gray-400 text-white'
                          }`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'critical' ? 'bg-red-500 text-white' :
                            task.priority === 'high' ? 'bg-orange-500 text-white' :
                            task.priority === 'medium' ? 'bg-blue-500 text-white' :
                            'bg-green-500 text-white'
                          }`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{task.assignedTo}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                              title="Edit task"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                              title="Delete task"
                              onClick={() => {
                                setTaskToDelete(task.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm ? (
                          <>
                            <i className="bi bi-search text-3xl block mb-2"></i>
                            <p>No tasks match your search criteria</p>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-clipboard text-3xl block mb-2"></i>
                            <p>No tasks found. Create a new task to get started!</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredTasks.length} of {tasks?.length} tasks
              </div>
              {/* Pagination would go here for larger datasets */}
            </div>
          </>
        )}
      </div>
      
      {/* Add Task Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter task details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Self">Self</SelectItem>
                        <SelectItem value="John">John</SelectItem>
                        <SelectItem value="Maria">Maria</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Pattern (optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-white hover:bg-primary-dark"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Adding...
                    </div>
                  ) : "Add Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (taskToDelete !== null) {
                  deleteTaskMutation.mutate(taskToDelete);
                }
              }}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? (
                <div className="flex items-center">
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  Deleting...
                </div>
              ) : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
