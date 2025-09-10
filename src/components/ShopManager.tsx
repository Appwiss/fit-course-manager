import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageInput } from '@/components/ui/image-input';

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*');
      
      if (productsData) {
        const formattedProducts = productsData.map((product: any) => ({
          id: product.id,
          label: product.label,
          description: product.description || '',
          price: parseFloat(product.price.toString()),
          image: product.image || '',
          createdAt: product.created_at
        }));
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setPrice('');
    setImage('');
  };

  const handleCreateProduct = async () => {
    if (!label || !price) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          label,
          description,
          price: parseFloat(price),
          image
        });

      if (error) throw error;

      resetForm();
      loadData();
      toast.success('Produit créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      toast.error('Erreur lors de la création du produit');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadData();
      toast.success('Produit supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
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

    handleCreateProduct();
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
              <Label htmlFor="product-price">Prix (DT)</Label>
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
                    <span className="font-medium">{p.price.toFixed(2)} DT</span>
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
