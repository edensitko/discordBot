import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, remove, update, set } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Stack,
  LinearProgress,
  AvatarGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Send as SendIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import mockData from '../services/mockData';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'לביצוע' | 'בתהליך' | 'הושלם';
  priority: 'נמוכה' | 'בינונית' | 'גבוהה';
  dueDate: string;
  assignedTo: string;
  customerId?: string;
  dealId?: string;
  createdAt: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'הודעה' | 'משימה' | 'עדכון';
  relatedTaskId?: string;
}

const Tasks: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users] = useState(mockData.users);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    const db = getDatabase();
    const tasksRef = ref(db, 'tasks');
    
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const tasksData: Task[] = [];
        snapshot.forEach((child) => {
          const data = child.val();
          // Ensure the status is one of the valid values
          const status = ['לביצוע', 'בתהליך', 'הושלם'].includes(data.status) 
            ? data.status as Task['status']
            : 'לביצוע';
          
          // Ensure the priority is one of the valid values
          const priority = ['נמוכה', 'בינונית', 'גבוהה'].includes(data.priority)
            ? data.priority as Task['priority']
            : 'בינונית';

          tasksData.push({
            id: child.key || Date.now().toString(),
            title: data.title || '',
            description: data.description || '',
            status,
            priority,
            dueDate: data.dueDate || new Date().toISOString(),
            assignedTo: data.assignedTo || '',
            customerId: data.customerId,
            dealId: data.dealId,
            createdAt: data.createdAt || Date.now()
          });
        });
        setTasks(tasksData);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleSaveTask = (task: Partial<Task>) => {
    const db = getDatabase();
    const newTask: Task = {
      id: task.id || Date.now().toString(),
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'לביצוע',
      priority: task.priority || 'בינונית',
      dueDate: task.dueDate || new Date().toISOString(),
      assignedTo: task.assignedTo || '',
      customerId: task.customerId,
      dealId: task.dealId,
      createdAt: task.createdAt || Date.now()
    };

    if (selectedTask) {
      const { id, ...updateData } = newTask;
      update(ref(db, `tasks/${id}`), updateData);
    } else {
      push(ref(db, 'tasks'), newTask);
    }
    
    setIsModalOpen(false);
  };

  const handleOpenChat = (task: Task) => {
    setSelectedTask(task);
    setIsChatOpen(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedTask) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUser?.uid || '',
        receiverId: selectedTask.assignedTo,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'הודעה',
        relatedTaskId: selectedTask.id,
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'לביצוע': return 'error';
      case 'בתהליך': return 'warning';
      case 'הושלם': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'גבוהה': return 'error';
      case 'בינונית': return 'warning';
      case 'נמוכה': return 'success';
      default: return 'default';
    }
  };

  const getTaskProgress = (task: Task): number => {
    switch (task.status) {
      case 'הושלם':
        return 100;
      case 'בתהליך':
        return 50;
      case 'לביצוע':
        return 0;
      default:
        return 0;
    }
  };

  const formatDueDate = (dueDate: string): string => {
    const date = new Date(dueDate);
    return date.toLocaleDateString('he-IL', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'all') return true;
      return task.status === filter;
    })
    .filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

  const handleTaskChange = (field: keyof Task, value: any) => {
    if (selectedTask) {
      setSelectedTask({ ...selectedTask, [field]: value });
    }
  };

  const handleTaskSubmit = () => {
    if (selectedTask) {
      handleSaveTask(selectedTask);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h5" gutterBottom>
            ניהול משימות
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="חיפוש משימות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>מיין לפי</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<SortIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="dueDate">תאריך יעד</MenuItem>
                <MenuItem value="priority">עדיפות</MenuItem>
                <MenuItem value="status">סטטוס</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>סנן לפי</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                startAdornment={<FilterIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="all">הכל</MenuItem>
                <MenuItem value="לביצוע">לביצוע</MenuItem>
                <MenuItem value="בתהליך">בתהליך</MenuItem>
                <MenuItem value="הושלם">הושלם</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTask}
            >
              משימה חדשה
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {task.title}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEditTask(task)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteTask(task.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenChat(task)}>
                      <MessageIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {task.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={getTaskProgress(task)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                  <Chip
                    label={formatDueDate(task.dueDate)}
                    variant="outlined"
                    size="small"
                  />
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AvatarGroup max={3}>
                    {users.filter(u => u.id === task.assignedTo).map((user) => (
                      <Tooltip key={user.id} title={user.name}>
                        <Avatar src={user.avatar} alt={user.name} sx={{ width: 30, height: 30 }} />
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      icon={<MessageIcon />}
                      label={task.description ? task.description.length : 0}
                      size="small"
                      variant="outlined"
                      title="מספר תווים בתיאור"
                    />
                    <Chip
                      icon={<AssignmentIcon />}
                      label={formatDueDate(task.dueDate)}
                      size="small"
                      variant="outlined"
                      title="תאריך יעד"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Task Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTask ? 'ערוך משימה' : 'משימה חדשה'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="כותרת"
              value={selectedTask?.title || ''}
              onChange={(e) => handleTaskChange('title', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="תיאור"
              multiline
              rows={4}
              value={selectedTask?.description || ''}
              onChange={(e) => handleTaskChange('description', e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>סטטוס</InputLabel>
              <Select
                value={selectedTask?.status || 'לביצוע'}
                onChange={(e) => handleTaskChange('status', e.target.value as Task['status'])}
              >
                <MenuItem value="לביצוע">לביצוע</MenuItem>
                <MenuItem value="בתהליך">בתהליך</MenuItem>
                <MenuItem value="הושלם">הושלם</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>עדיפות</InputLabel>
              <Select
                value={selectedTask?.priority || 'בינונית'}
                onChange={(e) => handleTaskChange('priority', e.target.value as Task['priority'])}
              >
                <MenuItem value="נמוכה">נמוכה</MenuItem>
                <MenuItem value="בינונית">בינונית</MenuItem>
                <MenuItem value="גבוהה">גבוהה</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="datetime-local"
              label="תאריך יעד"
              value={selectedTask?.dueDate ? selectedTask.dueDate.slice(0, 16) : ''}
              onChange={(e) => handleTaskChange('dueDate', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>ביטול</Button>
          <Button onClick={handleTaskSubmit} variant="contained" color="primary">
            {selectedTask?.id ? 'עדכן' : 'צור'} משימה
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Drawer */}
      <Drawer
        anchor="left"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 320 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">צ'אט משימה</Typography>
            <IconButton onClick={() => setIsChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />

          <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {messages
              .filter(m => m.relatedTaskId === selectedTask?.id)
              .map((message) => (
                <ListItem key={message.id}>
                  <ListItemAvatar>
                    <Avatar src={users.find(u => u.id === message.senderId)?.avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={users.find(u => u.id === message.senderId)?.name}
                    secondary={message.content}
                  />
                </ListItem>
              ))}
          </List>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="הקלד הודעה..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <IconButton color="primary" onClick={handleSendMessage}>
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Tasks;
