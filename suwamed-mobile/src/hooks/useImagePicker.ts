import { useState, useCallback } from 'react';
import { pickImage, takePhoto } from '../utils/permissions';

export const useImagePicker = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const uri = await pickImage();
      if (uri) {
        setSelectedImage(uri);
      }
      return uri;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      const uri = await takePhoto();
      if (uri) {
        setSelectedImage(uri);
      }
      return uri;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return {
    selectedImage,
    isLoading,
    openGallery,
    openCamera,
    clearImage,
  };
};
