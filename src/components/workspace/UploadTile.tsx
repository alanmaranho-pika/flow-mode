import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFiles: (files: { dataUrl: string; name: string }[]) => void;
  label?: string;
  className?: string;
  compact?: boolean;
  multiple?: boolean;
  accept?: string;
}

export function UploadTile({
  onFiles,
  label = "drop or click to upload",
  className,
  compact,
  multiple = true,
  accept = "image/*",
}: Props) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null | undefined) {
    if (!fileList || fileList.length === 0) return;
    const acceptPrefix = accept.endsWith("/*") ? accept.slice(0, -1) : "";
    const files = Array.from(fileList).filter((f) =>
      acceptPrefix ? f.type.startsWith(acceptPrefix) : true,
    );
    if (!files.length) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<{ dataUrl: string; name: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ dataUrl: String(reader.result), name: f.name });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(f);
          }),
      ),
    ).then(onFiles);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!hover) setHover(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setHover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white/60 text-ink-tertiary transition-all",
        hover ? "border-lilac bg-lilac-soft" : "hover:border-lilac hover:bg-lilac-soft",
        compact ? "h-[200px] w-[200px]" : "h-40 w-full",
        className,
      )}
    >
      <Upload className="h-6 w-6" />
      <span className="text-[12px]">{label}</span>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
