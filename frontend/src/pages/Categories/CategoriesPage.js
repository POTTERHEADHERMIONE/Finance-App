import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as SwapHorizIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
// Color picker removed for simplicity - using text input instead
import categoryService from '../../services/categoryService';

const CategoriesPage = () => {
  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  


  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'expense',
    color: '#1976d2',
    icon: 'category',
    parentCategory: '',
    budgetLimit: 0
  });
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/categories', {
          headers: {
            user_id: localStorage.getItem('user_id') || 'demoUser123',
          },
        });

        let filtered = response.data;

        if (typeFilter !== 'all') {
          filtered = filtered.filter(cat => cat.type === typeFilter);
        }

        if (!showArchived) {
          filtered = filtered.filter(cat => cat.isActive);
        }

        setCategories(filtered);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [typeFilter, showArchived]); // re-run on filter changes
  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [typeFilter, showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getCategories(typeFilter === 'all' ? null : typeFilter);
      let filteredCategories = response.data;

      if (!showArchived) {
        filteredCategories = filteredCategories.filter(cat => cat.isActive);
      }
      
      setCategories(filteredCategories);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        type: category.type,
        color: category.color,
        icon: category.icon,
        parentCategory: category.parentCategory?._id || '',
        budgetLimit: category.budgetLimit || 0
      });
      setIsEditing(true);
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        type: 'expense',
        color: '#1976d2',
        icon: 'category',
        parentCategory: '',
        budgetLimit: 0
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      type: 'expense',
      color: '#1976d2',
      icon: 'category',
      parentCategory: '',
      budgetLimit: 0
    });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await categoryService.updateCategory(selectedCategory._id, formData);
        setSuccess('Category updated successfully');
      } else {
        const created = await categoryService.createCategory(formData);
        // Optimistic update
        setCategories(prev => [...prev, created]);
        setSuccess('Category created successfully');
      }
      handleCloseDialog();
      // Also fetch from backend to ensure accurate sync
      loadCategories();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };
  

  const handleDelete = async (category) => {
    try {
      await categoryService.deleteCategory(category._id);
      setSuccess('Category deleted successfully');
      setDeleteDialogOpen(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleArchive = async (category) => {
    try {
      if (category.isActive) {
        await categoryService.archiveCategory(category._id);
        setSuccess('Category archived successfully');
      } else {
        await categoryService.restoreCategory(category._id);
        setSuccess('Category restored successfully');
      }
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive/restore category');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await categoryService.bulkDeleteCategories(selectedCategories);
      setSuccess(`${selectedCategories.length} categories deleted successfully`);
      setBulkDeleteDialogOpen(false);
      setSelectedCategories([]);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete categories');
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    const userCategories = categories.filter(cat => cat.userId && !cat.isDefault);
    if (selectedCategories.length === userCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(userCategories.map(cat => cat._id));
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'income': return <TrendingUpIcon color="success" />;
      case 'expense': return <TrendingDownIcon color="error" />;
      case 'both': return <SwapHorizIcon color="primary" />;
      default: return <CategoryIcon />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'error';
      case 'both': return 'primary';
      default: return 'default';
    }
  };

  const iconOptions = [
    'category', 'work', 'business', 'trending_up', 'restaurant', 'directions_car',
    'shopping_cart', 'movie', 'receipt', 'local_hospital', 'school', 'flight',
    'security', 'add_circle', 'remove_circle', 'home', 'fitness_center',
    'pets', 'child_care', 'elderly', 'celebration', 'gift', 'savings'
  ];

  const colorOptions = [
    '#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f',
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f', '#1976d2'
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Categories</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setBulkDeleteDialogOpen(true)}
            disabled={selectedCategories.length === 0}
            startIcon={<DeleteIcon />}
            sx={{ mr: 1 }}
          >
            Delete Selected ({selectedCategories.length})
          </Button>
          <Tooltip title="Add New Category">
            <Fab
              color="primary"
              onClick={() => handleOpenDialog()}
              size="medium"
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type Filter</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type Filter"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                }
                label="Show Archived"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedCategories.length === categories.filter(cat => cat.userId && !cat.isDefault).length}
                    onChange={handleSelectAll}
                    disabled={categories.filter(cat => cat.userId && !cat.isDefault).length === 0}
                  />
                }
                label="Select All"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category._id}>
            <Card 
              sx={{ 
                position: 'relative',
                opacity: category.isActive ? 1 : 0.6,
                border: selectedCategories.includes(category._id) ? 2 : 1,
                borderColor: selectedCategories.includes(category._id) ? 'primary.main' : 'divider'
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Checkbox
                    checked={selectedCategories.includes(category._id)}
                    onChange={() => handleCategorySelect(category._id)}
                    disabled={!category.userId || category.isDefault}
                  />
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: category.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {category.name}
                  </Typography>
                  {getTypeIcon(category.type)}
                </Box>

                {category.description && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {category.description}
                  </Typography>
                )}

                <Box display="flex" alignItems="center" mb={1}>
                  <Chip
                    label={category.type}
                    size="small"
                    color={getTypeColor(category.type)}
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  {category.isDefault && (
                    <Chip label="Default" size="small" color="secondary" />
                  )}
                  {!category.isActive && (
                    <Chip label="Archived" size="small" color="warning" />
                  )}
                </Box>

                {category.budgetLimit > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Budget: ${category.budgetLimit.toLocaleString()}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  Used {category.usageCount} times
                </Typography>

                <Box display="flex" justifyContent="flex-end" mt={1}>
                  {category.userId && !category.isDefault && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(category)}
                        disabled={!category.isActive}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleArchive(category)}
                      >
                        {category.isActive ? <ArchiveIcon /> : <RestoreIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedCategory(category);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={!category.isActive}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Category' : 'Create New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" alignItems="center" mt={2}>
              <TextField
                label="Color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <IconButton
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <ColorLensIcon />
              </IconButton>
            </Box>

            {colorPickerOpen && (
              <Box mt={1} p={2} border={1} borderColor="divider" borderRadius={1}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Choose a color or enter a hex code
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {colorOptions.map((color) => (
                    <Box
                      key={color}
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? 3 : 1,
                        borderColor: formData.color === color ? 'primary.main' : 'divider'
                      }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="#1976d2"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </Box>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Icon</InputLabel>
              <Select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                label="Icon"
              >
                {iconOptions.map((icon) => (
                  <MenuItem key={icon} value={icon}>
                    <Box display="flex" alignItems="center">
                      <span className="material-icons" style={{ marginRight: 8 }}>
                        {icon}
                      </span>
                      {icon}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Budget Limit (optional)"
              type="number"
              value={formData.budgetLimit}
              onChange={(e) => setFormData({ ...formData, budgetLimit: parseFloat(e.target.value) || 0 })}
              margin="normal"
              InputProps={{
                startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDelete(selectedCategory)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Delete Multiple Categories</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCategories.length} selected categories? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoriesPage;