import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageInputProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function ImageInput({ 
  value = '', 
  onChange, 
  label = 'Image', 
  placeholder = 'https://exemple.com/image.jpg',
  className 
}: ImageInputProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  const clearImage = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label>{label}</Label>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'url' | 'upload')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-2">
          <Input
            type="url"
            value={activeTab === 'url' ? value : ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 flex-1"
            >
              <Upload className="h-4 w-4" />
              Choisir une image
            </Button>
            {preview && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </TabsContent>
      </Tabs>

      {/* Aperçu de l'image */}
      {preview && (
        <div className="relative">
          <div className="relative w-full h-32 border border-border rounded-lg overflow-hidden bg-muted">
            {preview.startsWith('data:') || preview.startsWith('http') ? (
              <img
                src={preview}
                alt="Aperçu"
                className="w-full h-full object-cover"
                onError={() => {
                  setPreview('');
                  onChange('');
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearImage}
            className="absolute top-2 right-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}