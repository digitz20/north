import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const PremiumStatCard = ({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  positive = true,
  icon,
  gradient = 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 100%)',
  delay = 0,
  sx = {},
}) => {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <Box ref={ref} sx={{ height: '100%' }}>
      <Box
        sx={{
          p: 4,
          height: '100%',
          background: gradient,
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 15px 35px -8px rgba(0, 102, 255, 0.3), 0 10px 25px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 45px -8px rgba(0, 102, 255, 0.4), 0 15px 35px rgba(0, 0, 0, 0.15)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '50%',
            filter: 'blur(30px)',
          },
          ...sx,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ opacity: 0.9 }}>{icon}</Box>
            {change && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {positive ? (
                  <ArrowUpward sx={{ fontSize: 16, color: '#00ff88' }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: '#ff6b6b' }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.8, fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {inView ? (
              <CountUp
                start={0}
                end={value}
                duration={2.5}
                prefix={prefix}
                suffix={suffix}
                separator=","
                decimals={2}
                delay={delay}
              />
            ) : (
              <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PremiumStatCard;
