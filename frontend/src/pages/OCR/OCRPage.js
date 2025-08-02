import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent,
  Snackbar, Alert, CircularProgress, Grid, InputBase, IconButton,
  MenuItem, Select, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const UploadBox = styled(Box)(({ theme }) => ({
  border: '2px dashed #ccc',
  borderRadius: '12px',
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: '#f9f9f9',
  cursor: 'pointer',
}));

const PreviewImage = styled('img')({
  width: '100%',
  height: 180,
  objectFit: 'cover',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.03)',
  },
});

const ReceiptCard = ({ receipt, onDelete }) => (
  <Card sx={{
    borderRadius: 4,
    position: 'relative',
    boxShadow: 3,
    '&:hover': { boxShadow: 6 }
  }}>
    <PreviewImage src={receipt.preview} alt="receipt" />

    <CardContent>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {receipt.merchant || 'Unknown Store'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {receipt.date || 'No Date'} — ₹{receipt.amount || '0.00'}
      </Typography>
      <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
        Category: {receipt.category || 'Uncategorized'}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        color="error"
        sx={{ mt: 1 }}
        startIcon={<DeleteIcon />}
        onClick={() => onDelete(receipt)}
      >
        Delete
      </Button>
    </CardContent>
  </Card>
);

const OCRPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [receipts, setReceipts] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // For category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('receipts');
    if (saved) {
      setReceipts(JSON.parse(saved));
    }
  }, []);

  const saveReceipts = (data) => {
    const updated = [data, ...receipts];
    setReceipts(updated);
    localStorage.setItem('receipts', JSON.stringify(updated));
  };

  // Style for better image preview on hover



  const handleDelete = (toDelete) => {
    const updated = receipts.filter(r => r.preview !== toDelete.preview);
    setReceipts(updated);
    localStorage.setItem('receipts', JSON.stringify(updated));
    setSnackbar({ open: true, message: 'Receipt deleted', severity: 'info' });
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const previewURL = URL.createObjectURL(selected);
    setFile(selected);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await axios.post('http://localhost:5001/process-receipt', formData);
      const { extractedMerchant, extractedDate, extractedAmount } = res.data?.data || {};

      const extractedData = {
        merchant: extractedMerchant,
        date: extractedDate,
        amount: extractedAmount,
        preview: previewURL,
      };

      setPendingReceipt(extractedData);
      setCategoryDialogOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'Failed to process receipt.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWithCategory = async () => {
    if (!pendingReceipt) return;

    const updatedReceipt = {
      ...pendingReceipt,
      type: pendingReceipt.type || 'expense',
      category: pendingReceipt.category || categoryInput || 'Uncategorized',
      description: pendingReceipt.description || '',
      paymentMethod: pendingReceipt.paymentMethod || '',
      tags: pendingReceipt.tags || [],
      date: pendingReceipt.date || new Date().toISOString(),
    };

    try {
      // Send to backend
      await axios.post(
        'http://localhost:5001/api/newTransactions',
        {
          ...updatedReceipt,
          amount: parseFloat(pendingReceipt.amount || 0), // from OCR
        },
        {
          headers: {
            user_id: '1', // or dynamic if needed
          },
        }
      );

      saveReceipts(updatedReceipt);
      setSnackbar({ open: true, message: 'Receipt saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setSnackbar({ open: true, message: 'Failed to save to backend.', severity: 'error' });
    }

    setCategoryInput('');
    setPendingReceipt(null);
    setCategoryDialogOpen(false);
  };


  const filteredReceipts = receipts
    .filter((r) => r.merchant?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortBy) return 0;
      if (sortBy === 'merchant') return a.merchant.localeCompare(b.merchant);
      if (sortBy === 'amount') return parseFloat(b.amount) - parseFloat(a.amount);
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      return 0;
    });

  return (
    <Box sx={{ px: 4, py: 5 }}>
      <Typography variant="h4" gutterBottom>Receipts</Typography>

      {/* Upload UI */}
      <UploadBox>
        <Typography variant="h6" gutterBottom>
          Drag and drop or browse to upload
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Upload your receipts in image or PDF format. We’ll extract the key information for you.
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Browse Files'}
          <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
        </Button>
      </UploadBox>

      {/* Filter Bar */}
      {receipts.length > 0 && (
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Uploaded Receipts</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Paper
              sx={{ display: 'flex', alignItems: 'center', width: 300, pl: 1, borderRadius: 2 }}
            >
              <SearchIcon sx={{ mr: 1 }} />
              <InputBase
                placeholder="Search receipts..."
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Paper>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="merchant">Merchant</MenuItem>
              <MenuItem value="amount">Amount</MenuItem>
            </Select>
          </Stack>
        </Box>
      )}

      {/* Gallery */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {filteredReceipts.map((receipt, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
            <ReceiptCard receipt={receipt} onDelete={handleDelete} />
          </Grid>
        ))}
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>Add Category</DialogTitle>

        <DialogContent>


          <Typography sx={{ mt: 1, mb: 1 }}>
            <strong>Amount (OCR):</strong> ₹{pendingReceipt?.amount || '0.00'}
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Type"
            fullWidth
            variant="outlined"
            value={pendingReceipt?.type || ''}
            onChange={(e) =>
              setPendingReceipt({ ...pendingReceipt, type: e.target.value })
            }
          />

          <TextField
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={pendingReceipt?.category || ''}
            onChange={(e) =>
              setPendingReceipt({ ...pendingReceipt, category: e.target.value })
            }
          />

          <TextField
            margin="dense"
            label="Date"
            type="datetime-local"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={pendingReceipt?.date || ''}
            onChange={(e) =>
              setPendingReceipt({ ...pendingReceipt, date: e.target.value })
            }
          />

          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={pendingReceipt?.description || ''}
            onChange={(e) =>
              setPendingReceipt({ ...pendingReceipt, description: e.target.value })
            }
          />

          <TextField
            margin="dense"
            label="Payment Method"
            fullWidth
            variant="outlined"
            value={pendingReceipt?.paymentMethod || ''}
            onChange={(e) =>
              setPendingReceipt({ ...pendingReceipt, paymentMethod: e.target.value })
            }
          />

          <TextField
            margin="dense"
            label="Tags (comma separated)"
            fullWidth
            variant="outlined"
            value={pendingReceipt?.tags?.join(', ') || ''}
            onChange={(e) =>
              setPendingReceipt({
                ...pendingReceipt,
                tags: e.target.value.split(',').map((t) => t.trim()),
              })
            }
          />
        </DialogContent>


        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWithCategory} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OCRPage;
