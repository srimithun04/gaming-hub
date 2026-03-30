import React, { useRef, useEffect, useState } from 'react';

const DynamicCanvasCrop = ({ src, cropData, alt, ...props }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [useFallbackImg, setUseFallbackImg] = useState(false);

  useEffect(() => {
    // 1. If there's no crop data, just show the normal image!
    if (!src || !cropData) {
      setUseFallbackImg(true);
      return;
    }

    let parsedCrop;
    try {
      parsedCrop = JSON.parse(cropData).cropBox;
      if (!parsedCrop || typeof parsedCrop.width === 'undefined') {
          setUseFallbackImg(true);
          return;
      }
    } catch (e) {
      setUseFallbackImg(true);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous'; 
    image.src = src;

    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const imageWidth = image.naturalWidth;
      const imageHeight = image.naturalHeight;

      let pixelX = (parsedCrop.x / 100) * imageWidth;
      let pixelY = (parsedCrop.y / 100) * imageHeight;
      let pixelWidth = (parsedCrop.width / 100) * imageWidth;
      let pixelHeight = (parsedCrop.height / 100) * imageHeight;

      // Safety check: if math fails, show normal image
      if (pixelWidth > imageWidth || isNaN(pixelWidth) || pixelWidth === 0) {
         setUseFallbackImg(true);
         return;
      }

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;

      ctx.drawImage(image, pixelX, pixelY, pixelWidth, pixelHeight, 0, 0, pixelWidth, pixelHeight);
      setLoading(false);
    };

    image.onerror = () => { setUseFallbackImg(true); };

  }, [src, cropData]); 

  // IF NO CROP DATA EXISTS: Render a standard img tag with the original game picture
  if (useFallbackImg) {
    return (
      <img
        src={src}
        alt={alt}
        {...props} // This safely applies the "carousel-img" CSS class so it stays 180px tall!
        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=500"; }}
      />
    );
  }

  // Render the Custom Cropped Canvas
  return (
    <canvas
      ref={canvasRef}
      alt={alt}
      style={{ display: loading ? 'none' : 'block', ...props.style }}
      {...props}
    />
  );
};

export default DynamicCanvasCrop;