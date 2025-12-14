import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, Product } from '@/services/productService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ✅ Base URL for backend (for seeded images)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ✅ Helper: handle both Cloudinary & local images
function getProductImageUrl(product: any) {
  if (!product.image) return '/images/placeholder.png';

  // Full URL (e.g., Cloudinary)
  if (product.image.startsWith('http')) return product.image;

  // Relative path (e.g., /uploads/products/amul-butter.jpg)
  return `${API_BASE_URL}${product.image.startsWith('/') ? product.image : `/${product.image}`}`;
}

const ManageProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminProducts = async () => {
      try {
        const data = await productService.getAllProductsForAdmin();
        setProducts(data || []);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Failed to fetch products';
        toast.error(errorMessage);
        setProducts([]);
        console.error('Error fetching admin products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminProducts();
  }, []);

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    const toastId = toast.loading('Deleting product...');
    try {
      await productService.deleteProduct(productToDelete);
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete));
      toast.success('Product deleted successfully', { id: toastId });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage, { id: toastId });
      console.error('Error deleting product:', error);
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  if (loading) {
    // Skeleton loader
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-4">
      {/* Back button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => window.history.back()}
        className="flex items-center gap-2 mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Button>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Manage Products</CardTitle>
            <CardDescription>
              View, edit, or delete products in your store.
            </CardDescription>
          </div>
          <Button asChild className="btn-hero">
            <Link to="/admin/products/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const finalPrice = product.salePrice ?? product.price;
                    const isDiscounted =
                      product.salePrice && product.salePrice < product.price;
                    const discountPercent = isDiscounted
                      ? Math.round(
                          ((product.price - product.salePrice!) /
                            product.price) *
                            100
                        )
                      : 0;

                    return (
                      <TableRow key={product._id} className="hover:bg-muted/50">
                        <TableCell>
                          <img
                            src={getProductImageUrl(product)}
                            alt={`Image of ${product.name}`}
                            width={50}
                            height={50}
                            className="rounded object-cover aspect-square border border-border/10"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.category || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-brand-primary">
                              ₹{finalPrice.toFixed(2)}
                            </span>
                            {isDiscounted && (
                              <>
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{product.price.toFixed(2)}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-error/20 text-brand-error">
                                  {discountPercent}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            title="Edit Product"
                          >
                            <Link to={`/admin/products/edit/${product._id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => confirmDelete(product._id)}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No products found. Add a new product to get started!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this product? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProducts;
