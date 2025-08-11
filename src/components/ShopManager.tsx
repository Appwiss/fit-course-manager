import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageInput } from '@/components/ui/image-input';
import { LocalStorageService } from '@/lib/localStorage';
import { Product } from '@/types/fitness';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function ShopManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    setProducts(LocalStorageService.getProducts());
  }, []);

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setPrice('');
    setImage('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !description.trim() || !price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const priceNumber = parseFloat(price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      toast.error('Veuillez entrer un prix valide');
      return;
    }

    const product: Product = {
      id: `product-${Date.now()}`,
      label: label.trim(),
      description: description.trim(),
      price: parseFloat(price),
      image: image || undefined,
      createdAt: new Date().toISOString(),
    };

    LocalStorageService.addProduct(product);
    setProducts(LocalStorageService.getProducts());
    resetForm();
    toast.success('Produit créé avec succès');
  };

  const handleDelete = (id: string) => {
    LocalStorageService.deleteProduct(id);
    setProducts(LocalStorageService.getProducts());
    toast.success('Produit supprimé');
  };

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Créer un produit</CardTitle>
          <CardDescription>Libellé, description, prix et image depuis votre ordinateur</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-label">Libellé</Label>
              <Input id="product-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: T-shirt Xtreme" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-price">Prix (€)</Label>
              <Input id="product-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.90" required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre produit..." rows={4} />
            </div>
            <div className="md:col-span-2">
              <ImageInput value={image} onChange={setImage} label="Image du produit" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">Créer le produit</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {products.map((p) => (
            <Card key={p.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {p.image ? (
                  <img src={p.image} alt={`Image du produit ${p.label}`} className="w-full h-40 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center text-muted-foreground">Aucune image</div>
                )}
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold">{p.label}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium">{p.price.toFixed(2)} €</span>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Supprimer</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
