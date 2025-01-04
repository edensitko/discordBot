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
  orderBy
} from 'firebase/firestore';
import firebase from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: 'חדש' | 'בתהליך' | 'הושלם' | 'לא רלוונטי';
  created: string;
  lastContact: string;
  value: number;
  notes: string;
}

const initialLeadState: Omit<Lead, 'id'> = {
  name: '',
  company: '',
  email: '',
  phone: '',
  source: '',
  status: 'חדש',
  created: new Date().toISOString().split('T')[0],
  lastContact: new Date().toISOString().split('T')[0],
  value: 0,
  notes: '',
};

const sourceOptions = ['אתר', 'פייסבוק', 'לינקדאין', 'המלצה', 'אחר'];
const statusOptions = ['חדש', 'בתהליך', 'הושלם', 'לא רלוונטי'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'חדש':
      return 'info';
    case 'בתהליך':
      return 'warning';
    case 'הושלם':
      return 'success';
    case 'לא רלוונטי':
      return 'error';
    default:
      return 'default';
  }
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'פייסבוק':
      return '📱';
    case 'לינקדאין':
      return '💼';
    case 'אתר':
      return '🌐';
    case 'המלצה':
      return '👥';
    default:
      return '📌';
  }
};

const Leads: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(initialLeadState);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchLeads();
    }
  }, [currentUser]);

  const fetchLeads = async () => {
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    try {
      setLoading(true);
      const leadsRef = collection(firebase.db, `users/${currentUser.uid}/leads`);
      const q = query(leadsRef, orderBy('created', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        leadsData.push({
          id: doc.id,
          ...doc.data() as Omit<Lead, 'id'>
        });
      });
      
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showSnackbar('שגיאה בטעינת הלידים', 'error');
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
      const leadData = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        status: formData.status,
        value: Number(formData.value),
        notes: formData.notes,
        created: selectedLead ? formData.created : new Date().toISOString(),
        lastContact: formData.lastContact || new Date().toISOString()
      };
      
      if (selectedLead) {
        const leadDoc = doc(firebase.db, `users/${currentUser.uid}/leads/${selectedLead.id}`);
        await updateDoc(leadDoc, leadData);
        showSnackbar('הליד עודכן בהצלחה', 'success');
      } else {
        const leadsRef = collection(firebase.db, `users/${currentUser.uid}/leads`);
        await addDoc(leadsRef, leadData);
        showSnackbar('ליד חדש נוצר בהצלחה', 'success');
      }
      
      handleCloseDialog();
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      showSnackbar('שגיאה בשמירת הליד', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) {
      showSnackbar('נא להתחבר למערכת', 'error');
      return;
    }

    if (window.confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) {
      try {
        setLoading(true);
        const leadDoc = doc(firebase.db, `users/${currentUser.uid}/leads/${id}`);
        await deleteDoc(leadDoc);
        showSnackbar('הליד נמחק בהצלחה', 'success');
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        showSnackbar('שגיאה במחיקת הליד', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredLeads = leads.filter((lead) =>
    Object.values(lead).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (lead: Lead | null = null) => {
    setSelectedLead(lead);
    setFormData(lead || initialLeadState);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLead(null);
    setFormData(initialLeadState);
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

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' , direction: 'ltr' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          לידים
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          ליד חדש
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 , direction: 'ltr' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="חיפוש לידים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם</TableCell>
                <TableCell>משפחה</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>הגיע מ</TableCell>
                <TableCell>סכום</TableCell>
                <TableCell>עודכן לאחרונה</TableCell>
                <TableCell>סושיאל</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : filteredLeads
              ).map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {lead.name}
                     
                    </Box>
                  </TableCell>
                  <TableCell>{lead.company}</TableCell>
                  
                  <TableCell>

                    <Chip
                      label={lead.status}
                      color={getStatusColor(lead.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSourceIcon(lead.source)} {lead.source}
                    </Box>
                  </TableCell>
                  <TableCell>₪{lead.value.toLocaleString()}</TableCell>
                  <TableCell>{new Date(lead.lastContact).toLocaleDateString('he-IL')}</TableCell>

                  <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" href={`mailto:${lead.email}`}>
                          <EmailIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" href={`tel:${lead.phone}`}>
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(lead)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(lead.id)} color="error" size="small">
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
          count={filteredLeads.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="שורות בעמוד"
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" dir='rtl' fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedLead ? 'עריכת ליד' : 'ליד חדש'}
          </DialogTitle>
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
                  <InputLabel>מקור</InputLabel>
                  <Select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    label="מקור"
                  >
                    {sourceOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
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
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="הערות"
                  name="notes"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>ביטול</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {selectedLead ? 'עדכן' : 'צור'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Leads;
