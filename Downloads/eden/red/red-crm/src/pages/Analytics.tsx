import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

interface Stats {
  totalCustomers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
}

interface Project {
  id: string;
  name: string;
  budget: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  status: string;
  priority: string;
  dueDate: string;
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const statsRef = ref(db, 'stats');
    const projectsRef = ref(db, 'projects');
    const tasksRef = ref(db, 'tasks');

    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      }
    });

    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData: Project[] = [];
        snapshot.forEach((childSnapshot) => {
          projectsData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val(),
          });
        });
        setProjects(projectsData);
      }
    });

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData: Task[] = [];
        snapshot.forEach((childSnapshot) => {
          tasksData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val(),
          });
        });
        setTasks(tasksData);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeStats();
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, []);

  const calculateProjectMetrics = () => {
    const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
    const activeProjects = projects.filter(
      (project) => project.status === 'in-progress'
    ).length;
    const completedProjects = projects.filter(
      (project) => project.status === 'completed'
    ).length;

    return {
      totalBudget,
      activeProjects,
      completedProjects,
    };
  };

  const calculateTaskMetrics = () => {
    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const tasksByPriority = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const overdueTasks = tasks.filter(
      (task) =>
        task.status !== 'done' &&
        new Date(task.dueDate) < new Date() &&
        task.dueDate
    ).length;

    return {
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
    };
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 shadow rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3 mt-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const projectMetrics = calculateProjectMetrics();
  const taskMetrics = calculateTaskMetrics();

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            A detailed overview of your CRM metrics and performance indicators.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-red-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Customers
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.totalCustomers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    ${projectMetrics.totalBudget.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Projects
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {projectMetrics.activeProjects}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue Tasks
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {taskMetrics.overdueTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Project Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900">Project Status</h3>
            <div className="mt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">Active</div>
                    <div className="text-sm font-medium text-gray-900">
                      {projectMetrics.activeProjects}
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-yellow-500 rounded-full"
                      style={{
                        width: `${
                          (projectMetrics.activeProjects / stats.totalProjects) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                      Completed
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {projectMetrics.completedProjects}
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{
                        width: `${
                          (projectMetrics.completedProjects / stats.totalProjects) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Priority Distribution */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900">
              Task Priority Distribution
            </h3>
            <div className="mt-4">
              <div className="space-y-4">
                {Object.entries(taskMetrics.tasksByPriority).map(
                  ([priority, count]) => (
                    <div key={priority}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {count}
                        </div>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            priority === 'high'
                              ? 'bg-red-500'
                              : priority === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${(count / stats.totalTasks) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
