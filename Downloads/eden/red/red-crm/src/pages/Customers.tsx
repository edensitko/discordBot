import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import firebase from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive';
  lastContact: string;
  created: string;
  value: number;
}

const initialCustomerState: Omit<Customer, 'id'> = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'active',
  lastContact: new Date().toISOString().split('T')[0],
  created: new Date().toISOString().split('T')[0],
  value: 0,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'error';
    default:
      return 'default';
  }
};

const Customers: React.FC = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState(initialCustomerState);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser]);

  const fetchCustomers = async () => {
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    try {
      setLoading(true);
      const customersRef = collection(firebase.db, `users/${currentUser.uid}/customers`);
      const q = query(customersRef, orderBy('created', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const customersData: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customersData.push({
          id: doc.id,
          ...doc.data() as Omit<Customer, 'id'>
        });
      });
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showSnackbar('שגיאה בטעינת הלקוחות', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    try {
      setLoading(true);
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: formData.status,
        value: Number(formData.value),
        created: selectedCustomer ? formData.created : new Date().toISOString(),
        lastContact: formData.lastContact || new Date().toISOString()
      };
      
      if (selectedCustomer) {
        const customerDoc = doc(firebase.db, `users/${currentUser.uid}/customers/${selectedCustomer.id}`);
        await updateDoc(customerDoc, customerData);
        showSnackbar('הלקוח עודכן בהצלחה', 'success');
      } else {
        const customersRef = collection(firebase.db, `users/${currentUser.uid}/customers`);
        await addDoc(customersRef, customerData);
        showSnackbar('לקוח חדש נוצר בהצלחה', 'success');
      }
      
      handleCloseDialog();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      showSnackbar('שגיאה בשמירת הלקוח', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    if (window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) {
      try {
        setLoading(true);
        const customerDoc = doc(firebase.db, `users/${currentUser.uid}/customers/${id}`);
        await deleteDoc(customerDoc);
        showSnackbar('הלקוח נמחק בהצלחה', 'success');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        showSnackbar('שגיאה במחיקת הלקוח', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(customer);
    } else {
      setSelectedCustomer(null);
      setFormData(initialCustomerState);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    setFormData(initialCustomerState);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredCustomers = customers.filter((customer) =>
    Object.values(customer).some(
      (value) =>
        typeof value === 'string' &&
        value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, direction: 'ltr' }}>
        <Typography variant="h4" component="h1">
          לקוחות
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          לקוח חדש
        </Button>
      </Box>

      <Paper sx={{ mb: 2, direction: 'ltr' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="חיפוש לקוחות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ p: 2 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם</TableCell>
                <TableCell>חברה</TableCell>
                <TableCell>אימייל</TableCell>
                <TableCell>טלפון</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>ערך</TableCell>
                <TableCell>תאריך יצירה</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" />
                        {customer.email}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" />
                        {customer.phone}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status === 'active' ? 'פעיל' : 'לא פעיל'}
                        color={getStatusColor(customer.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>₪{customer.value.toLocaleString()}</TableCell>
                    <TableCell>{new Date(customer.created).toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(customer)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredCustomers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="שורות בעמוד:"
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCustomer ? 'עריכת לקוח' : 'לקוח חדש'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="שם"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="חברה"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="אימייל"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="טלפון"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>סטטוס</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="סטטוס"
                  >
                    <MenuItem value="active">פעיל</MenuItem>
                    <MenuItem value="inactive">לא פעיל</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ערך"
                  name="value"
                  type="number"
                  value={formData.value}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>ביטול</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {selectedCustomer ? 'עדכן' : 'צור'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;
