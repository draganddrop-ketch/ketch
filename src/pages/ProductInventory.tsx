import { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Upload, Image as ImageIcon, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KeyringItem } from '../types';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const ProductInventory = () => {
  const [products, setProducts] = useState<KeyringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<KeyringItem | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    menu_category: '',
    sub_category: '',
    price: '',
    description: '',
    is_best: false,
    is_new: false,
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    return () => {
      if (mainImagePreviewUrl) URL.revokeObjectURL(mainImagePreviewUrl);
      galleryPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `public/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const handleEditProduct = (product: KeyringItem) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      category: product.category,
      menu_category: product.menu_category || '',
      sub_category: product.sub_category || '',
      price: product.price.toString(),
      description: product.description || '',
      is_best: product.is_best || false,
      is_new: product.is_new || false,
    });

    if (product.image) {
      setMainImagePreviewUrl(product.image);
    }

    if (product.gallery_images && product.gallery_images.length > 0) {
      setGalleryPreviewUrls(product.gallery_images);
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);

      if (mainImagePreviewUrl && mainImagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mainImagePreviewUrl);
      }
      setMainImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setGalleryFiles(filesArray);

      galleryPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      const previewUrls = filesArray.map(file => URL.createObjectURL(file));
      setGalleryPreviewUrls(previewUrls);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviewUrls(prev => {
      if (prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    if (!editFormData.name || !editFormData.category || !editFormData.price) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);

      let mainImageUrl = editingProduct.image;
      if (mainImageFile) {
        const url = await uploadImage(mainImageFile);
        if (url) {
          mainImageUrl = url;
        } else {
          setMessage('Failed to upload main image');
          return;
        }
      }

      let galleryUrls = editingProduct.gallery_images || [];
      if (galleryFiles.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of galleryFiles) {
          const url = await uploadImage(file);
          if (url) {
            uploadedUrls.push(url);
          }
        }
        if (uploadedUrls.length > 0) {
          galleryUrls = uploadedUrls;
        }
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: editFormData.name,
          category: editFormData.category,
          menu_category: editFormData.menu_category || null,
          sub_category: editFormData.sub_category || null,
          price: parseFloat(editFormData.price),
          description: editFormData.description,
          image_url: mainImageUrl,
          gallery_images: galleryUrls,
          is_best: editFormData.is_best,
          is_new: editFormData.is_new,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setMessage('Product updated successfully');
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage('Failed to update product');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage('Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditFormData({
      name: '',
      category: '',
      menu_category: '',
      sub_category: '',
      price: '',
      description: '',
      is_best: false,
      is_new: false,
    });
    setMainImageFile(null);
    setGalleryFiles([]);

    if (mainImagePreviewUrl && mainImagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mainImagePreviewUrl);
    }
    setMainImagePreviewUrl('');

    galleryPreviewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setGalleryPreviewUrls([]);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    return category ? category.name : categorySlug;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete product management - Search, edit, and delete products
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{message}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No products found matching your search' : 'No products yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{product.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">₩{product.price.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{getCategoryName(product.category)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {product.is_best && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            BEST
                          </span>
                        )}
                        {product.is_new && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Product</h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Legacy field - Consider using Menu Category and Sub Category instead
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Menu Category</label>
                  <select
                    value={editFormData.menu_category}
                    onChange={(e) => setEditFormData({ ...editFormData, menu_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select menu category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for Header menu filtering
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                  <input
                    type="text"
                    value={editFormData.sub_category}
                    onChange={(e) => setEditFormData({ ...editFormData, sub_category: e.target.value })}
                    placeholder="e.g., Pendant, Ring, Bracelet"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Displayed on product card
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₩) *</label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="hidden"
                  id="edit-main-image"
                />
                <label
                  htmlFor="edit-main-image"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload size={18} />
                  {mainImagePreviewUrl ? 'Change Main Image' : 'Upload Main Image'}
                </label>
                {mainImagePreviewUrl && (
                  <div className="mt-3">
                    <img
                      src={mainImagePreviewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                  className="hidden"
                  id="edit-gallery-images"
                />
                <label
                  htmlFor="edit-gallery-images"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <ImageIcon size={18} />
                  {galleryPreviewUrls.length > 0 ? 'Change Gallery Images' : 'Upload Gallery Images'}
                </label>
                {galleryPreviewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {galleryPreviewUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {galleryFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_best}
                    onChange={(e) => setEditFormData({ ...editFormData, is_best: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_new}
                    onChange={(e) => setEditFormData({ ...editFormData, is_new: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">New Arrival</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProduct}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {uploading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
