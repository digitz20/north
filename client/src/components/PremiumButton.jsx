import React from 'react';
import { Box, Typography } from '@mui/material';

const PremiumButton = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  sx = {},
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    border: 'none',
    borderRadius: 2,
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'none',
    letterSpacing: '0.01em',
    position: 'relative',
    overflow: 'hidden',
    opacity: disabled ? 0.6 : 1,
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
      '&:hover:not(:disabled)': {
        background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 102, 255, 0.45)',
      },
    },
    secondary: {
      background: 'linear-gradient(135deg, #00C896 0%, #00BFFF 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(0, 200, 150, 0.3)',
      '&:hover:not(:disabled)': {
        background: 'linear-gradient(135deg, #009B70 0%, #0099CC 100%)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 200, 150, 0.4)',
      },
    },
    outline: {
      background: 'transparent',
      color: '#0066FF',
      border: '1.5px solid rgba(0, 102, 255, 0.4)',
      '&:hover:not(:disabled)': {
        background: 'rgba(0, 102, 255, 0.06)',
        borderColor: '#0066FF',
        transform: 'translateY(-1px)',
      },
    },
    ghost: {
      background: 'transparent',
      color: '#64748B',
      '&:hover:not(:disabled)': {
        background: 'rgba(0, 102, 255, 0.06)',
        color: '#0066FF',
      },
    },
    danger: {
      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(255, 107, 107, 0.3)',
      '&:hover:not(:disabled)': {
        background: 'linear-gradient(135deg, #E55A5A 0%, #FF6B6B 100%)',
        transform: 'translateY(-2px)',
      },
    },
  };

  const sizes = {
    small: { px: 2, py: 1, fontSize: '0.85rem' },
    medium: { px: 3, py: 1.5, fontSize: '0.95rem' },
    large: { px: 4, py: 2, fontSize: '1.05rem' },
  };

  return (
    <Box
      component="button"
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        ...baseStyles,
        ...variants[variant],
        ...sizes[size],
        ...sx,
      }}
      {...props}
    >
      {loading && (
        <Box
          sx={{
            width: 18,
            height: 18,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      {!loading && startIcon && <Box sx={{ display: 'flex' }}>{startIcon}</Box>}
      {children}
      {!loading && endIcon && <Box sx={{ display: 'flex' }}>{endIcon}</Box>}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default PremiumButton;
