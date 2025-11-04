import React from 'react';
import { Box, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

function Header() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3,
        pt: 4, // Added padding top to push it to the top
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: 450,
          color: '#1a5f7a',
          mr: 1.5, // Increased margin right for more space
        }}
      >
        Tutor Bot
      </Typography>
      <SchoolIcon sx={{ fontSize: 32, color: '#1a5f7a' }} />
    </Box>
  );
}

export default Header;