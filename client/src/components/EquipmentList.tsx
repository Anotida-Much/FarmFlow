import { useState } from "react";
import { Equipment } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";

interface EquipmentListProps {
  items: Equipment[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onAssignChange: (id: number, assignedTo: string | null) => void;
}

export default function EquipmentList({ items, onDelete, onStatusChange, onAssignChange }: EquipmentListProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-use': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'maintenance-due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'out-of-service': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'in-use': return 'In Use';
      case 'maintenance-due': return 'Maintenance Due';
      case 'out-of-service': return 'Out of Service';
      default: return status;
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <i className="bi bi-tools text-3xl block mb-2"></i>
        <p>No equipment found. Add equipment to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 mr-3">
                    <i className="bi bi-tools text-xl text-primary"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg dark:text-white">{item.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      {item.nextService && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Service: {format(new Date(item.nextService), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700" 
                    onClick={() => onDelete(item.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <Select 
                    value={item.status} 
                    onValueChange={(value) => onStatusChange(item.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                      <SelectItem value="maintenance-due">Maintenance Due</SelectItem>
                      <SelectItem value="out-of-service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</label>
                  <Select 
                    value={item.assignedTo || ""} 
                    onValueChange={(value) => onAssignChange(item.id, value === "" ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not assigned</SelectItem>
                      <SelectItem value="Thomas">Thomas</SelectItem>
                      <SelectItem value="John">John</SelectItem>
                      <SelectItem value="Maria">Maria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {item.lastUsed && (
                  <div className="flex items-center">
                    <i className="bi bi-calendar-check mr-2"></i>
                    <span>Last used: {format(new Date(item.lastUsed), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
