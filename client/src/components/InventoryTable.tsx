import { useState } from "react";
import { Inventory } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface InventoryTableProps {
  items: Inventory[];
  onEdit: (id: number) => void;
  onUpdateStock: (item: Inventory) => void;
  onDelete: (id: number) => void;
}

export default function InventoryTable({ items, onEdit, onUpdateStock, onDelete }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <i className="bi bi-box text-3xl block mb-2"></i>
        <p>No inventory items found. Add an item to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Threshold</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.id} 
              className={item.status === 'low' ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20' : ''}
            >
              <TableCell className="font-medium dark:text-white">{item.name}</TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400">{item.category}</TableCell>
              <TableCell className="dark:text-white">{item.quantity}</TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400">{item.unit}</TableCell>
              <TableCell className="text-gray-600 dark:text-gray-400">{item.threshold}</TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.status === 'low' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}>
                  {item.status === 'low' ? 'Low Stock' : 'Good'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700" 
                    title="Edit item"
                    onClick={() => onEdit(item.id)}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-green-500 hover:text-green-700" 
                    title="Update stock"
                    onClick={() => onUpdateStock(item)}
                  >
                    <i className="bi bi-plus-circle"></i>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                    title="Delete item"
                    onClick={() => onDelete(item.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
