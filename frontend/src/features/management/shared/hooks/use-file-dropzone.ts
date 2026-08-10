import { useRef, useState, type DragEvent } from "react";

export function useFileDropzone({
  disabled,
  onDropFiles,
}: {
  disabled: boolean;
  onDropFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker() {
    if (!disabled) inputRef.current?.click();
  }

  function handleDrag(event: DragEvent<HTMLDivElement>, active: boolean) {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(active);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    onDropFiles(Array.from(event.dataTransfer.files));
  }

  return {
    inputRef,
    isDragging,
    openFilePicker,
    dropzoneProps: {
      onDragEnter: (event: DragEvent<HTMLDivElement>) =>
        handleDrag(event, true),
      onDragOver: (event: DragEvent<HTMLDivElement>) => handleDrag(event, true),
      onDragLeave: (event: DragEvent<HTMLDivElement>) =>
        handleDrag(event, false),
      onDrop: handleDrop,
    },
  };
}
