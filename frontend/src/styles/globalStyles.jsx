import { Global, css } from '@emotion/react';

const globalStyles = css`
  /* Reset and base styles */
  * {
    box-sizing: border-box;
  }
  
  html {
    scroll-behavior: smooth;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Montserrat', 'Open Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8f9fa;
    color: #1a1a1a;
    line-height: 1.6;
  }

  /* Language-specific font families */
  [lang="en"] {
    font-family: 'Montserrat', 'Open Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  }

  [lang="ar"] {
    font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', 'Arial', sans-serif;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    text-rendering: optimizeLegibility;
  }

  /* Arabic-specific typography improvements */
  [lang="ar"] h1,
  [lang="ar"] h2,
  [lang="ar"] h3,
  [lang="ar"] h4,
  [lang="ar"] h5,
  [lang="ar"] h6 {
    font-family: 'Amiri', 'Noto Naskh Arabic', 'Georgia', serif;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: 0.02em;
  }

  [lang="ar"] p,
  [lang="ar"] span,
  [lang="ar"] div {
    font-family: 'Tajawal', 'Cairo', 'Segoe UI', sans-serif;
    line-height: 1.7;
    letter-spacing: 0.01em;
  }

  [lang="ar"] button,
  [lang="ar"] input,
  [lang="ar"] textarea {
    font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', 'Arial', sans-serif;
    font-weight: 700;
  }

  /* RTL-specific improvements */
  [dir="rtl"] {
    text-align: right;
  }

  [dir="rtl"] h1,
  [dir="rtl"] h2,
  [dir="rtl"] h3,
  [dir="rtl"] h4,
  [dir="rtl"] h5,
  [dir="rtl"] h6 {
    text-align: right;
  }

  [dir="rtl"] p,
  [dir="rtl"] span,
  [dir="rtl"] div {
    text-align: right;
  }

  /* Font loading optimization */
  .font-loading {
    font-display: swap;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #1a237e;
    border-radius: 5px;
    border: 2px solid #f1f1f1;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #534bae;
  }

  /* RTL scrollbar adjustments */
  [dir="rtl"] ::-webkit-scrollbar {
    direction: rtl;
  }
  
  /* Focus styles */
  *:focus {
    outline: 2px solid #1a237e;
    outline-offset: 2px;
  }
  
  /* Button focus styles */
  button:focus {
    outline: 2px solid #1a237e;
    outline-offset: 2px;
  }
  
  /* Link styles */
  a {
    color: #1a237e;
    text-decoration: none;
    transition: color 0.2s ease;
    font-weight: 600;
  }
  
  a:hover {
    color: #534bae;
  }
  
  /* Image styles */
  img {
    max-width: 100%;
    height: auto;
  }
  
  /* Video styles */
  video {
    max-width: 100%;
    height: auto;
  }
  
  /* Utility classes */
  .text-center {
    text-align: center;
  }
  
  .text-left {
    text-align: left;
  }
  
  .text-right {
    text-align: right;
  }

  /* RTL utility classes */
  [dir="rtl"] .text-left {
    text-align: right;
  }

  [dir="rtl"] .text-right {
    text-align: left;
  }
  
  .d-flex {
    display: flex;
  }
  
  .d-none {
    display: none;
  }
  
  .justify-center {
    justify-content: center;
  }
  
  .justify-between {
    justify-content: space-between;
  }
  
  .align-center {
    align-items: center;
  }
  
  .w-100 {
    width: 100%;
  }
  
  .h-100 {
    height: 100%;
  }
  
  .m-0 {
    margin: 0;
  }
  
  .p-0 {
    padding: 0;
  }
  
  /* Animation classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }
  
  .slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  .scale-in {
    animation: scaleIn 0.2s ease-out;
  }

  /* Arabic-specific animations */
  [lang="ar"] .fade-in {
    animation: fadeInRTL 0.3s ease-in;
  }

  [lang="ar"] .slide-up {
    animation: slideUpRTL 0.3s ease-out;
  }
  
  /* Keyframes */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* RTL keyframes */
  @keyframes fadeInRTL {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideUpRTL {
    from {
      transform: translateY(20px) translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0) translateX(0);
      opacity: 1;
    }
  }
  
  /* Responsive utilities */
  @media (max-width: 600px) {
    .hide-mobile {
      display: none !important;
    }
    
    .show-mobile {
      display: block !important;
    }
    
    /* Mobile-specific optimizations */
    .mobile-full-width {
      width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
    
    .mobile-padding {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    
    .mobile-margin {
      margin-left: 8px !important;
      margin-right: 8px !important;
    }

    /* RTL mobile adjustments */
    [dir="rtl"] .mobile-padding {
      padding-right: 16px !important;
      padding-left: 16px !important;
    }

    [dir="rtl"] .mobile-margin {
      margin-right: 8px !important;
      margin-left: 8px !important;
    }
    
    /* Improve touch targets on mobile */
    button, a, [role="button"] {
      min-height: 44px !important;
      min-width: 44px !important;
    }
    
    /* Optimize text for mobile reading */
    body {
      font-size: 16px !important;
      line-height: 1.5 !important;
    }

    /* Arabic mobile typography */
    [lang="ar"] body {
      font-size: 17px !important;
      line-height: 1.7 !important;
    }
  }
  
  @media (min-width: 601px) {
    .hide-desktop {
      display: none !important;
    }
    
    .show-desktop {
      display: block !important;
    }
  }
  
  /* Print styles */
  @media print {
    .no-print {
      display: none !important;
    }
    
    body {
      background: white;
      color: black;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    * {
      border-color: currentColor !important;
    }
    
    .MuiButton-root {
      border: 2px solid currentColor !important;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Light theme enforcement - override any dark mode inheritance */
  @media (prefers-color-scheme: dark) {
    /* Force light theme regardless of system preference */
    body {
      background-color: #f8f9fa !important;
      color: #1a1a1a !important;
    }
    
    .MuiPaper-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .MuiCard-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .MuiAppBar-root {
      background-color: #1a237e !important;
      color: #ffffff !important;
    }
    
    .MuiDrawer-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .MuiTable-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .MuiTableHead-root {
      background-color: #f5f5f5 !important;
      color: #1a1a1a !important;
    }
    
    .MuiTableCell-head {
      color: #1a1a1a !important;
      border-bottom-color: #e0e0e0 !important;
    }
    
    .MuiTableCell-body {
      color: #1a1a1a !important;
      border-bottom-color: #e0e0e0 !important;
    }
    
    .MuiList-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .MuiListItem-root {
      color: #1a1a1a !important;
      border-bottom-color: #e0e0e0 !important;
    }
    
    .MuiListItemText-primary {
      color: #1a1a1a !important;
    }
    
    .MuiListItemText-secondary {
      color: #666666 !important;
    }
    
    .MuiButton-root {
      background-color: #1a237e !important;
      color: #ffffff !important;
    }
    
    .MuiTextField-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
    
    .MuiInputBase-root {
      background-color: #ffffff !important;
      color: #1a1a1a !important;
    }
  }

  /* Arabic-specific enhancements */
  [lang="ar"] {
    /* Better text rendering for Arabic */
    text-rendering: optimizeLegibility;
    -webkit-font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    -moz-font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    
    /* Improved spacing for Arabic text */
    word-spacing: 0.05em;
    letter-spacing: 0.01em;
  }

  /* Font fallback improvements */
  .font-fallback {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  }

  /* Arabic font fallback */
  [lang="ar"] .font-fallback {
    font-family: 'Arial', 'Tahoma', 'Verdana', sans-serif;
  }

  /* Professional styling enhancements */
  .professional-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border: 1px solid rgba(26, 35, 126, 0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .professional-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.16);
  }

  .professional-button {
    background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
    border: none;
    color: white;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.3s ease;
  }

  .professional-button:hover {
    background: linear-gradient(135deg, #000051 0%, #1a237e 100%);
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(26, 35, 126, 0.4);
  }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    text-transform: uppercase;
    background: linear-gradient(135deg, #1a237e 0%, #534bae 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.1em;
  }

  .section-title[lang="ar"] {
    font-family: 'Amiri', serif;
    font-weight: 800;
    text-transform: none;
  }
`;

const GlobalStyles = () => (
  <>
    {/* Google Fonts - Famous Bold Fonts */}
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossOrigin=""
    />
    
    {/* Primary English Fonts - Famous Bold */}
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />

    {/* Arabic Fonts - Bold Weights */}
    <link
      href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700;800&display=swap"
      rel="stylesheet"
    />

    {/* Noto Fonts for Arabic */}
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <Global styles={globalStyles} />
  </>
);

export default GlobalStyles;
