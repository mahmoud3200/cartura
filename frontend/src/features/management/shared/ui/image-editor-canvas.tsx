import Image from "next/image";
import Cropper, { type Area, type Point } from "react-easy-crop";

export function ImageEditorCanvas({
  imageUrl,
  mode,
  aspectRatio,
  crop,
  zoom,
  background,
  onCropChange,
  onZoomChange,
  onCropComplete,
}: {
  imageUrl: string;
  mode: "crop" | "fit";
  aspectRatio: number;
  crop: Point;
  zoom: number;
  background: string;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        data-testid="image-editor-canvas"
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-muted"
        style={{
          aspectRatio,
          maxWidth: `${52 * aspectRatio}dvh`,
        }}
      >
        {mode === "crop" ? (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            showGrid
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={(area) => onCropComplete(area)}
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: background }}>
            <Image
              src={imageUrl}
              alt="Image fit preview"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
