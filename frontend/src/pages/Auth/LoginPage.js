import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  Container,
  Grid,
  Avatar,
  Fade,
  useTheme
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  AccountBalance,
  TrendingUp,
  Security,
  Speed
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    const result = await login(formData.email, formData.password);
    console.log('Login result:', result);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    {
      icon: <AccountBalance />,
      title: 'Track Expenses',
      description: 'Monitor your income and expenses with detailed categorization'
    },
    {
      icon: <TrendingUp />,
      title: 'Financial Insights',
      description: 'Get detailed analytics and reports on your spending habits'
    },
    {
      icon: <Security />,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and completely secure'
    },
    {
      icon: <Speed />,
      title: 'OCR Technology',
      description: 'Automatically extract data from receipts using AI'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Features */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
              <Box sx={{ color: 'white', mb: 4 }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  💰 Personal Finance Assistant
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                  Take control of your finances with intelligent tracking, 
                  automated receipt processing, and powerful analytics.
                </Typography>
                
                <Grid container spacing={3}>
                  {features.map((feature, index) => (
                    <Fade in timeout={1000 + index * 200} key={index}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)', 
                              color: 'white',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            {feature.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {feature.title}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {feature.description}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Fade>
                  ))}
                </Grid>
              </Box>
            </Fade>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1200}>
              <Card 
                sx={{ 
                  maxWidth: 400, 
                  mx: 'auto',
                  backdropFilter: 'blur(20px)',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: 64, 
                        height: 64, 
                        mx: 'auto', 
                        mb: 2 
                      }}
                    >
                      <AccountBalance fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign in to access your financial dashboard
                    </Typography>
                  </Box>

                  {(error || localError) && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error || localError}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      name="email"
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      margin="normal"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      margin="normal"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ 
                        mb: 3, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>

                    <Divider sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        OR
                      </Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Don't have an account?{' '}
                        <Link
                          component={RouterLink}
                          to="/register"
                          sx={{ 
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Create Account
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Demo Credentials */}
        <Fade in timeout={1500}>
          <Card 
            sx={{ 
              mt: 4, 
              maxWidth: 600, 
              mx: 'auto',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
                🚀 Demo Credentials
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ color: 'white', textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Email: demo@financeapp.com
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ color: 'white', textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Password: Demo123!
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;