import React from 'react';
import { Card, CardContent, CardActions, Box, Typography, Skeleton } from '@mui/material';

const PremiumCard = ({
  children,
  title,
  subtitle,
  action,
  footer,
  elevation = 0,
  sx = {},
  ...props
}) => {
  return (
    <Card
      elevation={elevation}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(15, 39, 68, 0.06)',
        boxShadow: '0 4px 20px rgba(15, 39, 68, 0.06)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(15, 39, 68, 0.1)',
        },
        ...sx,
      }}
      {...props}
    >
      {(title || subtitle) && (
        <Box sx={{ p: 3, pb: 0 }}>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {children}
      </CardContent>
      {footer && (
        <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
          {footer}
        </CardActions>
      )}
      {action && (
        <CardActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'flex-end' }}>
          {action}
        </CardActions>
      )}
    </Card>
  );
};

export default PremiumCard;
