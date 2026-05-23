import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  folder?: string;
}

export function ImageUpload({ bucket, value, onChange, className, folder = "general" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para o upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onChange(data.publicUrl);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn("relative group overflow-hidden rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer flex flex-col items-center justify-center", className)} onClick={() => inputRef.current?.click()}>
      {value ? (
        <>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <button type="button" onClick={handleRemove} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-muted-foreground gap-2">
          {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8 opacity-50" />}
          <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
            {uploading ? 'Enviando...' : 'Adicionar Foto'}
          </span>
        </div>
      )}
      <input
        type="file"
        ref={inputRef}
        onChange={handleUpload}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
