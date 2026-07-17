import React from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const Investments = () => {
  const investments = [
    {
      id: 1,
      type: 'Mutual Fund',
      name: 'Growth Fund',
      invested: 5000,
      currentValue: 6200,
      returns: '24%'
    },
    {
      id: 2,
      type: 'Stocks',
      name: 'Blue Chip Portfolio',
      invested: 10000,
      currentValue: 12500,
      returns: '25%'
    },
    {
      id: 3,
      type: 'Bonds',
      name: 'Government Bond',
      invested: 3000,
      currentValue: 3300,
      returns: '10%'
    }
  ];

  const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Investments</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary">Total Invested</Typography>
            <Typography variant="h4">${totalInvested.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary">Current Value</Typography>
            <Typography variant="h4" color="success.main">${totalCurrent.toLocaleString()}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Invested</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell>Returns</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {investments.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.type}</TableCell>
                <TableCell>{inv.name}</TableCell>
                <TableCell>${inv.invested.toLocaleString()}</TableCell>
                <TableCell>${inv.currentValue.toLocaleString()}</TableCell>
                <TableCell><Typography color="success.main">{inv.returns}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Investments;