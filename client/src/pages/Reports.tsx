import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { Task, Inventory, Equipment } from "@shared/schema";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("30");
  const [taskCategory, setTaskCategory] = useState("status");
  
  // Fetch data for reports
  const { data: tasks, isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: inventory, isLoading: loadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: equipment, isLoading: loadingEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  // Prepare data for charts
  const taskStatusData = tasks ? [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
    { name: 'Overdue', value: tasks.filter(t => t.status === 'overdue').length },
    { name: 'Today', value: tasks.filter(t => t.status === 'today').length },
    { name: 'Upcoming', value: tasks.filter(t => t.status === 'upcoming').length }
  ] : [];

  const taskPriorityData = tasks ? [
    { name: 'Critical', value: tasks.filter(t => t.priority === 'critical').length },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length }
  ] : [];

  const inventoryCategoryData = inventory 
    ? Array.from(new Set(inventory.map(item => item.category))).map(category => ({
        name: category,
        value: inventory.filter(item => item.category === category).length
      }))
    : [];

  const inventoryStatusData = inventory ? [
    { name: 'Good Stock', value: inventory.filter(i => i.status === 'good').length },
    { name: 'Low Stock', value: inventory.filter(i => i.status === 'low').length }
  ] : [];

  const equipmentStatusData = equipment ? [
    { name: 'Available', value: equipment.filter(e => e.status === 'available').length },
    { name: 'In Use', value: equipment.filter(e => e.status === 'in-use').length },
    { name: 'Maintenance Due', value: equipment.filter(e => e.status === 'maintenance-due').length },
    { name: 'Out of Service', value: equipment.filter(e => e.status === 'out-of-service').length }
  ] : [];

  // Generate trend data (mock data since we don't have historical data in the storage)
  const generateTrendData = (days: number) => {
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      data.unshift({
        date: format(date, 'MMM dd'),
        taskCompletion: Math.round(70 + Math.random() * 20),
        inventoryHealth: Math.round(80 + Math.random() * 15),
        equipmentUtilization: Math.round(50 + Math.random() * 25)
      });
    }
    return data;
  };

  const trendData = generateTrendData(parseInt(timeRange));

  const COLORS = ['#4CAF50', '#F44336', '#FFA000', '#2196F3', '#9C27B0', '#607D8B'];

  const TaskChart = () => {
    const data = taskCategory === 'status' ? taskStatusData : taskPriorityData;
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} tasks`, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const InventoryChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={inventoryCategoryData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} items`, '']} />
        <Legend />
        <Bar dataKey="value" name="Items" fill="#4CAF50" />
      </BarChart>
    </ResponsiveContainer>
  );

  const PerformanceChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={trendData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value}%`, '']} />
        <Legend />
        <Line type="monotone" dataKey="taskCompletion" name="Task Completion" stroke="#4CAF50" />
        <Line type="monotone" dataKey="inventoryHealth" name="Inventory Health" stroke="#2196F3" />
        <Line type="monotone" dataKey="equipmentUtilization" name="Equipment Utilization" stroke="#FFA000" />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white">Reports & Analytics</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Trend Period:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingMetrics ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full h-[100px] rounded-lg" />
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Task Completion</p>
                    <h4 className="text-2xl font-bold mt-1">{metrics?.taskCompletion || 0}%</h4>
                  </div>
                  <div className="rounded-full p-2 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                    <i className="bi bi-check-circle text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inventory Health</p>
                    <h4 className="text-2xl font-bold mt-1">{metrics?.inventoryHealth || 0}%</h4>
                  </div>
                  <div className="rounded-full p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    <i className="bi bi-box text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Equipment Utilization</p>
                    <h4 className="text-2xl font-bold mt-1">{metrics?.equipmentUtilization || 0}%</h4>
                  </div>
                  <div className="rounded-full p-2 bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400">
                    <i className="bi bi-tools text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Yield Estimate</p>
                    <h4 className="text-2xl font-bold mt-1">{metrics?.yieldEstimate || 0}%</h4>
                  </div>
                  <div className="rounded-full p-2 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                    <i className="bi bi-graph-up text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="tasks">Task Analysis</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Analysis</TabsTrigger>
        </TabsList>

        {/* Performance Trends Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Farm Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTasks || loadingInventory || loadingEquipment ? (
                <Skeleton className="w-full h-[300px]" />
              ) : (
                <PerformanceChart />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Analysis Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Task Analysis</CardTitle>
              <Select value={taskCategory} onValueChange={setTaskCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="View by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="priority">By Priority</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <Skeleton className="w-full h-[300px]" />
              ) : tasks && tasks.length > 0 ? (
                <TaskChart />
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                  <i className="bi bi-clipboard-data text-4xl mb-2"></i>
                  <p>No task data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Analysis Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory By Category</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInventory ? (
                <Skeleton className="w-full h-[300px]" />
              ) : inventory && inventory.length > 0 ? (
                <InventoryChart />
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                  <i className="bi bi-box text-4xl mb-2"></i>
                  <p>No inventory data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEquipment ? (
              <Skeleton className="w-full h-[250px]" />
            ) : equipment && equipment.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={equipmentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {equipmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-gray-500">
                <i className="bi bi-tools text-4xl mb-2"></i>
                <p>No equipment data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInventory ? (
              <Skeleton className="w-full h-[250px]" />
            ) : inventory && inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={inventoryStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#4CAF50" /> {/* Good Stock */}
                    <Cell fill="#F44336" /> {/* Low Stock */}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-gray-500">
                <i className="bi bi-boxes text-4xl mb-2"></i>
                <p>No inventory data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
