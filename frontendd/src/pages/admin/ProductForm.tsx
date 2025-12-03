import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Import services and UI components
import { productService, Product } from '@/services/productService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import BackButton from '@/components/BackButton';

// --- Extend Product type locally to include features if not already ---
export interface ProductWithFeatures extends Product {
  features?: string[];
}

// --- Zod Schema for Validation ---
const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  brand: z.string().min(2, 'Brand is required'),
  category: z.string().min(2, 'Category is required'),
  stock: z.coerce.number().int().nonnegative('Stock must be a non-negative integer'),
  features: z.string().optional(), // comma-separated string
  salePrice: z
    .union([z.coerce.number().positive('Sale price must be positive'), z.literal('')])
    .optional(),
  saleEndDate: z.string().optional().or(z.literal('')),
  isAvailable: z.boolean().default(true),
});

// Type derived from Zod schema
type ProductFormData = z.infer<typeof productSchema>;

// --- Component ---
const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors }, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      brand: '',
      category: '',
      stock: 0,
      features: '',
      salePrice: '',
      saleEndDate: '',
      isAvailable: true,
    },
  });

  // --- Fetch Product Data for Editing ---
  useEffect(() => {
    if (isEditMode && id) {
      const fetchProductData = async () => {
        setIsFetching(true);
        try {
          const product: ProductWithFeatures = await productService.getProductById(id);
          reset({
            name: product.name,
            description: product.description,
            price: product.price,
            brand: product.brand || '',
            category: product.category,
            stock: product.stock,
            features: product.features?.join(', ') || '',
            salePrice: product.salePrice || '',
            saleEndDate: product.saleEndDate ? new Date(product.saleEndDate).toISOString().split('T')[0] : '',
            isAvailable: product.isAvailable,
          });
          if (product.image) setImagePreview(product.image);
        } catch (error) {
          toast.error('Failed to load product data for editing.');
          console.error("Fetch product error:", error);
          navigate('/admin/products');
        } finally {
          setIsFetching(false);
        }
      };
      fetchProductData();
    }
  }, [id, isEditMode, navigate, reset]);

  // --- Image Handling ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        toast.error("Image size should not exceed 2MB.");
        event.target.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error("Invalid image format. Please use JPG, PNG, GIF, or WEBP.");
        event.target.value = '';
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedImageFile(null);
    }
  };

  // --- Form Submission ---
  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    const toastId = toast.loading(isEditMode ? 'Updating product...' : 'Creating product...');
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', String(data.price));
    formData.append('brand', data.brand);
    formData.append('category', data.category);
    formData.append('stock', String(data.stock));
    formData.append('isAvailable', String(data.isAvailable));

    if (data.salePrice && !isNaN(Number(data.salePrice))) formData.append('salePrice', String(data.salePrice));
    if (data.saleEndDate) formData.append('saleEndDate', data.saleEndDate);

    // Convert features to array
    const featuresArray = data.features?.split(',').map(f => f.trim()).filter(f => f) || [];
    formData.append('features', JSON.stringify(featuresArray));

    if (selectedImageFile) formData.append('image', selectedImageFile);
    else if (!isEditMode && !imagePreview) {
      toast.error('Product image is required.', { id: toastId });
      setIsLoading(false);
      return;
    }

    try {
      if (isEditMode && id) {
        await productService.updateProduct(id, formData);
        toast.success('Product updated successfully!', { id: toastId });
      } else {
        await productService.createProduct(formData);
        toast.success('Product created successfully!', { id: toastId });
        reset(); setImagePreview(null); setSelectedImageFile(null);
      }
      navigate('/admin/products');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'An error occurred';
      toast.error(errMsg, { id: toastId });
      console.error("Form submission error:", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return (
    <div className="container mx-auto p-6 text-center text-muted-foreground flex items-center justify-center min-h-[300px]">
      <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading product data...
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <BackButton className="mb-6"/>
      <Card className="max-w-3xl mx-auto shadow-lg border border-border/10">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? 'Edit Product' : 'Add New Product'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update the details for this product.' : 'Fill in the details to create a new product.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Fresh Bananas" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Detailed product description..." rows={4} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" step="0.01" {...register('price')} placeholder="e.g., 50.00" />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input id="stock" type="number" {...register('stock')} placeholder="e.g., 100" />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...register('brand')} placeholder="e.g., Amul" />
                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue('category', value, { shouldValidate: true })} value={watch('category')}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fruits & Vegetables">Fruits & Vegetables</SelectItem>
                    <SelectItem value="Dairy & Eggs">Dairy & Eggs</SelectItem>
                    <SelectItem value="Snacks & Beverages">Snacks & Beverages</SelectItem>
                    <SelectItem value="Personal Care">Personal Care</SelectItem>
                    <SelectItem value="Household Items">Household Items</SelectItem>
                    <SelectItem value="Instant Food">Instant Food</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input id="features" {...register('features')} placeholder="e.g., Organic, Fresh, High Potassium" />
              {errors.features && <p className="text-red-500 text-xs mt-1">{errors.features.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/10 pt-6 mt-6">
              <div>
                <Label htmlFor="salePrice">Sale Price (₹) <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input id="salePrice" type="number" step="0.01" {...register('salePrice', { valueAsNumber: true })} placeholder="e.g., 45.00" />
                {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice.message}</p>}
              </div>
              <div>
                <Label htmlFor="saleEndDate">Sale End Date <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input id="saleEndDate" type="date" {...register('saleEndDate')} />
                {errors.saleEndDate && <p className="text-red-500 text-xs mt-1">{errors.saleEndDate.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="image">Product Image {isEditMode ? '(Leave blank to keep current)' : ''}</Label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview && <img src={imagePreview} alt="Product Preview" className="h-20 w-20 object-cover rounded-md border border-border/10 shadow-sm" />}
                <Input id="image" type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageChange}
                  className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" 
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF, WEBP up to 2MB.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox id="isAvailable" checked={watch('isAvailable')} onCheckedChange={(checked) => setValue('isAvailable', Boolean(checked))} />
              <Label htmlFor="isAvailable" className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Product is available for sale
              </Label>
              {errors.isAvailable && <p className="text-red-500 text-xs mt-1">{errors.isAvailable.message}</p>}
            </div>

            <div className="pt-6 border-t border-border/10 mt-6">
              <Button type="submit" className="w-full btn-hero text-base py-3" disabled={isLoading || isFetching}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;