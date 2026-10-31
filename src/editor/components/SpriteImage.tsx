import { styled } from "@mui/material/styles";
import { useEffect, useRef, type FC } from "react";

interface SpriteImageProps {
  bitmap: ImageBitmap;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

const Canvas = styled("canvas")({
    width: "100%",
    height: "100%",
    objectFit: "contain"
});

export const SpriteImage: FC<SpriteImageProps> = ({ bitmap, u0, v0, u1, v1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate source pixel dimensions from normalized UVs
  const sourceX = u0 * bitmap.width;
  const sourceY = v0 * bitmap.height;
  const sourceWidth = (u1 - u0) * bitmap.width;
  const sourceHeight = (v1 - v0) * bitmap.height;
  const aspectRatio = sourceWidth / sourceHeight;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Set internal drawing buffer to native sprite dimensions (crisp rendering)
    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw the exact sub-region from the atlas bitmap
    ctx.drawImage(
      bitmap,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );
  }, [bitmap, sourceX, sourceY, sourceWidth, sourceHeight]);

  return (
    <Canvas ref={canvasRef} style={{ aspectRatio: aspectRatio.toString() }} />
  );
};