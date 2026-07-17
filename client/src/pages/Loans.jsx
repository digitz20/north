import React from 'react';
import { Box, Typography, Paper, Grid, Button, Card, CardContent } from '@mui/material';

const Loans = () => {
  const existingLoans = [
    {
      id: 1,
      type: 'Personal Loan',
      amount: 15000,
      remaining: 8500,
      emi: 350,
      nextEmiDate: '2026-08-05'
    }
  ];

  const loanOptions = [
    { type: 'Personal Loan', rate: '8.5% p.a.', maxAmount: '$50,000' },
    { type: 'Home Loan', rate: '6.5% p.a.', maxAmount: '$500,000' },
    { type: 'Auto Loan', rate: '7.2% p.a.', maxAmount: '$75,000' },
    { type: 'Education Loan', rate: '5.8% p.a.', maxAmount: '$100,000' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Loans</Typography>

      {existingLoans.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Your Active Loans</Typography>
          {existingLoans.map((loan) => (
            <Paper key={loan.id} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="h6">{loan.type}</Typography>
                  <Typography color="text.secondary">${loan.amount} total</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography>Remaining: ${loan.remaining}</Typography>
                  <Typography>EMI: ${loan.emi}/month</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography>Next EMI: {loan.nextEmiDate}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button variant="outlined">Pay Now</Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </>
      )}

      <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>Apply for New Loan</Typography>
      <Grid container spacing={3}>
        {loanOptions.map((option, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6">{option.type}</Typography>
                <Typography color="primary" variant="h5" sx={{ my: 1 }}>{option.rate}</Typography>
                <Typography color="text.secondary">Up to {option.maxAmount}</Typography>
                <Button variant="contained" sx={{ mt: 2 }}>Apply Now</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Loans;