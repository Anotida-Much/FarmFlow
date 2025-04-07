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
import { Skeleton } from "@/components/ui/skeleton";
import { Equipment } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import EquipmentList from "@/components/EquipmentList";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["available", "in-use", "maintenance-due", "out-of-service"], {
    required_error: "Status is required",
  }),
  lastUsed: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  nextService: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export default function EquipmentPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch equipment items
  const { data: equipmentItems, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Create equipment mutation
  const createEquipmentMutation = useMutation({
    mutationFn: async (itemData: EquipmentFormValues) => {
      const response = await apiRequest("POST", "/api/equipment", itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowAddModal(false);
      toast({
        title: "Equipment added",
        description: "Your equipment has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add equipment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Equipment> }) => {
      const response = await apiRequest("PATCH", `/api/equipment/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Equipment updated",
        description: "Equipment status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update equipment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/equipment/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowDeleteConfirm(false);
      toast({
        title: "Equipment deleted",
        description: "The equipment has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete equipment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Equipment form
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      status: "available",
      lastUsed: format(new Date(), "yyyy-MM-dd"),
      assignedTo: null,
      nextService: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    },
  });

  const onSubmit = (data: EquipmentFormValues) => {
    createEquipmentMutation.mutate(data);
  };

  // Filter equipment items
  const filteredItems = equipmentItems
    ? equipmentItems
        .filter((item) => {
          // Apply status filter
          if (filter !== "all" && item.status !== filter) return false;
          
          // Apply search filter
          if (searchTerm) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (item.assignedTo && item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
          }
          
          return true;
        })
    : [];

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateEquipmentMutation.mutate({
      id,
      data: { status: status }
    });
  };

  const handleAssignChange = (id: number, assignedTo: string | null) => {
    updateEquipmentMutation.mutate({
      id,
      data: { assignedTo }
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white">Equipment Management</h2>
        <Button 
          className="flex items-center bg-primary hover:bg-primary-dark text-white"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-lg mr-2"></i> Add Equipment
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
              All Equipment
            </Button>
            <Button 
              variant={filter === "available" ? "default" : "outline"} 
              className={filter === "available" ? "bg-green-500 text-white" : ""}
              onClick={() => setFilter("available")}
            >
              Available
            </Button>
            <Button 
              variant={filter === "in-use" ? "default" : "outline"} 
              className={filter === "in-use" ? "bg-blue-500 text-white" : ""}
              onClick={() => setFilter("in-use")}
            >
              In Use
            </Button>
            <Button 
              variant={filter === "maintenance-due" ? "default" : "outline"} 
              className={filter === "maintenance-due" ? "bg-yellow-500 text-white" : ""}
              onClick={() => setFilter("maintenance-due")}
            >
              Maintenance Due
            </Button>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search equipment..."
              className="pl-8 pr-3 py-1 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bi bi-search absolute left-3 top-2 text-gray-400"></i>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-full h-[100px] rounded-lg" />
            ))}
          </div>
        ) : (
          <EquipmentList 
            items={filteredItems} 
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onAssignChange={handleAssignChange}
          />
        )}
      </div>
      
      {/* Add Equipment Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter equipment name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in-use">In Use</SelectItem>
                        <SelectItem value="maintenance-due">Maintenance Due</SelectItem>
                        <SelectItem value="out-of-service">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Used Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nextService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Service Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Not assigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Not assigned</SelectItem>
                        <SelectItem value="Thomas">Thomas</SelectItem>
                        <SelectItem value="John">John</SelectItem>
                        <SelectItem value="Maria">Maria</SelectItem>
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
                  disabled={createEquipmentMutation.isPending}
                >
                  {createEquipmentMutation.isPending ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Adding...
                    </div>
                  ) : "Add Equipment"}
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
            <p>Are you sure you want to delete this equipment? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (itemToDelete !== null) {
                  deleteEquipmentMutation.mutate(itemToDelete);
                }
              }}
              disabled={deleteEquipmentMutation.isPending}
            >
              {deleteEquipmentMutation.isPending ? (
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
