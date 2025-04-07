import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import TaskCard from "@/components/TaskCard";
import WeatherWidget from "@/components/WeatherWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { Task, Inventory, Equipment } from "@shared/schema";

export default function Dashboard() {
  // Fetch metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  // Fetch tasks
  const { data: tasks, isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch inventory
  const { data: inventory, isLoading: loadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch equipment
  const { data: equipment, isLoading: loadingEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Dashboard</h2>
      
      {/* Farm Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingMetrics ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-full h-[130px] rounded-lg" />
          ))
        ) : (
          <>
            <MetricCard
              title="Task Completion"
              value={metrics?.taskCompletion || 0}
              icon="bi-check-circle"
              iconColor="text-primary"
              trend={5}
              trendUp={true}
              progressColor="bg-primary"
            />
            
            <MetricCard
              title="Inventory Health"
              value={metrics?.inventoryHealth || 0}
              icon="bi-box"
              iconColor="text-accent"
              trend={2}
              trendUp={false}
              progressColor="bg-accent"
            />
            
            <MetricCard
              title="Equipment Utilization"
              value={metrics?.equipmentUtilization || 0}
              icon="bi-tools"
              iconColor="text-secondary"
              trend={8}
              trendUp={true}
              progressColor="bg-secondary"
            />
            
            <MetricCard
              title="Yield Estimate"
              value={metrics?.yieldEstimate || 0}
              icon="bi-graph-up"
              iconColor="text-success"
              trend={3}
              trendUp={true}
              progressColor="bg-success"
            />
          </>
        )}
      </div>
      
      {/* Tasks & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Recent Tasks</h3>
              <a href="/tasks" className="text-sm text-accent hover:underline dark:text-accent-light">View All</a>
            </div>
            
            {loadingTasks ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="w-full h-[80px] rounded" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 3).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="bi bi-clipboard-check text-3xl mb-2"></i>
                <p>No tasks found. Add one to get started!</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <WeatherWidget />
        </div>
      </div>
      
      {/* Inventory & Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Inventory Status</h3>
              <a href="/inventory" className="text-sm text-accent hover:underline dark:text-accent-light">View All</a>
            </div>
            
            {loadingInventory ? (
              <Skeleton className="w-full h-[180px] rounded" />
            ) : inventory && inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Item</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.slice(0, 4).map((item) => (
                      <tr key={item.id} className={`${item.status === 'low' ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20' : ''} border-b dark:border-gray-700`}>
                        <td className="py-2 px-3 text-sm dark:text-gray-200">{item.name}</td>
                        <td className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">{item.category}</td>
                        <td className="py-2 px-3 text-sm text-right dark:text-gray-200">{item.quantity} {item.unit}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'low' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                          }`}>
                            {item.status === 'low' ? 'Low Stock' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="bi bi-box text-3xl mb-2"></i>
                <p>No inventory items found. Add one to get started!</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Equipment Status</h3>
              <a href="/equipment" className="text-sm text-accent hover:underline dark:text-accent-light">View All</a>
            </div>
            
            {loadingEquipment ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="w-full h-[60px] rounded" />
                ))}
              </div>
            ) : equipment && equipment.length > 0 ? (
              <div className="space-y-3">
                {equipment.slice(0, 3).map((equip) => (
                  <div key={equip.id} className="bg-white border rounded p-3 flex items-center justify-between dark:bg-gray-700 dark:border-gray-600">
                    <div>
                      <div className="flex items-center">
                        <i className="bi bi-tools text-lg text-gray-500 mr-2 dark:text-gray-400"></i>
                        <p className="font-medium dark:text-white">{equip.name}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                        {equip.assignedTo ? `Assigned to: ${equip.assignedTo}` : 'Not assigned'}
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        equip.status === 'maintenance-due' ? 'bg-yellow-500 text-white' :
                        equip.status === 'available' ? 'bg-green-500 text-white' :
                        equip.status === 'in-use' ? 'bg-blue-500 text-white' : ''
                      }`}>
                        {equip.status === 'maintenance-due' ? 'Maintenance Due' :
                         equip.status === 'available' ? 'Available' :
                         equip.status === 'in-use' ? 'In Use' : equip.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="bi bi-tools text-3xl mb-2"></i>
                <p>No equipment items found. Add one to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
