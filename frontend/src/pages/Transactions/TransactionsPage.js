import React, { useState } from 'react';
import { useEffect } from 'react'; // if not already imported
import {
  Box, Typography, Button, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack
} from '@mui/material';
import { format } from 'date-fns';
import { DataGrid, GridToolbarContainer, GridColDef } from '@mui/x-data-grid';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { GlobalStyles } from '@mui/material';






const categories = ["Food", "Travel", "Shopping", "Salary", "Miscellaneous"];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];




const columns: GridColDef[] = [
  {
    field: 'date',
    headerName: 'Date',
    flex: 1,
    valueFormatter: (params) => {
      const date = new Date(params.value);
      const day = date.getDate();
      const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"],
          v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
      };
      const formatted = format(date, 'MMM') + ` ${day}${getOrdinal(day)}`;
      return formatted;
    }
  },
  { field: 'description', headerName: 'Description', flex: 2 },
  {
    field: 'category',
    headerName: 'Category',
    flex: 1,
    renderCell: (params) => (
      <Box sx={{
        backgroundColor: '#f2f4f8',
        color: '#1a1a1a',
        px: 2, py: 0.5,
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'type',
    headerName: 'Type',
    flex: 1,
    renderCell: (params) => (
      <Box sx={{
        backgroundColor: params.value === 'Income' ? '#e6ffe6' : '#ffe6e6',
        color: params.value === 'Income' ? '#087f23' : '#d32f2f',
        px: 2, py: 0.5,
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'amount',
    headerName: 'Amount',
    flex: 1,
    type: 'number',
    renderCell: (params) => {
      const isExpense = params.row.type === 'Expense';
      return (
        <Typography color={isExpense ? 'error.main' : 'success.main'}>
          {isExpense ? `-$${params.value.toFixed(2)}` : `+$${params.value.toFixed(2)}`}
        </Typography>
      );
    },
  },
];

const CustomToolbar = ({ handleExportExcel, handleExportPDF }) => (
  <GridToolbarContainer sx={{ justifyContent: 'flex-end' }}>
    <Stack direction="row" spacing={1} sx={{ m: 1 }}>
      <Button onClick={handleExportExcel} variant="outlined">Export Excel</Button>
      <Button onClick={handleExportPDF} variant="outlined">Export PDF</Button>
    </Stack>
  </GridToolbarContainer>
);

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);



  const [openModal, setOpenModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: '',
    tags: [],
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');



  const handleAddTransaction = async () => {
    const { description, amount, category, date, type, paymentMethod, tags } = formData;

    if (!description || !amount || !category || !date || !type || !paymentMethod) {
      alert('Please fill all required fields.');
      return;
    }

    const payload = {
      type: type.toLowerCase(), // e.g. "Expense" -> "expense"
      amount: parseFloat(amount),
      category,
      date,
      description,
      paymentMethod,
      tags: Array.isArray(tags) ? tags : [],
    };

    try {
      const response = await axios.post(
        'http://localhost:5001/api/newTransactions',
        payload,
        { headers: { user_id: '1' } }
      );

      const newTransaction = response.data.transaction || payload; // fallback if backend doesn't return full object

      // Update local state
      setTransactions((prev) => {
        const updated = [...prev, newTransaction];
        localStorage.setItem('transactions', JSON.stringify(updated));
        return updated;
      });

      // Reset UI
      setOpenModal(false);
      setFormData({
        description: '',
        amount: '',
        type: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: '',
        tags: [],
      });
      setFiles([]);

    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Failed to save transaction. Check console for details.');
    }
  };





  const filteredRows = transactions.filter((row) => {
    const rowMonth = new Date(row.date).getMonth();
    const matchesMonth = rowMonth === selectedMonth;

    const matchesDescription = row.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType ? row.type === filterType : true;

    const matchesDate = filterDate ? row.date === filterDate : true;

    return matchesMonth && matchesDescription && matchesType && matchesDate;
  });



  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'transactions.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const tableRows = filteredRows.map((row) => [
      row.date,
      row.description,
      row.category,
      row.type,
      row.type === 'Expense' ? `-$${row.amount.toFixed(2)}` : `+$${row.amount.toFixed(2)}`,
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save('transactions.pdf');
  };



  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/transactions', {
          headers: {
            user_id: '1', // Adjust if dynamic
          },
        });

        const fetchedTransactions = response.data?.data?.transactions || [];

        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);


  <GlobalStyles styles={{
    '*::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '*::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '*::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderRadius: '8px',
      border: '0.1px solid transparent',
      backgroundClip: 'content-box',
    },
    '*': {
      scrollbarWidth: 'none',
    },
  }} />
  


  return (
    <Box p={3}>
      <Typography variant="h4" textAlign="center" sx={{ mb: 2 }}>
        Transactions
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2, overflowX: 'auto' }}>
        {monthNames.map((month, index) => (
          <Button
            key={month}
            onClick={() => setSelectedMonth(index)}
            variant={selectedMonth === index ? 'contained' : 'text'}
            sx={{
              fontWeight: selectedMonth === index ? 'bold' : 'normal',
              borderRadius: '20px',
              minWidth: 80,
            }}
          >
            {month}
          </Button>
        ))}
      </Stack>


      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          placeholder="🔍 Search by description"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }}
        />

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Income">Income</MenuItem>
            <MenuItem value="Expense">Expense</MenuItem>
          </Select>
        </FormControl>

        <TextField
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          label="Date"
          InputLabelProps={{ shrink: true }}
        />
      </Stack>


      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredRows.map((item) => ({
            id: item._id,
            ...item,
            type: item.type?.charAt(0).toUpperCase() + item.type?.slice(1), // format 'expense' -> 'Expense'
          }))}

          columns={columns}
          pageSize={5}
          disableRowSelectionOnClick
          disableColumnMenu
          components={{
            Toolbar: () => (
              <CustomToolbar
                handleExportExcel={handleExportExcel}
                handleExportPDF={handleExportPDF}
              />
            ),
          }}
        />
      </Box>

      <Box position="fixed" bottom={16} right={16}>
        <Button
          variant="contained"

          onClick={() => setOpenModal(true)}
          sx={{
            borderRadius: '50%',
            minWidth: 56,
            minHeight: 56,
            padding: 0,
            fontSize: 28,
          }}
        >
          +
        </Button>
      </Box>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Transaction</DialogTitle>


        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>

            {files.map((file, idx) => (
              <Typography key={idx} variant="body2">📎 {file.description}</Typography>
            ))}

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="Income">Income</MenuItem>
                <MenuItem value="Expense">Expense</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat, idx) => (
                  <MenuItem key={idx} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Tags (comma separated)"
              value={formData.tags}
              onChange={(e) => {
                const tagsArray = e.target.value.split(',').map(tag => tag.trim());
                setFormData({ ...formData, tags: tagsArray });
              }}
              fullWidth
            />

            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

          </Box>
        </DialogContent>


        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="secondary">Cancel</Button>
          <Button
            onClick={handleAddTransaction}
            variant="contained"
            disabled={!formData.amount || !formData.category}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage;
