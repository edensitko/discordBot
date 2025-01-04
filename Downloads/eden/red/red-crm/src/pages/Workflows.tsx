import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dueDate?: string;
  order: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: 'sales' | 'support' | 'onboarding' | 'billing' | 'other';
  status: 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  steps: WorkflowStep[];
}

const Workflows: React.FC = () => {
  const { currentUser } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Partial<Workflow>>({});
  const [filter, setFilter] = useState('all');

  const workflowTypes = [
    { id: 'sales', name: 'תהליך מכירות' },
    { id: 'support', name: 'תמיכה בלקוחות' },
    { id: 'onboarding', name: 'קליטת לקוח חדש' },
    { id: 'billing', name: 'תהליך חיוב' },
    { id: 'other', name: 'אחר' },
  ];

  useEffect(() => {
    const db = getDatabase();

    // Fetch users
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData: any[] = [];
        snapshot.forEach((child) => {
          usersData.push({ id: child.key, ...child.val() });
        });
        setUsers(usersData);
      }
    });

    // Fetch workflows
    const workflowsRef = ref(db, 'workflows');
    onValue(workflowsRef, (snapshot) => {
      if (snapshot.exists()) {
        const workflowsData: Workflow[] = [];
        snapshot.forEach((child) => {
          const workflow = { id: child.key, ...child.val() };
          if (filter === 'all' || workflow.type === filter) {
            workflowsData.push(workflow);
          }
        });
        setWorkflows(workflowsData.sort((a, b) => b.createdAt - a.createdAt));
      }
    });
  }, [currentUser, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();
    
    const workflowData = {
      ...currentWorkflow,
      updatedAt: Date.now(),
      createdAt: currentWorkflow.createdAt || Date.now(),
      createdBy: currentUser?.uid,
      steps: currentWorkflow.steps || [],
    };

    if (currentWorkflow.id) {
      const { id, ...updateData } = workflowData;
      await update(ref(db, `workflows/${id}`), updateData);
    } else {
      await push(ref(db, 'workflows'), workflowData);
    }

    setIsModalOpen(false);
    setCurrentWorkflow({});
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תהליך זה?')) {
      const db = getDatabase();
      await remove(ref(db, `workflows/${id}`));
    }
  };

  const addStep = () => {
    const steps = [...(currentWorkflow.steps || [])];
    steps.push({
      id: Date.now().toString(),
      name: '',
      description: '',
      assignedTo: '',
      status: 'pending',
      order: steps.length,
    });
    setCurrentWorkflow({ ...currentWorkflow, steps });
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const steps = [...(currentWorkflow.steps || [])];
    steps[index] = { ...steps[index], ...updates };
    setCurrentWorkflow({ ...currentWorkflow, steps });
  };

  const removeStep = (index: number) => {
    const steps = [...(currentWorkflow.steps || [])];
    steps.splice(index, 1);
    steps.forEach((step, i) => step.order = i);
    setCurrentWorkflow({ ...currentWorkflow, steps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...(currentWorkflow.steps || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      steps.forEach((step, i) => step.order = i);
      setCurrentWorkflow({ ...currentWorkflow, steps });
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">תהליכי עבודה</h1>
          <p className="mt-2 text-sm text-gray-700">
            ניהול ומעקב אחר תהליכי עבודה בארגון
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
          <button
            onClick={() => {
              setCurrentWorkflow({});
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            תהליך חדש
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 rtl:space-x-reverse">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          כל התהליכים
        </button>
        {workflowTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilter(type.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === type.id
                ? 'bg-red-100 text-red-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Workflows List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-red-600 truncate">
                        {workflow.name}
                      </p>
                      <span className="mr-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {workflowTypes.find((t) => t.id === workflow.type)?.name}
                      </span>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => {
                          setCurrentWorkflow(workflow);
                          setIsModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{workflow.description}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-col space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center space-x-2 rtl:space-x-reverse"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{step.name}</span>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              step.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : step.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : step.status === 'blocked'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    שם התהליך
                  </label>
                  <input
                    type="text"
                    value={currentWorkflow.name || ''}
                    onChange={(e) =>
                      setCurrentWorkflow({
                        ...currentWorkflow,
                        name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תיאור
                  </label>
                  <textarea
                    value={currentWorkflow.description || ''}
                    onChange={(e) =>
                      setCurrentWorkflow({
                        ...currentWorkflow,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    סוג תהליך
                  </label>
                  <select
                    value={currentWorkflow.type || ''}
                    onChange={(e) =>
                      setCurrentWorkflow({
                        ...currentWorkflow,
                        type: e.target.value as Workflow['type'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">בחר סוג</option>
                    {workflowTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    סטטוס
                  </label>
                  <select
                    value={currentWorkflow.status || 'active'}
                    onChange={(e) =>
                      setCurrentWorkflow({
                        ...currentWorkflow,
                        status: e.target.value as Workflow['status'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="active">פעיל</option>
                    <option value="completed">הושלם</option>
                    <option value="cancelled">בוטל</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      שלבים
                    </label>
                    <button
                      type="button"
                      onClick={addStep}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      הוסף שלב
                    </button>
                  </div>
                  <div className="mt-2 space-y-3">
                    {currentWorkflow.steps?.map((step, index) => (
                      <div
                        key={step.id}
                        className="border rounded-md p-3 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            שלב {index + 1}
                          </span>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <button
                              type="button"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                            >
                              ⬆️
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStep(index, 'down')}
                              disabled={
                                index === (currentWorkflow.steps?.length || 0) - 1
                              }
                              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              מחק
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) =>
                            updateStep(index, { name: e.target.value })
                          }
                          placeholder="שם השלב"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          required
                        />
                        <textarea
                          value={step.description}
                          onChange={(e) =>
                            updateStep(index, { description: e.target.value })
                          }
                          placeholder="תיאור השלב"
                          rows={2}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        />
                        <select
                          value={step.assignedTo}
                          onChange={(e) =>
                            updateStep(index, { assignedTo: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        >
                          <option value="">הקצה לעובד</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.displayName || user.email}
                            </option>
                          ))}
                        </select>
                        <select
                          value={step.status}
                          onChange={(e) =>
                            updateStep(index, {
                              status: e.target.value as WorkflowStep['status'],
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        >
                          <option value="pending">ממתין</option>
                          <option value="in-progress">בתהליך</option>
                          <option value="completed">הושלם</option>
                          <option value="blocked">חסום</option>
                        </select>
                        <input
                          type="date"
                          value={step.dueDate || ''}
                          onChange={(e) =>
                            updateStep(index, { dueDate: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    {currentWorkflow.id ? 'עדכן' : 'צור'} תהליך
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflows;
