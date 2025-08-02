import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Grid, Card, CardContent, Typography, IconButton, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Button, useTheme
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AccountBalance, Receipt, MoreVert, Add, FileDownload
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { initialTransactions } from '../../data/transactions';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);


  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const incomeAndExpenseMap = transactions.reduce((acc, t) => {
    const category = t.category || 'Uncategorized';
    const type = t.type || 'unknown'; // 'income' or 'expense'

    const label = `${type.toUpperCase()} - ${category}`;
    acc[label] = (acc[label] || 0) + Math.abs(t.amount);

    return acc;
  }, {});

  const labels = Object.keys(incomeAndExpenseMap);
  const data = Object.values(incomeAndExpenseMap);



  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome ? ((netIncome / totalIncome) * 100).toFixed(1) : 0;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);


  // Expense by Category Chart
  const expenseByCategoryMap = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});
  const expenseByCategory = {
    labels: Object.keys(expenseByCategoryMap),
    datasets: [{
      data: Object.values(expenseByCategoryMap),
      backgroundColor: Object.keys(expenseByCategoryMap).map((_, i) =>
        [theme.palette.error.main, theme.palette.primary.main, theme.palette.secondary.main,
        theme.palette.warning.main, theme.palette.info.main, theme.palette.success.main][i % 6]
      ),
      borderWidth: 0,
    }]
  };

  const incomeExpenseData = {
    labels,
    datasets: [
      {
        label: 'Amount',
        data,
        backgroundColor: labels.map(label =>
          label.startsWith('EXPENSE')
            ? 'rgba(218, 45, 68, 0.85)' // red for expenses
            : 'rgba(75, 206, 81, 0.9)' // greenish for income
        ),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };
  

  // Monthly Trends (Mocked for now — adjust as needed)
  const monthlyTrends = {
    labels: ['May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Income',
        data: [2100, 2800, 4000, totalIncome],
        backgroundColor: theme.palette.success.main,
        borderRadius: 8,
      },
      {
        label: 'Expenses',
        data: [1400, 1800, 2300, totalExpenses],
        backgroundColor: theme.palette.error.main,
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: theme.palette.divider } },
    },
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/transactions', {
          headers: {
            user_id: '1'
          }
        });

        const transactions = res.data.data?.transactions || [];
        setTransactions(transactions);

        // Extract and sum up the amounts
        const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
        console.log("Total Amount:", totalAmount); // Or update state if needed

      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);



  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
            </Typography>
            {change && (
              <Chip
                size="small"
                icon={change > 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${change > 0 ? '+' : ''}${change}%`}
                color={change > 0 ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Box sx={{ p: 3 }}><Typography>Loading dashboard...</Typography></Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user?.firstName || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your financial activity this month.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Income" value={totalIncome} change={12.5} icon={<TrendingUp />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Expenses" value={totalExpenses} change={-5.2} icon={<TrendingDown />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Net Income" value={netIncome} change={8.3} icon={<AccountBalance />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Savings Rate" value={`${savingsRate}%`} change={3.1} icon={<Receipt />} color="info" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Expenses by Category</Typography>
                <IconButton size="small"><MoreVert /></IconButton>
              </Box>
              <Box sx={{ height: 300 }}>
                <Doughnut data={incomeExpenseData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Monthly Trends</Typography>
                <IconButton size="small"><MoreVert /></IconButton>
              </Box>
              <Box sx={{ height: 300 }}>
                <Bar data={monthlyTrends} options={barChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Recent Transactions</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<FileDownload />} size="small">Export</Button>
              <Button variant="contained" startIcon={<Add />} size="small">Add Transaction</Button>
            </Box>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: t.type === 'income' ? 'success.main' : 'error.main', width: 32, height: 32 }}>
                          {t.type === 'income' ? <TrendingUp /> : <TrendingDown />}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{t.description}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.category} size="small" variant="outlined"
                        color={t.type === 'income' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(t.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{
                        fontWeight: 'bold',
                        color: t.amount >= 0 ? 'success.main' : 'error.main'
                      }}>
                        {t.amount >= 0 ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
