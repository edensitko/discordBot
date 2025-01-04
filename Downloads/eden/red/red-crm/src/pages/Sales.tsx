import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

interface Deal {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  notes: string;
  createdAt: number;
  lastUpdated: number;
}

const stages = [
  'ליד חדש',
  'פגישת היכרות',
  'הצעת מחיר',
  'משא ומתן',
  'סגירה',
  'אבוד',
];

const Sales: React.FC = () => {
  const { currentUser } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDeal, setCurrentDeal] = useState<Partial<Deal>>({});
  const [customers, setCustomers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [totalValue, setTotalValue] = useState(0);
  const [expectedValue, setExpectedValue] = useState(0);

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

    // Fetch customers
    const customersRef = ref(db, 'customers');
    onValue(customersRef, (snapshot) => {
      if (snapshot.exists()) {
        const customersData: any[] = [];
        snapshot.forEach((child) => {
          customersData.push({ id: child.key, ...child.val() });
        });
        setCustomers(customersData);
      }
    });

    // Fetch deals
    const dealsRef = ref(db, 'deals');
    onValue(dealsRef, (snapshot) => {
      if (snapshot.exists()) {
        const dealsData: Deal[] = [];
        snapshot.forEach((child) => {
          dealsData.push({ id: child.key, ...child.val() });
        });
        
        // Calculate totals
        const total = dealsData.reduce((sum, deal) => sum + deal.value, 0);
        const expected = dealsData.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
        
        setTotalValue(total);
        setExpectedValue(expected);
        setDeals(dealsData.sort((a, b) => b.lastUpdated - a.lastUpdated));
      }
    });
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();
    
    const dealData = {
      ...currentDeal,
      lastUpdated: Date.now(),
      createdAt: currentDeal.createdAt || Date.now(),
    };

    if (currentDeal.id) {
      const { id, ...updateData } = dealData;
      await update(ref(db, `deals/${id}`), updateData);
    } else {
      await push(ref(db, 'deals'), dealData);
    }

    setIsModalOpen(false);
    setCurrentDeal({});
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק עסקה זו?')) {
      const db = getDatabase();
      await remove(ref(db, `deals/${id}`));
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'ליד חדש':
        return 'bg-blue-100 text-blue-800';
      case 'פגישת היכרות':
        return 'bg-yellow-100 text-yellow-800';
      case 'הצעת מחיר':
        return 'bg-purple-100 text-purple-800';
      case 'משא ומתן':
        return 'bg-orange-100 text-orange-800';
      case 'סגירה':
        return 'bg-green-100 text-green-800';
      case 'אבוד':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">ניהול מכירות</h1>
          <p className="mt-2 text-sm text-gray-700">
            ניהול הזדמנויות מכירה ומעקב אחר תהליכי מכירה
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
          <button
            onClick={() => {
              setCurrentDeal({});
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            עסקה חדשה
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    סך הכל עסקאות
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₪{totalValue.toLocaleString()}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    הכנסה צפויה
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₪{expectedValue.toLocaleString()}
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    מספר עסקאות
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deals.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
          {stages.map((stage) => (
            <div key={stage} className="bg-white rounded-lg shadow">
              <div className={`p-4 rounded-t-lg ${getStageColor(stage)}`}>
                <h3 className="text-sm font-medium">{stage}</h3>
                <p className="mt-1 text-sm">
                  {deals.filter((deal) => deal.stage === stage).length} עסקאות
                </p>
              </div>
              <div className="p-4 space-y-4">
                {deals
                  .filter((deal) => deal.stage === stage)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setCurrentDeal(deal);
                        setIsModalOpen(true);
                      }}
                    >
                      <h4 className="font-medium text-gray-900">{deal.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {customers.find((c) => c.id === deal.customer)?.name}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        ₪{deal.value.toLocaleString()}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {deal.probability}% סיכוי
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deal.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
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
                    כותרת העסקה
                  </label>
                  <input
                    type="text"
                    value={currentDeal.title || ''}
                    onChange={(e) =>
                      setCurrentDeal({ ...currentDeal, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    לקוח
                  </label>
                  <select
                    value={currentDeal.customer || ''}
                    onChange={(e) =>
                      setCurrentDeal({ ...currentDeal, customer: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    שווי העסקה (₪)
                  </label>
                  <input
                    type="number"
                    value={currentDeal.value || ''}
                    onChange={(e) =>
                      setCurrentDeal({
                        ...currentDeal,
                        value: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    שלב
                  </label>
                  <select
                    value={currentDeal.stage || stages[0]}
                    onChange={(e) =>
                      setCurrentDeal({ ...currentDeal, stage: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    סיכוי סגירה (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentDeal.probability || ''}
                    onChange={(e) =>
                      setCurrentDeal({
                        ...currentDeal,
                        probability: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תאריך סגירה צפוי
                  </label>
                  <input
                    type="date"
                    value={currentDeal.expectedCloseDate || ''}
                    onChange={(e) =>
                      setCurrentDeal({
                        ...currentDeal,
                        expectedCloseDate: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    אחראי מכירה
                  </label>
                  <select
                    value={currentDeal.assignedTo || ''}
                    onChange={(e) =>
                      setCurrentDeal({
                        ...currentDeal,
                        assignedTo: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">בחר אחראי</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    הערות
                  </label>
                  <textarea
                    value={currentDeal.notes || ''}
                    onChange={(e) =>
                      setCurrentDeal({ ...currentDeal, notes: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    {currentDeal.id ? 'עדכן' : 'צור'} עסקה
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

export default Sales;
