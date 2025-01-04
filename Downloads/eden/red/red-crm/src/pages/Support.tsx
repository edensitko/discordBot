import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';

interface Ticket {
  id: string;
  title: string;
  description: string;
  customer: string;
  status: 'new' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  dueDate?: string;
  responses: Response[];
}

interface Response {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  isInternal: boolean;
}

const Support: React.FC = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Partial<Ticket>>({});
  const [newResponse, setNewResponse] = useState('');
  const [isInternalResponse, setIsInternalResponse] = useState(false);
  const [filter, setFilter] = useState('all');

  const categories = [
    'תמיכה טכנית',
    'שאלות מוצר',
    'חיוב ותשלומים',
    'תקלות',
    'בקשות שדרוג',
    'אחר',
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

    // Fetch tickets
    const ticketsRef = ref(db, 'tickets');
    onValue(ticketsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ticketsData: Ticket[] = [];
        snapshot.forEach((child) => {
          const ticket = { id: child.key, ...child.val() };
          if (
            filter === 'all' ||
            (filter === 'assigned' && ticket.assignedTo === currentUser?.uid) ||
            (filter === 'unassigned' && !ticket.assignedTo)
          ) {
            ticketsData.push(ticket);
          }
        });
        setTickets(ticketsData.sort((a, b) => b.createdAt - a.createdAt));
      }
    });
  }, [currentUser, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();
    
    const ticketData = {
      ...currentTicket,
      updatedAt: Date.now(),
      createdAt: currentTicket.createdAt || Date.now(),
      responses: currentTicket.responses || [],
    };

    if (currentTicket.id) {
      const { id, ...updateData } = ticketData;
      await update(ref(db, `tickets/${id}`), updateData);
    } else {
      await push(ref(db, 'tickets'), ticketData);
    }

    setIsModalOpen(false);
    setCurrentTicket({});
  };

  const handleAddResponse = async (ticketId: string) => {
    if (newResponse.trim() && currentUser) {
      const db = getDatabase();
      const response = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        content: newResponse.trim(),
        timestamp: Date.now(),
        isInternal: isInternalResponse,
      };

      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        const responses = [...(ticket.responses || []), response];
        await update(ref(db, `tickets/${ticketId}`), {
          responses,
          updatedAt: Date.now(),
        });
        setNewResponse('');
        setIsInternalResponse(false);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  function handleDelete(id: string): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">תמיכה ושירות</h1>
          <p className="mt-2 text-sm text-gray-700">
            ניהול פניות ובקשות תמיכה מלקוחות
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:mr-16 sm:flex-none">
          <button
            onClick={() => {
              setCurrentTicket({});
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            פנייה חדשה
          </button>
        </div>
      </div>

      <div className="flex space-x-4 rtl:space-x-reverse">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          כל הפניות
        </button>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'assigned'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          הפניות שלי
        </button>
        <button
          onClick={() => setFilter('unassigned')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'unassigned'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          לא משויך
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <p className="text-sm font-medium text-red-600 truncate">
                        {ticket.title}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => {
                          setCurrentTicket(ticket);
                          setIsModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {customers.find((c) => c.id === ticket.customer)?.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:mr-6">
                        {ticket.category}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        נוצר ב-{' '}
                        {new Date(ticket.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  {ticket.responses && ticket.responses.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {ticket.responses.map((response, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg ${
                            response.isInternal
                              ? 'bg-gray-50 border border-gray-200'
                              : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">
                              {response.userName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(response.timestamp).toLocaleString(
                                'he-IL'
                              )}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{response.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="text"
                        placeholder="הוסף תגובה..."
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isInternalResponse}
                          onChange={(e) => setIsInternalResponse(e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="mr-2 text-sm text-gray-500">
                          הערה פנימית
                        </span>
                      </label>
                      <button
                        onClick={() => handleAddResponse(ticket.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        שלח
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Ticket Modal */}
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
                    נושא
                  </label>
                  <input
                    type="text"
                    value={currentTicket.title || ''}
                    onChange={(e) =>
                      setCurrentTicket({ ...currentTicket, title: e.target.value })
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
                    value={currentTicket.description || ''}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
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
                    לקוח
                  </label>
                  <select
                    value={currentTicket.customer || ''}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
                        customer: e.target.value,
                      })
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
                    קטגוריה
                  </label>
                  <select
                    value={currentTicket.category || ''}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
                        category: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    required
                  >
                    <option value="">בחר קטגוריה</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    עדיפות
                  </label>
                  <select
                    value={currentTicket.priority || 'medium'}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
                        priority: e.target.value as Ticket['priority'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                    <option value="urgent">דחוף</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    סטטוס
                  </label>
                  <select
                    value={currentTicket.status || 'new'}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
                        status: e.target.value as Ticket['status'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="new">חדש</option>
                    <option value="in-progress">בטיפול</option>
                    <option value="waiting">ממתין</option>
                    <option value="resolved">נפתר</option>
                    <option value="closed">סגור</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    הקצה ל
                  </label>
                  <select
                    value={currentTicket.assignedTo || ''}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
                        assignedTo: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="">לא משויך</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    תאריך יעד
                  </label>
                  <input
                    type="date"
                    value={currentTicket.dueDate || ''}
                    onChange={(e) =>
                      setCurrentTicket({
                        ...currentTicket,
                        dueDate: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    {currentTicket.id ? 'עדכן' : 'צור'} פנייה
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

export default Support;
