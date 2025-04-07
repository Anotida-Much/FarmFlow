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
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Contact } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Contact type is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contacts() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToView, setContactToView] = useState<Contact | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (contactData: ContactFormValues) => {
      const response = await apiRequest("POST", "/api/contacts", contactData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setShowAddModal(false);
      toast({
        title: "Contact added",
        description: "Your contact has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add contact",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contacts/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setShowDeleteConfirm(false);
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete contact",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Contact form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      type: "Supplier",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    createContactMutation.mutate(data);
  };

  // Filter contacts
  const filteredContacts = contacts
    ? contacts
        .filter((contact) => {
          // Apply type filter
          if (filter !== "all" && contact.type !== filter) return false;
          
          // Apply search filter
          if (searchTerm) {
            return contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (contact.phone && contact.phone.toLowerCase().includes(searchTerm.toLowerCase()));
          }
          
          return true;
        })
    : [];

  // View contact
  const handleViewContact = (contact: Contact) => {
    setContactToView(contact);
    setShowViewModal(true);
  };

  // Get unique contact types
  const contactTypes = contacts
    ? ["all", ...new Set(contacts.map(contact => contact.type))]
    : ["all", "Supplier", "Customer", "Vendor", "Employee"];

  // Get icon for contact type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "supplier": return "bi-truck";
      case "customer": return "bi-person";
      case "vendor": return "bi-shop";
      case "employee": return "bi-person-badge";
      default: return "bi-person-rolodex";
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white">Contact Management</h2>
        <Button 
          className="flex items-center bg-primary hover:bg-primary-dark text-white"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-lg mr-2"></i> Add Contact
        </Button>
      </div>
      
      <div className="mb-5 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"}
            className={filter === "all" ? "bg-primary text-white" : ""}
            onClick={() => setFilter("all")}
          >
            All Contacts
          </Button>
          {contactTypes.filter(type => type !== "all").map((type) => (
            <Button 
              key={type}
              variant={filter === type ? "default" : "outline"}
              className={filter === type ? "bg-blue-500 text-white" : ""}
              onClick={() => setFilter(type)}
            >
              <i className={`bi ${getTypeIcon(type)} mr-2`}></i> {type}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-auto">
          <Input
            type="text"
            placeholder="Search contacts..."
            className="pl-8 pr-3 py-1 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="bi bi-search absolute left-3 top-2 text-gray-400"></i>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full h-[150px] rounded-lg" />
          ))}
        </div>
      ) : (
        filteredContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      contact.type === "Supplier" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" :
                      contact.type === "Customer" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" :
                      contact.type === "Vendor" ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" :
                      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      <i className={`bi ${getTypeIcon(contact.type)} text-xl`}></i>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium dark:text-white">{contact.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{contact.type}</p>
                    </div>
                  </div>
                  
                  <div className="border-t dark:border-gray-700 p-4">
                    {contact.email && (
                      <div className="flex items-center text-sm mb-1">
                        <i className="bi bi-envelope text-gray-500 mr-2"></i>
                        <span className="text-gray-600 dark:text-gray-300">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-sm">
                        <i className="bi bi-telephone text-gray-500 mr-2"></i>
                        <span className="text-gray-600 dark:text-gray-300">{contact.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex border-t dark:border-gray-700">
                    <button
                      className="flex-1 py-2 text-sm text-center hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400"
                      onClick={() => handleViewContact(contact)}
                    >
                      <i className="bi bi-eye mr-1"></i> View
                    </button>
                    <div className="border-r dark:border-gray-700"></div>
                    <button
                      className="flex-1 py-2 text-sm text-center hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                      onClick={() => {
                        setContactToDelete(contact.id);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <i className="bi bi-trash mr-1"></i> Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow dark:bg-gray-800">
            {searchTerm || filter !== "all" ? (
              <>
                <i className="bi bi-search text-4xl text-gray-400 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">No contacts found</h3>
                <p className="text-gray-500">No contacts match your current filters</p>
              </>
            ) : (
              <>
                <i className="bi bi-person-rolodex text-4xl text-gray-400 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">No contacts yet</h3>
                <p className="text-gray-500 mb-4">Add your first contact to get started</p>
                <Button 
                  className="bg-primary text-white hover:bg-primary-dark"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-lg mr-2"></i> Add Contact
                </Button>
              </>
            )}
          </div>
        )
      )}
      
      {/* Add Contact Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Vendor">Vendor</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional information..." {...field} />
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
                  disabled={createContactMutation.isPending}
                >
                  {createContactMutation.isPending ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Adding...
                    </div>
                  ) : "Add Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Contact Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          
          {contactToView && (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  contactToView.type === "Supplier" ? "bg-blue-100 text-blue-600" :
                  contactToView.type === "Customer" ? "bg-green-100 text-green-600" :
                  contactToView.type === "Vendor" ? "bg-purple-100 text-purple-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  <i className={`bi ${getTypeIcon(contactToView.type)} text-xl`}></i>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-lg">{contactToView.name}</h3>
                  <p className="text-sm text-gray-500">{contactToView.type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                {contactToView.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 flex items-center">
                      <i className="bi bi-envelope text-gray-400 mr-2"></i>
                      <a href={`mailto:${contactToView.email}`} className="text-blue-600 hover:underline">
                        {contactToView.email}
                      </a>
                    </p>
                  </div>
                )}
                
                {contactToView.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1 flex items-center">
                      <i className="bi bi-telephone text-gray-400 mr-2"></i>
                      <a href={`tel:${contactToView.phone}`} className="text-blue-600 hover:underline">
                        {contactToView.phone}
                      </a>
                    </p>
                  </div>
                )}
                
                {contactToView.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="mt-1 flex items-start">
                      <i className="bi bi-geo-alt text-gray-400 mr-2 mt-1"></i>
                      <span>{contactToView.address}</span>
                    </p>
                  </div>
                )}
                
                {contactToView.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="mt-1 bg-gray-50 p-3 rounded-md dark:bg-gray-800">
                      {contactToView.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4 mt-4 border-t">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" className="text-blue-600 border-blue-200">
                    <i className="bi bi-pencil mr-2"></i> Edit
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    setContactToDelete(contactToView.id);
                    setShowViewModal(false);
                    setShowDeleteConfirm(true);
                  }}>
                    <i className="bi bi-trash mr-2"></i> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this contact? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (contactToDelete !== null) {
                  deleteContactMutation.mutate(contactToDelete);
                }
              }}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? (
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
