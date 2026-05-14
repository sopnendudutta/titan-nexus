import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';


export default function Dashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const navigate = useNavigate();

    // Toast Notification State
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    // Search, Sort & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Kebab Dropdown State
    const [openDropdown, setOpenDropdown] = useState(null);

    // Close dropdown when clicking outside of it
    useEffect(() => {
        const closeDropdown = () => setOpenDropdown(null);
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, []);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);


    // Form States
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        sku: '', name: '', description: '', price: '', quantity: '', category_id: '', reorder_level: ''
    });

    useEffect(() => { fetchProducts(); }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const fetchProducts = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTimeout(() => {
                setProducts(res.data.data);
                setLoading(false);
            }, 1000);
        } catch (err) { navigate('/login'); }
    };

    // Calculate Vault Metrics (Command Center)
    const vaultMetrics = useMemo(() => {
        let totalValue = 0;
        let lowStockCount = 0;

        products.forEach(p => {
            totalValue += (p.price * p.quantity);
            if (p.quantity <= p.reorder_level) lowStockCount++;
        });

        return {
            totalItems: products.length,
            totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            lowStockCount
        };
    }, [products]);

    // Prepare Data for the Graph (Top 5 Highest Stock Items)
    const chartData = useMemo(() => {
        return [...products]
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
            .map(p => ({
                name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
                Stock: p.quantity
            }));
    }, [products]);

    // Helper to trigger toasts
    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
    };

    // LIVE SEARCH & SORT LOGIC
    const filteredProducts = useMemo(() => {
        let processedData = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key) {
            processedData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return processedData;
    }, [products, searchTerm, sortConfig]);

    // Pagination Math
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            sku: newProduct.sku,
            name: newProduct.name,
            description: newProduct.description,
            price: parseFloat(newProduct.price),
            quantity: parseInt(newProduct.quantity, 10),
            category_id: parseInt(newProduct.category_id, 10),
            reorder_level: parseInt(newProduct.reorder_level, 10)
        };

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Item successfully registered to vault", "success");
            setIsAddModalOpen(false);
            setNewProduct({ sku: '', name: '', description: '', price: '', quantity: '', category_id: '', reorder_level: '' });
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.message || "Validation Error: Could not add item", "error");
        }
    };

    const updateStock = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.sku}`,
                { newQuantity: parseInt(editingProduct.quantity, 10) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEditModalOpen(false);
            showToast(`Stock for ${editingProduct.sku} updated successfully`, "success");
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update stock", "error");
        }
    };

    //   Opens the custom confirmation modal
    const initiateDelete = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    //  Executes the actual deletion after confirmation
    const confirmDelete = async () => {
        if (!productToDelete) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${productToDelete.sku}`, { // ✅ FIXED
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast(`Item ${productToDelete.sku} purged from the system`, "success");
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.message || "Admin clearance required to delete items", "error");
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className={`dashboard-wrapper ${isDarkMode ? '' : 'light-theme'}`}>
            <div className="container">

                {/* 1. HEADER ROW */}
                <div className="header">
                    <div>
                        <h1>Inventory</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Titan Nexus System</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>Add Item</button>
                        <button className="btn" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '☀️' : '🌙'}</button>
                        <button className="morph-btn" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
                            <span className="icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </span>
                            <span className="text">Log Out</span>
                        </button>
                    </div>
                </div>

                {/* 2. SEARCH ROW */}
                <div className="search-row">
                    <div className="search-container" style={{ margin: 0, width: '100%' }}>
                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search vault by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* 3. COMMAND CENTER & WIDE GRAPH */}
                {!loading && products.length > 0 && (
                    <div className="command-center-stack">
                        <div className="metrics-row">
                            <div className="metric-card">
                                <span className="metric-title">Total Vault Value</span>
                                <h2 className="metric-value" style={{ color: 'var(--accent-copper)' }}>{vaultMetrics.totalValue}</h2>
                            </div>
                            <div className="metric-card">
                                <span className="metric-title">Unique SKUs</span>
                                <h2 className="metric-value">{vaultMetrics.totalItems}</h2>
                            </div>
                            <div className="metric-card">
                                <span className="metric-title">Critical Alerts</span>
                                <h2 className="metric-value" style={{ color: vaultMetrics.lowStockCount > 0 ? '#ef4444' : '#10b981' }}>
                                    {vaultMetrics.lowStockCount} Items
                                </h2>
                            </div>
                        </div>

                        <div className="chart-container-wide">
                            <div className="chart-header">
                                <h3>Asset Volume Analysis</h3>
                            </div>
                            <div style={{ height: '140px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(192, 114, 61, 0.05)' }}
                                            contentStyle={{ backgroundColor: 'var(--form-bg)', border: '1px solid var(--border-dark)', borderRadius: '4px', fontSize: '11px' }}
                                        />
                                        <Bar dataKey="Stock" fill="var(--accent-copper)" radius={[2, 2, 0, 0]} barSize={45} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. INVENTORY TABLE */}
                {loading ? (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th className="sortable-th" onClick={() => handleSort('sku')}>SKU</th>
                                    <th className="sortable-th" onClick={() => handleSort('name')}>NAME</th>
                                    <th className="sortable-th" onClick={() => handleSort('quantity')}>STOCK</th>
                                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(5)].map((_, index) => (
                                    <tr key={index} className="skeleton-row">
                                        <td><div className="skeleton-block" style={{ width: '60px' }}></div></td>
                                        <td><div className="skeleton-block" style={{ width: '180px' }}></div></td>
                                        <td><div className="skeleton-block" style={{ width: '40px' }}></div></td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <div className="skeleton-block" style={{ width: '40px' }}></div>
                                                <div className="skeleton-block" style={{ width: '50px' }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th className="sortable-th" onClick={() => handleSort('sku')}>
                                        SKU {sortConfig.key === 'sku' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                    </th>
                                    <th className="sortable-th" onClick={() => handleSort('name')}>
                                        NAME {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                    </th>
                                    <th className="sortable-th" onClick={() => handleSort('quantity')}>
                                        STOCK {sortConfig.key === 'quantity' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                    </th>
                                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map(p => (
                                    <tr key={p.sku} className="tr-hover">
                                        <td className="sku-text">{p.sku}</td>
                                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                                        <td style={{ color: p.quantity <= p.reorder_level ? '#ef4444' : 'inherit', fontWeight: p.quantity <= p.reorder_level ? '700' : '400' }}>
                                            {p.quantity} {p.quantity <= p.reorder_level && "⚠️"}
                                        </td>

                                        <td style={{ textAlign: 'right', position: 'relative' }}>
                                            <button
                                                className="kebab-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdown(openDropdown === p.sku ? null : p.sku);
                                                }}
                                            >
                                                ⋮
                                            </button>

                                            {openDropdown === p.sku && (
                                                <div className="action-dropdown" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => {
                                                        setEditingProduct(p);
                                                        setIsEditModalOpen(true);
                                                        setOpenDropdown(null);
                                                    }}>
                                                        Adjust Stock
                                                    </button>
                                                    <button className="danger-action" onClick={() => {
                                                        initiateDelete(p); // 🚨 Now passes the whole product object to our custom modal
                                                        setOpenDropdown(null);
                                                    }}>
                                                        Delete Item
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: 0, border: 'none' }}>
                                            <div className="empty-state-container">
                                                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8"></circle>
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                    <path d="M11 8v6"></path>
                                                    <path d="M8 11h6"></path>
                                                </svg>
                                                <h3 className="empty-state-title">
                                                    {searchTerm ? "No Matches Found" : "The Vault is Empty"}
                                                </h3>
                                                <p className="empty-state-desc">
                                                    {searchTerm
                                                        ? `We couldn't find any items matching "${searchTerm}". Try adjusting your search criteria.`
                                                        : "There are currently no items registered in the Titan Nexus system."}
                                                </p>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setIsAddModalOpen(true);
                                                    }}
                                                >
                                                    + Register New Item
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* PAGINATION CONTROLS */}
                        {filteredProducts.length > itemsPerPage && (
                            <div className="pagination-container">
                                <span className="pagination-info">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} items
                                </span>
                                <div className="pagination-buttons">
                                    <button
                                        className="btn-page"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Prev
                                    </button>
                                    <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                                    <button
                                        className="btn-page"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MODALS */}
                {isAddModalOpen && (
                    <div className="overlay">
                        <div className="modal">
                            <h3>Register New Item</h3>
                            <form onSubmit={handleAddProduct}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input className="input" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} required />
                                    <input className="input" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                </div>
                                <input className="input" placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input className="input" type="number" step="0.01" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                    <input className="input" type="number" placeholder="Quantity" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} required />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input className="input" type="number" placeholder="Cat ID" value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })} required />
                                    <input className="input" type="number" placeholder="Reorder Level" value={newProduct.reorder_level} onChange={e => setNewProduct({ ...newProduct, reorder_level: e.target.value })} required />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isEditModalOpen && (
                    <div className="overlay">
                        <div className="modal">
                            <h3>Adjust Stock</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>{editingProduct.name}</p>
                            <form onSubmit={updateStock}>
                                <input className="input" type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({ ...editingProduct, quantity: e.target.value })} required min="0" />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/*  MINIMAL CONFIRM DELETE MODAL */}
                {isDeleteModalOpen && productToDelete && (
                    <div className="overlay">
                        <div className="modal">
                            <h3 style={{ color: '#ef4444', marginTop: 0, fontWeight: 500 }}>Confirm Delete</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
                                Are you sure you want to permanently remove <strong style={{ color: 'var(--bg-light)' }}>{productToDelete.name}</strong> from the vault? This action cannot be reversed.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-dark)' }}
                                    onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
                                >
                                    Cancel
                                </button>

                                {/* 🚨 THE NEW MINIMAL BUTTON */}
                                <button
                                    type="button"
                                    className="btn-danger-minimal"
                                    style={{ flex: 1 }}
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* THE TOAST UI */}
                {toast.show && (
                    <div className="toast-container">
                        <div className={`toast ${toast.type}`}>
                            <div className="toast-content">
                                <span>{toast.type === 'success' ? '✅' : '🚨'}</span>
                                <span className="toast-message">{toast.message}</span>
                            </div>
                            <button className="toast-close" onClick={() => setToast({ ...toast, show: false })}>✕</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}