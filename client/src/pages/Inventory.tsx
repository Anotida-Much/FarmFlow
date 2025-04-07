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
import { Inventory } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  unit: z.string().min(1, "Unit is required"),
  threshold: z.number().min(0, "Threshold must be 0 or greater"),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

export default function InventoryPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToUpdate, setItemToUpdate] = useState<Inventory | null>(null);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [stockChangeAmount, setStockChangeAmount] = useState(0);

  // Fetch inventory items
  const { data: inventoryItems, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: InventoryFormValues) => {
      const response = await apiRequest("POST", "/api/inventory", itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowAddModal(false);
      toast({
        title: "Item created",
        description: "Your inventory item has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Inventory> }) => {
      const response = await apiRequest("PATCH", `/api/inventory/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowUpdateStockModal(false);
      setItemToUpdate(null);
      toast({
        title: "Stock updated",
        description: "Inventory stock has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update stock",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowDeleteConfirm(false);
      toast({
        title: "Item deleted",
        description: "The inventory item has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Inventory form
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      category: "Seeds",
      quantity: 0,
      unit: "kg",
      threshold: 0,
    },
  });

  const onSubmit = (data: InventoryFormValues) => {
    createItemMutation.mutate(data);
  };

  // Get unique categories from inventory items
  const categories = inventoryItems 
    ? ["all", ...new Set(inventoryItems.map(item => item.category))]
    : ["all"];

  // Filter inventory items
  const filteredItems = inventoryItems
    ? inventoryItems
        .filter((item) => {
          // Apply status filter
          if (filter === "low" && item.status !== "low") return false;
          
          // Apply category filter
          if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
          
          // Apply search filter
          if (searchTerm) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   item.category.toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          return true;
        })
    : [];

  // Update stock handler
  const handleUpdateStock = () => {
    if (!itemToUpdate) return;
    
    const newQuantity = parseFloat((itemToUpdate.quantity + stockChangeAmount).toFixed(2));
    
    if (newQuantity < 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity cannot be negative",
        variant: "destructive",
      });
      return;
    }
    
    updateItemMutation.mutate({
      id: itemToUpdate.id,
      data: { quantity: newQuantity }
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white">Inventory Management</h2>
        <Button 
          className="flex items-center bg-primary hover:bg-primary-dark text-white"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-lg mr-2"></i> Add Inventory
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
              All Items
            </Button>
            <Button 
              variant={filter === "low" ? "default" : "outline"} 
              className={filter === "low" ? "bg-red-500 text-white" : ""}
              onClick={() => setFilter("low")}
            >
              Low Stock
            </Button>
            {categories.slice(1).slice(0, 3).map((category) => (
              <Button 
                key={category}
                variant="outline"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-gray-100 dark:bg-gray-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search inventory..."
                className="pl-8 pr-3 py-1 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="bi bi-search absolute left-3 top-2 text-gray-400"></i>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
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
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-600">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Item Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Unit</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Threshold</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`${item.status === 'low' ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20' : 'bg-white dark:bg-gray-800'} border-b dark:border-gray-700`}
                    >
                      <td className="py-3 px-4 font-medium dark:text-white">{item.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.category}</td>
                      <td className="py-3 px-4 dark:text-white">{item.quantity}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.unit}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.threshold}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'low' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {item.status === 'low' ? 'Low Stock' : 'Good'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700" 
                            title="Edit item"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-700" 
                            title="Update stock"
                            onClick={() => {
                              setItemToUpdate(item);
                              setStockChangeAmount(0);
                              setShowUpdateStockModal(true);
                            }}
                          >
                            <i className="bi bi-plus-circle"></i>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                            title="Delete item"
                            onClick={() => {
                              setItemToDelete(item.id);
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
                      {searchTerm || selectedCategory !== "all" ? (
                        <>
                          <i className="bi bi-search text-3xl block mb-2"></i>
                          <p>No inventory items match your search criteria</p>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box text-3xl block mb-2"></i>
                          <p>No inventory items found. Add an item to get started!</p>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add Inventory Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Seeds">Seeds</SelectItem>
                        <SelectItem value="Fertilizer">Fertilizer</SelectItem>
                        <SelectItem value="Chemicals">Chemicals</SelectItem>
                        <SelectItem value="Feed">Feed</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="items">items</SelectItem>
                          <SelectItem value="bags">bags</SelectItem>
                          <SelectItem value="boxes">boxes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
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
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Adding...
                    </div>
                  ) : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Update Stock Modal */}
      <Dialog open={showUpdateStockModal} onOpenChange={setShowUpdateStockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
          </DialogHeader>
          
          {itemToUpdate && (
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{itemToUpdate.name}</span>
                <span className="text-sm text-gray-500">{itemToUpdate.category}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Current Stock:</span>
                <span className="font-medium">{itemToUpdate.quantity} {itemToUpdate.unit}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span>Adjust by:</span>
                <div className="flex-1 flex items-center">
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-r-none"
                    onClick={() => setStockChangeAmount(prev => prev - 1)}
                  >
                    <i className="bi bi-dash"></i>
                  </Button>
                  <Input
                    type="number"
                    value={stockChangeAmount}
                    onChange={(e) => setStockChangeAmount(parseFloat(e.target.value) || 0)}
                    className="h-8 rounded-none text-center"
                  />
                  <Button 
                    variant="outline" 
                    className="h-8 w-8 p-0 rounded-l-none"
                    onClick={() => setStockChangeAmount(prev => prev + 1)}
                  >
                    <i className="bi bi-plus"></i>
                  </Button>
                </div>
                <span>{itemToUpdate.unit}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 text-sm">
                <span>New Stock Level:</span>
                <span className={`font-bold ${(itemToUpdate.quantity + stockChangeAmount) < itemToUpdate.threshold ? 'text-red-500' : 'text-green-500'}`}>
                  {(itemToUpdate.quantity + stockChangeAmount).toFixed(2)} {itemToUpdate.unit}
                </span>
              </div>
              
              {(itemToUpdate.quantity + stockChangeAmount) < itemToUpdate.threshold && (
                <div className="text-red-500 text-sm">
                  <i className="bi bi-exclamation-triangle mr-1"></i>
                  This will put the item below the low stock threshold ({itemToUpdate.threshold} {itemToUpdate.unit}).
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateStockModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-primary text-white hover:bg-primary-dark"
              onClick={handleUpdateStock}
              disabled={updateItemMutation.isPending || stockChangeAmount === 0}
            >
              {updateItemMutation.isPending ? (
                <div className="flex items-center">
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  Updating...
                </div>
              ) : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this inventory item? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (itemToDelete !== null) {
                  deleteItemMutation.mutate(itemToDelete);
                }
              }}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? (
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
