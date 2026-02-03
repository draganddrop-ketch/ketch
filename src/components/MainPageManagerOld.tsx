import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MainPageSection {
  id: string;
  type: 'BANNER' | 'PRODUCT_LIST';
  title: string;
  image_url: string | null;
  image_urls: string[];
  filter_type: 'NEW' | 'BEST' | 'ALL' | null;
  target_category_slug: string | null;
  order_index: number;
  show_title?: boolean;
  title_position?: 'center' | 'bottom-left' | 'bottom-right';
  dark_overlay?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  is_hidden: boolean;
}

export const MainPageManager = () => {
  const [sections, setSections] = useState<MainPageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    type: 'BANNER' as 'BANNER' | 'PRODUCT_LIST',
    title: '',
    filter_type: 'ALL' as 'NEW' | 'BEST' | 'ALL',
    target_category_slug: '',
    show_title: true,
    title_position: 'center' as 'center' | 'bottom-left' | 'bottom-right',
    dark_overlay: true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchSections();
    fetchCategories();
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('main_page_sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Fetch sections error:', error);
        throw error;
      }

      console.log('Fetched sections:', data);
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setMessage('Failed to load sections');
    } finally {
      setLoading(false);
    }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(filesArray);

      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      const previewUrls = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(previewUrls);
    }
  };

  const removeImagePreview = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddSection = async () => {
    if (!formData.title.trim()) {
      setMessage('Title is required');
      return;
    }

    if (formData.type === 'BANNER' && imageFiles.length === 0) {
      setMessage('At least one banner image is required');
      return;
    }

    try {
      setUploadingImage(true);
      let uploadedImageUrls: string[] = [];

      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const url = await uploadImage(file);
          if (url) {
            uploadedImageUrls.push(url);
          }
        }

        if (uploadedImageUrls.length === 0) {
          setMessage('Image upload failed');
          setUploadingImage(false);
          return;
        }
      }

      const newOrderIndex = sections.length > 0
        ? Math.max(...sections.map(s => s.order_index)) + 1
        : 0;

      const insertPayload: Record<string, any> = {
        type: formData.type,
        title: formData.title.trim(),
        order_index: newOrderIndex,
      };

      if (formData.type === 'BANNER') {
        insertPayload.image_urls = uploadedImageUrls;
        insertPayload.image_url = uploadedImageUrls[0];
        insertPayload.filter_type = null;
        insertPayload.target_category_slug = null;
        insertPayload.show_title = formData.show_title;
        insertPayload.title_position = formData.title_position;
        insertPayload.dark_overlay = formData.dark_overlay;
      }

      if (formData.type === 'PRODUCT_LIST') {
        insertPayload.image_urls = [];
        insertPayload.image_url = null;
        insertPayload.filter_type = formData.filter_type;
        insertPayload.target_category_slug = formData.target_category_slug.trim() || null;
      }

      const { error } = await supabase
        .from('main_page_sections')
        .insert(insertPayload);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      setMessage('Section added successfully');
      setShowAddModal(false);
      setEditingId(null);
      resetForm();
      await fetchSections();
    } catch (error: any) {
      console.error('Error adding section:', error);
      setMessage(`Failed to add section: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;

    if (!formData.title.trim()) {
      setMessage('Title is required');
      return;
    }

    try {
      setUploadingImage(true);
      let updatedImageUrls = section.image_urls || [];

      if (imageFiles.length > 0) {
        const newUrls: string[] = [];
        for (const file of imageFiles) {
          const url = await uploadImage(file);
          if (url) {
            newUrls.push(url);
          }
        }

        if (newUrls.length === 0) {
          setMessage('Image upload failed');
          setUploadingImage(false);
          return;
        }

        updatedImageUrls = newUrls;
      }

      const updatePayload: Record<string, any> = {
        title: formData.title.trim(),
      };

      if (section.type === 'BANNER') {
        updatePayload.image_urls = updatedImageUrls;
        updatePayload.image_url = updatedImageUrls.length > 0 ? updatedImageUrls[0] : null;
        updatePayload.show_title = formData.show_title;
        updatePayload.title_position = formData.title_position;
        updatePayload.dark_overlay = formData.dark_overlay;
      }

      if (section.type === 'PRODUCT_LIST') {
        updatePayload.filter_type = formData.filter_type;
        updatePayload.target_category_slug = formData.target_category_slug.trim() || null;
      }

      const { error } = await supabase
        .from('main_page_sections')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      setMessage('Section updated successfully');
      setEditingId(null);
      resetForm();
      await fetchSections();
    } catch (error: any) {
      console.error('Error updating section:', error);
      setMessage(`Failed to update section: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('main_page_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('Section deleted');
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      setMessage('Failed to delete section');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const current = sections[index];
    const target = sections[direction === 'up' ? index - 1 : index + 1];

    try {
      await supabase
        .from('main_page_sections')
        .update({ order_index: target.order_index })
        .eq('id', current.id);

      await supabase
        .from('main_page_sections')
        .update({ order_index: current.order_index })
        .eq('id', target.id);

      fetchSections();
    } catch (error) {
      console.error('Error reordering sections:', error);
      setMessage('Failed to reorder sections');
    }
  };

  const startEdit = (section: MainPageSection) => {
    setShowAddModal(false);
    setEditingId(section.id);
    setFormData({
      type: section.type,
      title: section.title,
      filter_type: section.filter_type || 'ALL',
      target_category_slug: section.target_category_slug || '',
      show_title: section.show_title ?? true,
      title_position: section.title_position || 'center',
      dark_overlay: section.dark_overlay ?? true,
    });

    if (section.type === 'BANNER' && section.image_urls && section.image_urls.length > 0) {
      setImagePreviewUrls(section.image_urls);
    } else if (section.image_url) {
      setImagePreviewUrls([section.image_url]);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'BANNER',
      title: '',
      filter_type: 'ALL',
      target_category_slug: '',
      show_title: true,
      title_position: 'center',
      dark_overlay: true,
    });
    setImageFiles([]);
    imagePreviewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setImagePreviewUrls([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Main Page Sections</h3>
          <p className="text-sm text-gray-500 mt-1">
            Build your homepage with banners and product lists
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Section
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{message}</p>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No sections yet. Add your first section to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingId === section.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {section.type === 'PRODUCT_LIST' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Category (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Link this section to a specific category. Leave empty to use filter type instead.
                        </p>
                        <select
                          value={formData.target_category_slug}
                          onChange={(e) => setFormData({ ...formData, target_category_slug: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">No category (use filter type)</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                              {cat.name} {cat.is_hidden ? '(Hidden)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filter Type {formData.target_category_slug && '(Ignored when category is set)'}
                        </label>
                        <select
                          value={formData.filter_type}
                          onChange={(e) => setFormData({ ...formData, filter_type: e.target.value as 'NEW' | 'BEST' | 'ALL' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          disabled={!!formData.target_category_slug}
                        >
                          <option value="ALL">ALL - Show all products</option>
                          <option value="BEST">BEST - Show best sellers</option>
                          <option value="NEW">NEW - Show new arrivals</option>
                        </select>
                      </div>
                    </>
                  )}

                  {section.type === 'BANNER' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Banner Images {imagePreviewUrls.length > 0 && `(${imagePreviewUrls.length} current)`}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Upload multiple images to create a slider carousel
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          id={`edit-image-${section.id}`}
                        />
                        <label
                          htmlFor={`edit-image-${section.id}`}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                        >
                          <Upload size={18} />
                          {imagePreviewUrls.length > 0 ? 'Change Images' : 'Upload Images'}
                        </label>
                        {imagePreviewUrls.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {imagePreviewUrls.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={url}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                {imageFiles.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeImagePreview(idx)}
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

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={formData.show_title}
                            onChange={(e) => setFormData({ ...formData, show_title: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          Show Title
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">Display title overlay on banner</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title Position</label>
                        <select
                          value={formData.title_position}
                          onChange={(e) => setFormData({ ...formData, title_position: e.target.value as 'center' | 'bottom-left' | 'bottom-right' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="center">Center</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={formData.dark_overlay}
                            onChange={(e) => setFormData({ ...formData, dark_overlay: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          Dark Overlay
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">Add dark semi-transparent overlay to improve text visibility</p>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateSection(section.id)}
                      disabled={uploadingImage}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {uploadingImage ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      className={`p-1 rounded transition-colors ${
                        index === sections.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {section.type === 'BANNER' && section.image_urls && section.image_urls.length > 0 && (
                    <div className="flex gap-1">
                      {section.image_urls.slice(0, 3).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`${section.title} ${idx + 1}`}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ))}
                      {section.image_urls.length > 3 && (
                        <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                          +{section.image_urls.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        section.type === 'BANNER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {section.type}
                      </span>
                      <h4 className="font-semibold text-gray-800">{section.title}</h4>
                    </div>
                    {section.type === 'PRODUCT_LIST' && (
                      <p className="text-sm text-gray-500 mt-1">
                        {section.target_category_slug ? (
                          <>Category: {categories.find(c => c.slug === section.target_category_slug)?.name || section.target_category_slug}</>
                        ) : (
                          <>Filter: {section.filter_type || 'ALL'}</>
                        )}
                      </p>
                    )}
                    {section.type === 'BANNER' && section.image_urls && section.image_urls.length > 1 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Slider with {section.image_urls.length} images
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(section)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add New Section</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BANNER' | 'PRODUCT_LIST' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="BANNER">Banner - Hero slider with images</option>
                  <option value="PRODUCT_LIST">Product List - Filtered products</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={formData.type === 'BANNER' ? 'e.g., Welcome to KETCH' : 'e.g., Best Sellers'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {formData.type === 'BANNER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Banner Images *</label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload multiple images to create an auto-play slider
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="add-image-input"
                    />
                    <label
                      htmlFor="add-image-input"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <ImageIcon size={18} />
                      Upload Banner Images
                    </label>
                    {imagePreviewUrls.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">
                          {imagePreviewUrls.length} image(s) selected
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {imagePreviewUrls.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImagePreview(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.show_title}
                        onChange={(e) => setFormData({ ...formData, show_title: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      Show Title
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">Display title overlay on banner</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title Position</label>
                    <select
                      value={formData.title_position}
                      onChange={(e) => setFormData({ ...formData, title_position: e.target.value as 'center' | 'bottom-left' | 'bottom-right' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="center">Center</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.dark_overlay}
                        onChange={(e) => setFormData({ ...formData, dark_overlay: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      Dark Overlay
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">Add dark semi-transparent overlay to improve text visibility</p>
                  </div>
                </>
              )}

              {formData.type === 'PRODUCT_LIST' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Category (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Select a specific category to display. This works with both visible and hidden categories.
                    </p>
                    <select
                      value={formData.target_category_slug}
                      onChange={(e) => setFormData({ ...formData, target_category_slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">No category (use filter type)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name} {cat.is_hidden ? '(Hidden)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Type {formData.target_category_slug && '(Ignored when category is set)'}
                    </label>
                    <select
                      value={formData.filter_type}
                      onChange={(e) => setFormData({ ...formData, filter_type: e.target.value as 'NEW' | 'BEST' | 'ALL' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={!!formData.target_category_slug}
                    >
                      <option value="ALL">ALL - Show all products</option>
                      <option value="BEST">BEST - Show best sellers only</option>
                      <option value="NEW">NEW - Show new arrivals only</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddSection}
                  disabled={uploadingImage}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {uploadingImage ? 'Adding...' : 'Add Section'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
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
