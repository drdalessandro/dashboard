/**
 * PractitionerAvatar.tsx
 * 
 * A reusable component that displays practitioner photo with avatar fallback
 * Handles loading states and error fallbacks gracefully
 */

import React, { useState } from 'react';
import { Avatar, Box } from '@mui/material';

interface PractitionerAvatarProps {
  name: string;
  photo?: string;
  size?: number;
  sx?: any;
}

export const PractitionerAvatar: React.FC<PractitionerAvatarProps> = ({
  name,
  photo,
  size = 60,
  sx = {}
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Show avatar if no photo, image error, or still loading
  const showAvatar = !photo || imageError || imageLoading;

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {photo && !imageError && (
        <Box
          component="img"
          src={photo}
          alt={name}
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid',
            borderColor: 'primary.main',
            display: imageLoading ? 'none' : 'block'
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      
      <Avatar
        alt={name}
        sx={{
          width: size,
          height: size,
          bgcolor: 'primary.main',
          color: 'white',
          fontSize: `${size * 0.4}px`,
          display: showAvatar ? 'flex' : 'none',
          position: photo && !imageError ? 'absolute' : 'static',
          top: 0,
          left: 0
        }}
      >
        {name?.charAt(0) || 'P'}
      </Avatar>
    </Box>
  );
};

export default PractitionerAvatar;
