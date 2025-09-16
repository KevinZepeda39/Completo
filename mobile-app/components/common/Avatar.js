// components/common/Avatar.js - Componente Avatar reutilizable
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Avatar = ({ 
  user, 
  size = 40, 
  showVerified = false, 
  style = {},
  textStyle = {},
  imageStyle = {}
}) => {
  const userName = user?.nombre || user?.name || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();
  const isEmailVerified = user?.emailVerificado || false;
  const profilePhoto = user?.fotoPerfil;

  const avatarSize = size;
  const borderRadius = avatarSize / 2;

  const avatarStyles = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: borderRadius,
    backgroundColor: profilePhoto ? 'transparent' : (isEmailVerified ? '#4B7BEC' : '#FFCC00'),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...style
  };

  const imageStyles = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: borderRadius,
    ...imageStyle
  };

  const textStyles = {
    fontSize: avatarSize * 0.4,
    fontWeight: 'bold',
    color: '#fff',
    ...textStyle
  };

  return (
    <View style={avatarStyles}>
      {profilePhoto ? (
        <Image 
          source={{ uri: profilePhoto }} 
          style={imageStyles}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyles}>
          {userInitial}
        </Text>
      )}
    </View>
  );
};

export default Avatar;
