import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  useTheme, 
  useMediaQuery, 
  Fade, 
  Slide, 
  Grow,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  AttachMoney,
  TrendingUp,
  Business,
  Person,
  CheckCircle,
  Star,
  VideoLibrary,
  MonetizationOn,
  Security,
  Speed,
  ArrowForward
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AuthForms from './AuthForms';

export default function CreativeMainPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  // Feature showcase data
  const features = [
    {
      icon: <AttachMoney sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Earn While You Watch',
      description: 'Get paid in real-time for every ad you complete. Turn your screen time into income!',
      color: '#4CAF50'
    },
    {
      icon: <Business sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: 'Business Growth Platform',
      description: 'Reach targeted audiences with engaging video ads. Boost your business visibility.',
      color: '#2196F3'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#FF9800' }} />,
      title: 'Secure & Transparent',
      description: 'Blockchain-powered rewards system with instant payments and full transparency.',
      color: '#FF9800'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#9C27B0' }} />,
      title: 'Lightning Fast',
      description: 'Quick video completion, instant rewards, and seamless user experience.',
      color: '#9C27B0'
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Simulate video progress
  useEffect(() => {
    if (isPlaying && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setShowReward(true);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, progress]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetVideo = () => {
    setProgress(0);
    setShowReward(false);
    setIsPlaying(true);
  };

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  if (showAuth) {
    return <AuthForms />;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        animation: 'float 20s ease-in-out infinite'
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 4,
          alignItems: 'center'
        }}>
          
          {/* Left Side - Video Showcase */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* App Logo & Title */}
            <Fade in timeout={1000}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  mx: 'auto',
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)'
                }}>
                  <VideoLibrary sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 800, 
                  color: 'white',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  mb: 1
                }}>
                  View Rewards
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 300
                }}>
                  Watch. Earn. Grow.
                </Typography>
              </Box>
            </Fade>

            {/* Feature Showcase */}
            <Box sx={{ mb: 4, width: '100%', maxWidth: 400 }}>
              <Grow in timeout={800}>
                <Paper sx={{
                  p: 3,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <Box sx={{ mb: 2 }}>
                    {features[currentFeature].icon}
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: features[currentFeature].color
                  }}>
                    {features[currentFeature].title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {features[currentFeature].description}
                  </Typography>
                </Paper>
              </Grow>
            </Box>

            {/* Demo Video */}
            <Box sx={{ mb: 4, width: '100%', maxWidth: 400 }}>
              <Grow in timeout={1600}>
                <Box>
                  <Typography variant="h6" sx={{ 
                    textAlign: 'center', 
                    mb: 2, 
                    color: 'white',
                    fontWeight: 600,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}>
                    🎬 See How It Works
                  </Typography>
                  
                  {/* Demo Video Component */}
                  <Box sx={{ 
                    width: '100%', 
                    maxWidth: 400,
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                  }}>
                    {/* Video Placeholder */}
                    <Box sx={{
                      width: '100%',
                      height: 300,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: 'pointer'
                    }} onClick={togglePlayPause}>
                      
                      {/* Play/Pause Icon */}
                      {!isPlaying && (
                        <IconButton
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            color: theme.palette.primary.main,
                            width: 80,
                            height: 80,
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,1)',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 40 }} />
                        </IconButton>
                      )}

                      {/* Video Content Overlay */}
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        color: 'white',
                        p: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          🍕 Amazing Pizza Restaurant
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Best pizza in Kuwait! Fresh ingredients, authentic taste.
                        </Typography>
                      </Box>

                      {/* Progress Bar */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4
                      }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${progress}%`,
                            backgroundColor: showReward ? '#4CAF50' : '#FFD700',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </Box>

                      {/* Reward Indicator */}
                      {showReward && (
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          color: 'white',
                          zIndex: 10
                        }}>
                          <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            +5 Fils Earned!
                          </Typography>
                          <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            Video completed successfully
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Video Info */}
                    <Paper sx={{ p: 2, borderRadius: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoney sx={{ color: '#4CAF50' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Earn 5 fils
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Star sx={{ color: '#2196F3' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {Math.floor(progress / 10)} views
                          </Typography>
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={togglePlayPause}
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark
                            }
                          }}
                        >
                          {isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                        
                        {showReward && (
                          <IconButton
                            onClick={resetVideo}
                            sx={{
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#45a049'
                              }
                            }}
                          >
                            <TrendingUp />
                          </IconButton>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Grow>
            </Box>

            {/* Stats Cards */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              width: '100%',
              maxWidth: 400
            }}>
              <Slide direction="up" in timeout={1200}>
                <Paper sx={{
                  p: 2,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <AttachMoney sx={{ color: '#4CAF50', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                    +5 Fils
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Per Video
                  </Typography>
                </Paper>
              </Slide>
              <Slide direction="up" in timeout={1400}>
                <Paper sx={{
                  p: 2,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <TrendingUp sx={{ color: '#2196F3', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196F3' }}>
                    10K+
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Active Users
                  </Typography>
                </Paper>
              </Slide>
            </Box>
          </Box>

          {/* Right Side - Content & CTA */}
          <Slide direction="left" in timeout={800}>
            <Box>
              <Paper sx={{
                p: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                maxWidth: 450,
                mx: 'auto'
              }}>
                {/* Main CTA */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 2,
                    background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Start Earning Today
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                    Join thousands of users who are already earning money by watching engaging business videos.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetStarted}
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 2,
                      px: 4,
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                      borderRadius: 3,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #45a049, #1976d2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 35px rgba(76, 175, 80, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Get Started Now
                  </Button>
                </Box>

                {/* How It Works */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
                    How It Works
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ textAlign: 'center', height: '100%' }}>
                        <CardContent>
                          <Person sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            For Viewers
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Watch business videos and earn money instantly
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ textAlign: 'center', height: '100%' }}>
                        <CardContent>
                          <Business sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            For Businesses
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Create engaging ads and reach your target audience
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Trust Indicators */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Trusted by thousands of users
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} sx={{ color: '#FFD700', fontSize: 20 }} />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Slide>
        </Box>
      </Container>

             {/* CSS Animations */}
       <Box
         sx={{
           '@keyframes float': {
             '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
             '33%': { transform: 'translateY(-20px) rotate(1deg)' },
             '66%': { transform: 'translateY(10px) rotate(-1deg)' }
           }
         }}
       />
    </Box>
  );
}
