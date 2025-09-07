// frontend/src/components/AuthForms.jsx

import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Tabs, 
  Tab, 
  Typography, 
  useTheme, 
  useMediaQuery,
  Fade,
  Slide,
  Grow,
  Divider
} from '@mui/material';
import { 
  LockOutlined, 
  PersonAddOutlined, 
  SecurityOutlined,
  VerifiedUserOutlined,
  BusinessCenterOutlined,
  VisibilityOutlined
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthForms() {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();
  const { currentLanguage, isRTL } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

    return (
         <Box 
       sx={{ 
         minHeight: '100vh',
         background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         py: 4,
         position: 'relative',
         overflow: 'hidden',
         fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
       }}
     >
       {/* Subtle Background Pattern */}
       <Box sx={{
         position: 'absolute',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         opacity: 0.1,
         background: `
           radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
           radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
         `
       }} />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Fade in timeout={800}>
                     <Paper 
             elevation={0}
             sx={{ 
               borderRadius: '20px',
               overflow: 'hidden',
               background: 'rgba(255, 255, 255, 0.95)',
               backdropFilter: 'blur(20px)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               boxShadow: `
                 0 25px 50px rgba(0, 0, 0, 0.15),
                 0 10px 20px rgba(0, 0, 0, 0.1),
                 inset 0 1px 0 rgba(255, 255, 255, 0.8)
               `,
               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               position: 'relative',
               '&:hover': {
                 transform: 'translateY(-4px)',
                 boxShadow: `
                   0 35px 70px rgba(0, 0, 0, 0.2),
                   0 15px 30px rgba(0, 0, 0, 0.15),
                   inset 0 1px 0 rgba(255, 255, 255, 0.9)
                 `
               }
             }}
           >
                         {/* Header */}
             <Box sx={{ 
               textAlign: 'center', 
               py: 5, 
               px: 4,
               background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
               color: 'white',
               position: 'relative',
               overflow: 'hidden'
             }}>
               {/* Header Icon */}
               <Box sx={{ mb: 3 }}>
                 <Box sx={{
                   width: 64,
                   height: 64,
                   borderRadius: '16px',
                   background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   mx: 'auto',
                   boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                 }}>
                   <SecurityOutlined sx={{ fontSize: 32, color: 'white' }} />
                 </Box>
               </Box>
               
               <Slide direction="down" in timeout={1000}>
                 <Typography variant="h4" sx={{ 
                   fontWeight: 800, 
                   mb: 2,
                   background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                   backgroundClip: 'text',
                   WebkitBackgroundClip: 'text',
                   WebkitTextFillColor: 'transparent',
                   letterSpacing: '-0.02em'
                 }}>
                   {t('auth.welcome')}
                 </Typography>
               </Slide>
               
               <Slide direction="up" in timeout={1200}>
                 <Typography variant="body1" sx={{ 
                   opacity: 0.8, 
                   mb: 0,
                   fontWeight: 500,
                   letterSpacing: '0.01em'
                 }}>
                   {t('auth.chooseAccountType')}
                 </Typography>
               </Slide>
             </Box>

                                   {/* Tabs */}
             <Box sx={{ 
               borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
               background: 'rgba(248, 250, 252, 0.8)'
             }}>
               <Slide direction="left" in timeout={1400}>
                 <Tabs 
                   value={activeTab} 
                   onChange={handleTabChange}
                   variant="fullWidth"
                   sx={{
                     '& .MuiTab-root': {
                       fontSize: '0.95rem',
                       fontWeight: 600,
                       textTransform: 'none',
                       py: 3,
                       px: 2,
                       color: '#64748b',
                       transition: 'all 0.2s ease',
                       '&:hover': {
                         backgroundColor: 'rgba(59, 130, 246, 0.04)',
                         color: '#3b82f6'
                       }
                     },
                     '& .Mui-selected': {
                       color: '#1e293b !important',
                       fontWeight: 700
                     },
                     '& .MuiTabs-indicator': {
                       height: '3px',
                       borderRadius: '2px',
                       background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                     }
                   }}
                 >
                   <Tab 
                     label={
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <LockOutlined sx={{ fontSize: 18 }} />
                         {t('auth.login')}
                       </Box>
                     }
                   />
                   <Tab 
                     label={
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <PersonAddOutlined sx={{ fontSize: 18 }} />
                         {t('auth.register')}
                       </Box>
                     }
                   />
                 </Tabs>
               </Slide>
             </Box>

                         {/* Tab Content */}
             <Box sx={{ p: isMobile ? 3 : 5 }}>
               <Grow in timeout={1600}>
                 <Box>
                   {activeTab === 0 && <LoginForm />}
                   {activeTab === 1 && <RegisterForm />}
                 </Box>
               </Grow>
             </Box>
          </Paper>
        </Fade>
      </Container>
      
             {/* CSS Animations */}
       <Box
         sx={{
           '@keyframes float': {
             '0%, 100%': { transform: 'translateY(0px)' },
             '50%': { transform: 'translateY(-10px)' }
           }
         }}
       />
    </Box>
  );
}