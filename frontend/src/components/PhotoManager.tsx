import { useRef, useState } from "react";
import { uploadsService } from "@/services";
import { assetUrl, cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";

interface PhotoManagerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  className?: string;
}

export function PhotoManager({ photos, onChange, className }: PhotoManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadsService.upload(file);
      onChange([...photos, url]);
    } catch (err: any) {
      toast({
        title: "Erro ao enviar foto",
        description: err?.response?.data?.error || "Tente uma imagem JPG, PNG ou WEBP de até 8MB.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const url = photos[index];
    setDeletingIndex(index);
    try {
      await uploadsService.remove(url);
    } catch {
      // Se o arquivo já não existir no servidor, ainda removemos da lista.
    } finally {
      onChange(photos.filter((_, i) => i !== index));
      setDeletingIndex(null);
    }
  };

  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 gap-3", className)}>
      {photos.map((foto, index) => (
        <div key={foto + index} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-muted">
          <img src={assetUrl(foto)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setPreviewUrl(foto)}
              className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700"
              aria-label="Visualizar foto"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(index)}
              disabled={deletingIndex === index}
              className="p-1.5 rounded-full bg-white/90 hover:bg-white text-destructive"
              aria-label="Excluir foto"
            >
              {deletingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        <span className="text-xs">{uploading ? "Enviando..." : "Adicionar"}</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelected} />

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-2xl">
          {previewUrl && <img src={assetUrl(previewUrl)} alt="" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
