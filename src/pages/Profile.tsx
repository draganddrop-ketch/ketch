import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Header';
import { User, Calendar, Package, Settings, Edit2, X, ChevronDown, ChevronUp, Trash2, ShoppingCart, CreditCard, Share2, ZoomIn } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_date: string;
  status: string;
  total_price: number;
  custom_image_url: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface SavedDesign {
  id: string;
  design_name: string;
  snapshot_image: string;
  created_at: string;
  design_data: any;
  total_price?: number;
}

type TabType = 'ORDER_HISTORY' | 'SAVED_DESIGNS' | 'SETTINGS';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('SAVED_DESIGNS');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfileAndOrders();
  }, [user, navigate]);

  const fetchProfileAndOrders = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      const { data: designsData } = await supabase
        .from('saved_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProfile({
        id: user.id,
        email: user.email || '',
        full_name: profileData?.full_name || null,
        created_at: user.created_at || new Date().toISOString(),
      });

      setOrders(ordersData || []);
      setSavedDesigns(designsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !editName.trim()) return;

    try {
      await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', user.id);

      setProfile(prev => prev ? { ...prev, full_name: editName.trim() } : null);
      setShowEditModal(false);
      setEditName('');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'SHIPPED':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'DELIVERED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const { error } = await supabase
        .from('saved_designs')
        .delete()
        .eq('id', designId);

      if (error) throw error;

      setSavedDesigns(prev => prev.filter(d => d.id !== designId));
      if (selectedDesign?.id === designId) {
        setShowDetailModal(false);
        setSelectedDesign(null);
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Failed to delete design. Please try again.');
    }
  };

  const calculateTotalPrice = (design: SavedDesign): number => {
    if (design.total_price) return design.total_price;
    if (design.design_data?.items) {
      return design.design_data.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    }
    return 0;
  };

  const handleAddToCart = (design: SavedDesign) => {
    if (design.design_data?.items && design.design_data.items.length > 0) {
      const totalPrice = calculateTotalPrice(design);
      addToCart({
        id: 'saved-design-' + design.id + '-' + Date.now(),
        name: design.design_name,
        price: totalPrice,
        image: design.snapshot_image,
        items: design.design_data.items,
      });
      alert('Added to cart!');
    } else {
      alert('This design has no items to add.');
    }
  };

  const handleOrder = (design: SavedDesign) => {
    handleAddToCart(design);
    navigate('/cart');
  };

  const handleShare = (design: SavedDesign) => {
    const shareUrl = `${window.location.origin}/design/${design.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link.');
    });
  };

  const openDetailModal = (design: SavedDesign) => {
    setSelectedDesign(design);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-green-400 tracking-wider">MY DASHBOARD</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border-2 border-gray-700 hover:border-green-400 transition-all duration-300 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-400 tracking-wider">ID CARD</h2>
                <User className="w-6 h-6 text-green-400" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Full Name</label>
                  <p className="text-lg font-semibold text-white mt-1">
                    {profile?.full_name || 'Anonymous User'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                  <p className="text-sm text-gray-300 mt-1 break-all">{profile?.email}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Join Date
                  </label>
                  <p className="text-sm text-gray-300 mt-1">
                    {formatDate(profile?.created_at || '')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditName(profile?.full_name || '');
                  setShowEditModal(true);
                }}
                className="w-full mt-6 bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                EDIT PROFILE
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
              <div className="flex border-b-2 border-gray-700">
                {(['ORDER_HISTORY', 'SAVED_DESIGNS', 'SETTINGS'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 font-bold text-sm tracking-wider transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-green-400 text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
                    }`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'ORDER_HISTORY' && (
                  <div className="space-y-6">
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No Orders Yet</h3>
                        <p className="text-gray-500 mb-6">Start creating your custom designs</p>
                        <button
                          onClick={() => navigate('/')}
                          className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                        >
                          START CREATING
                        </button>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-black border border-gray-700 hover:border-green-400 transition-all duration-300 rounded-lg overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row gap-4 p-4">
                            <div className="w-full sm:w-48 h-48 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                              {order.custom_image_url ? (
                                <img
                                  src={order.custom_image_url}
                                  alt="Order snapshot"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <Package className="w-12 h-12" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Order Date</p>
                                    <p className="text-lg font-bold text-white">{formatDate(order.order_date)}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </div>

                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Price</p>
                                  <p className="text-2xl font-bold text-green-400">
                                    ₩{order.total_price.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                              >
                                {expandedOrder === order.id ? (
                                  <>
                                    HIDE DETAILS <ChevronUp className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    VIEW DETAILS <ChevronDown className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {expandedOrder === order.id && (
                            <div className="border-t border-gray-700 p-4 bg-gray-900">
                              <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Order Items</h4>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-300">
                                      {item.name} <span className="text-gray-500">x{item.quantity}</span>
                                    </span>
                                    <span className="text-green-400 font-semibold">
                                      ₩{(item.price * item.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'SAVED_DESIGNS' && (
                  <div>
                    {savedDesigns.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No Saved Designs Yet</h3>
                        <p className="text-gray-500 mb-6">Create and save your custom designs from the builder</p>
                        <button
                          onClick={() => navigate('/')}
                          className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded-lg transition-colors duration-200"
                        >
                          START CREATING
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {savedDesigns.map((design) => {
                          const totalPrice = calculateTotalPrice(design);
                          return (
                            <div
                              key={design.id}
                              className="bg-black border border-gray-700 hover:border-green-400 transition-all duration-300 rounded-lg overflow-hidden group"
                            >
                              <div
                                className="aspect-square bg-gray-800 overflow-hidden relative cursor-pointer"
                                onClick={() => openDetailModal(design)}
                              >
                                {design.snapshot_image ? (
                                  <>
                                    <img
                                      src={design.snapshot_image}
                                      alt={design.design_name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                      <ZoomIn className="w-12 h-12 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <Package className="w-12 h-12" />
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <div className="mb-4">
                                  <p className="text-2xl font-bold text-green-400 mb-1">
                                    ₩{totalPrice.toLocaleString()}
                                  </p>
                                  <h4 className="text-white font-semibold text-sm truncate">{design.design_name}</h4>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(design.created_at)}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleAddToCart(design)}
                                    className="bg-green-600 hover:bg-green-500 text-black font-bold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 text-xs"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    CART
                                  </button>
                                  <button
                                    onClick={() => handleOrder(design)}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 text-xs"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    ORDER
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShare(design);
                                    }}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 text-xs border border-gray-600"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    SHARE
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDesign(design.id);
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 text-xs"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    DELETE
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'SETTINGS' && (
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Settings panel coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-green-400 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-green-400 tracking-wider">EDIT PROFILE</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black border border-gray-700 focus:border-green-400 rounded-lg px-4 py-3 text-white outline-none transition-colors"
                placeholder="Enter your name"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                CANCEL
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedDesign && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-gray-900 border-2 border-green-400 rounded-lg overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-2xl font-bold text-green-400 tracking-wider">DESIGN DETAILS</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                  {selectedDesign.snapshot_image ? (
                    <img
                      src={selectedDesign.snapshot_image}
                      alt={selectedDesign.design_name}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-gray-600 h-64">
                      <Package className="w-16 h-16" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="mb-6">
                    <h4 className="text-3xl font-bold text-white mb-2">{selectedDesign.design_name}</h4>
                    <p className="text-sm text-gray-500 mb-4">Saved on {formatDate(selectedDesign.created_at)}</p>
                    <p className="text-4xl font-bold text-green-400">
                      ₩{calculateTotalPrice(selectedDesign).toLocaleString()}
                    </p>
                  </div>

                  <div className="mb-6 flex-1">
                    <h5 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Components</h5>
                    {selectedDesign.design_data?.items && selectedDesign.design_data.items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDesign.design_data.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-black border border-gray-700 rounded-lg p-3 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded bg-gray-800"
                                />
                              )}
                              <span className="text-white font-semibold">{item.name}</span>
                            </div>
                            <span className="text-green-400 font-bold">₩{(item.price || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No items found</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        handleAddToCart(selectedDesign);
                      }}
                      className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      ADD TO CART
                    </button>
                    <button
                      onClick={() => {
                        handleOrder(selectedDesign);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      ORDER NOW
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
