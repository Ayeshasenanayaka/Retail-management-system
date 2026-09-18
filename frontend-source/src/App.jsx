import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  ListFilter,
  LogOut,
  PackagePlus,
  Printer,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tags,
  Trash2,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { apiFetch, clearSession, saveSession, getSession } from "./api";

const money = value => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(value || 0));
const dateTime = value => value ? new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "";
const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80";
const emptyProduct = { categoryId: "", productName: "", description: "", price: "", stockQuantity: "", barcode: "", imageUrl: "", status: true };
const emptyCategory = { categoryName: "", description: "", status: true };
const emptyCustomer = { name: "", phone: "", email: "", address: "" };

function menuFor(user) {
  if (user?.role === "ADMIN") {
    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "pos", label: "POS Billing", icon: ShoppingCart },
      { id: "products", label: "Products", icon: Boxes },
      { id: "categories", label: "Categories", icon: Tags },
      { id: "customers", label: "Customers", icon: UsersRound },
      { id: "orders", label: "Orders", icon: ReceiptText }
    ];
  }
  return [
    { id: "pos", label: "POS Billing", icon: ShoppingCart },
    { id: "customers", label: "Customers", icon: UsersRound },
    { id: "orders", label: "My Invoices", icon: ReceiptText }
  ];
}

function defaultPage(user) {
  return user?.role === "ADMIN" ? "dashboard" : "pos";
}

function isValidSession(value) {
  return Boolean(value?.token && value?.user && value.user.role);
}

function readStoredPage() {
  return localStorage.getItem("retailActivePage") || "";
}

function saveStoredPage(page) {
  localStorage.setItem("retailActivePage", page);
}

function clearStoredPage() {
  localStorage.removeItem("retailActivePage");
}

function pageFromPath() {
  const currentPath = window.location.pathname.replace(/^\//, "").trim();
  return currentPath && currentPath !== "login" ? currentPath : "";
}

function getSafePage(user, pages) {
  const requestedPage = sessionStorage.getItem("retailNextPage") || pageFromPath() || readStoredPage() || defaultPage(user);
  sessionStorage.removeItem("retailNextPage");
  return pages.some(item => item.id === requestedPage) ? requestedPage : (pages[0]?.id || defaultPage(user));
}

function goToPageWithRefresh(nextPage) {
  saveStoredPage(nextPage);
  sessionStorage.setItem("retailNextPage", nextPage);
  Object.keys(sessionStorage).filter(key => key.startsWith("retail-auto-reloaded-")).forEach(key => sessionStorage.removeItem(key));
  window.location.assign(`/${nextPage}`);
}

function App() {
  const [session, setSession] = useState(() => {
    const saved = getSession();
    if (isValidSession(saved)) return saved;
    clearSession();
    clearStoredPage();
    return null;
  });
  const user = session?.user || null;
  const pages = useMemo(() => menuFor(user), [user?.role]);
  const [page, setPageState] = useState(() => readStoredPage());

  function changePage(nextPage) {
    if (!nextPage || nextPage === page) return;
    setPageState(nextPage);
    goToPageWithRefresh(nextPage);
  }

  function logout() {
    clearSession();
    clearStoredPage();
    setSession(null);
    setPageState("");
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }

  useEffect(() => {
    function expireSession() {
      logout();
    }
    window.addEventListener("retail-session-expired", expireSession);
    return () => window.removeEventListener("retail-session-expired", expireSession);
  }, []);

  useEffect(() => {
    if (!session) return;
    const safePage = getSafePage(user, pages);
    if (safePage !== page) {
      setPageState(safePage);
      saveStoredPage(safePage);
      if (window.location.pathname !== `/${safePage}`) {
        window.history.replaceState(null, "", `/${safePage}`);
      }
      return;
    }
    if (window.location.pathname !== `/${safePage}`) {
      window.history.replaceState(null, "", `/${safePage}`);
    }
  }, [session, pages, page, user]);

  if (!session) {
    return <Login onLogin={value => {
      if (!isValidSession(value)) return;
      saveSession(value);
      const firstPage = defaultPage(value.user);
      saveStoredPage(firstPage);
      sessionStorage.setItem("retailNextPage", firstPage);
      window.location.replace(`/${firstPage}`);
    }} />;
  }

  const activePage = pages.some(p => p.id === page) ? page : (pages[0]?.id || defaultPage(user));
  const Page = {
    dashboard: Dashboard,
    pos: POS,
    products: Products,
    categories: Categories,
    customers: Customers,
    orders: Orders
  }[activePage] || POS;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Store size={24} /></div>
          <div>
            <strong>Retail Pro</strong>
            <span>POS System</span>
          </div>
        </div>
        <nav className="nav-list">
          {pages.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={activePage === item.id ? "nav-item active" : "nav-item"} onClick={() => changePage(item.id)}><Icon size={18} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="user-card">
          <div className="avatar"><UserRound size={18} /></div>
          <div className="grow">
            <strong>{user?.fullName || user?.username || "System User"}</strong>
            <span>{user?.role === "ADMIN" ? "Administrator Access" : "Cashier Access"}</span>
          </div>
          <button className="icon-btn" onClick={logout}><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <p>Retail Management System</p>
            <h1>{pages.find(p => p.id === activePage)?.label || "POS Billing"}</h1>
          </div>
          <div className="secure-badge"><ShieldCheck size={18} /> {user?.role === "ADMIN" ? "Admin Secure Area" : "Cashier POS Area"}</div>
        </header>
        <PageErrorBoundary key={activePage} pageName={activePage} onLoginAgain={logout}>
          <Page user={user} />
        </PageErrorBoundary>
      </main>
    </div>
  );
}

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reloading: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    const key = `retail-auto-reloaded-${this.props.pageName}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      sessionStorage.setItem("retailNextPage", this.props.pageName);
      saveStoredPage(this.props.pageName);
      this.setState({ reloading: true });
      setTimeout(() => window.location.replace(`/${this.props.pageName}`), 250);
    }
  }
  render() {
    if (this.state.hasError) {
      if (this.state.reloading) {
        return <div className="panel wide"><div className="loader">Refreshing this page automatically...</div></div>;
      }
      return <div className="panel wide"><div className="alert error"><strong>This page could not load correctly.</strong><br />The system already tried one automatic refresh. Please login again or refresh the browser.</div><div className="toolbar"><button className="soft-btn" onClick={() => window.location.reload()}>Refresh Page</button><button className="primary-btn compact" onClick={this.props.onLoginAgain}>Login Again</button></div></div>;
    }
    return this.props.children;
  }
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(form) });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-screen">
      <div className="login-overlay">
        <div className="login-copy">
          <div className="brand-pill"><Store size={18} /> Sri Lanka Retail POS</div>
          <h1>Premium billing, inventory and sales control for modern retail shops.</h1>
          <p>Fast checkout, role access, customer records, invoice history and real-time stock alerts in one responsive system.</p>
        </div>
        <form className="login-card" onSubmit={submit}>
          <div className="card-head">
            <div className="brand-icon"><Store size={24} /></div>
            <div>
              <h2>Sign in</h2>
              <span>Admin: admin/admin123 · Cashier: cashier/cashier123</span>
            </div>
          </div>
          {error && <div className="alert error">{error}</div>}
          <label>Username<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
          <label>Password<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button className="primary-btn" disabled={loading}>{loading ? "Signing in..." : "Login to System"}<ChevronRight size={18} /></button>
        </form>
      </div>
    </section>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/dashboard/summary").then(data => setSummary(data || {})).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!summary) return <Loader />;

  const stats = [
    { label: "Total Sales", value: money(summary.totalSales), icon: CircleDollarSign },
    { label: "Today Sales", value: money(summary.todaySales), icon: CreditCard },
    { label: "Total Orders", value: summary.totalOrders, icon: ReceiptText },
    { label: "Products", value: summary.productCount, icon: Boxes }
  ];
  const chartItems = Object.entries(summary.lastSevenDaysSales || {});
  const max = Math.max(...chartItems.map(([, v]) => Number(v || 0)), 1);

  return (
    <div className="page-grid">
      <div className="stats-grid">
        {stats.map(stat => {
          const Icon = stat.icon;
          return <div className="stat-card" key={stat.label}><Icon size={22} /><span>{stat.label}</span><strong>{stat.value}</strong></div>;
        })}
      </div>
      <div className="panel wide">
        <PanelTitle icon={BarChart3} title="Last 7 Days Sales" />
        <div className="bar-chart">
          {chartItems.map(([day, amount]) => <div className="bar-row" key={day}><span>{day.slice(5)}</span><div><i style={{ width: `${(Number(amount || 0) / max) * 100}%` }} /></div><b>{money(amount)}</b></div>)}
        </div>
      </div>
      <div className="panel">
        <PanelTitle icon={ListFilter} title="Low Stock Alerts" />
        <div className="stack-list">
          {summary.lowStockProducts?.length ? summary.lowStockProducts.map(p => <div className="mini-row" key={p.productId}><span>{p.productName}</span><strong>{p.stockQuantity} left</strong></div>) : <EmptyState text="No low stock items" />}
        </div>
      </div>
      <div className="panel">
        <PanelTitle icon={PackagePlus} title="Top Products" />
        <div className="stack-list">
          {summary.topProducts?.length ? summary.topProducts.map(p => <div className="mini-row" key={p.productName}><span>{p.productName}</span><strong>{money(p.total)}</strong></div>) : <EmptyState text="No sales yet" />}
        </div>
      </div>
    </div>
  );
}

function Categories() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");

  const load = () => apiFetch("/categories").then(data => setItems(Array.isArray(data) ? data : [])).catch(err => setError(err.message));
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, status: Boolean(form.status) };
      await apiFetch(editing ? `/categories/${editing.categoryId}` : "/categories", { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      setModal(false);
      setEditing(null);
      setForm(emptyCategory);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (confirm("Delete this category?")) {
      try {
        await apiFetch(`/categories/${id}`, { method: "DELETE" });
        load();
      } catch (err) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="panel wide">
      <Toolbar title="Category Management" action="Add Category" onAdd={() => { setEditing(null); setForm(emptyCategory); setModal(true); }} />
      {error && <div className="alert error">{error}</div>}
      <DataTable headers={["Category", "Description", "Status", "Updated", "Actions"]} rows={items.map(item => [item.categoryName, item.description, item.status ? "Active" : "Inactive", dateTime(item.updatedAt), <RowActions onEdit={() => { setEditing(item); setForm(item); setModal(true); }} onDelete={() => remove(item.categoryId)} />])} />
      {modal && <Modal title={editing ? "Update Category" : "New Category"} onClose={() => setModal(false)}><form className="form-grid" onSubmit={save}><label>Category Name<input value={form.categoryName} onChange={e => setForm({ ...form, categoryName: e.target.value })} required /></label><label>Description<textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label className="switch-line"><input type="checkbox" checked={form.status} onChange={e => setForm({ ...form, status: e.target.checked })} /> Active</label><button className="primary-btn">Save Category</button></form></Modal>}
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");

  const load = () => Promise.all([apiFetch(`/products?query=${encodeURIComponent(query)}${categoryId ? `&categoryId=${categoryId}` : ""}`), apiFetch("/categories")]).then(([p, c]) => { setProducts(Array.isArray(p) ? p : []); setCategories(Array.isArray(c) ? c : []); }).catch(err => setError(err.message));
  useEffect(load, [query, categoryId]);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, categoryId: Number(form.categoryId), price: Number(form.price), stockQuantity: Number(form.stockQuantity), status: Boolean(form.status) };
      await apiFetch(editing ? `/products/${editing.productId}` : "/products", { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      setModal(false);
      setEditing(null);
      setForm(emptyProduct);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (confirm("Delete this product?")) {
      try {
        await apiFetch(`/products/${id}`, { method: "DELETE" });
        load();
      } catch (err) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="panel wide">
      <Toolbar title="Product & Stock Management" action="Add Product" onAdd={() => { setEditing(null); setForm({ ...emptyProduct, categoryId: categories[0]?.categoryId || "" }); setModal(true); }} />
      <div className="filters"><div className="search-box"><Search size={18} /><input placeholder="Search product or barcode" value={query} onChange={e => setQuery(e.target.value)} /></div><select value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></div>
      {error && <div className="alert error">{error}</div>}
      <DataTable headers={["Product", "Category", "Price", "Stock", "Barcode", "Actions"]} rows={products.map(item => [<ProductCell product={item} />, item.categoryName, money(item.price), <span className={item.stockQuantity <= 5 ? "stock low" : "stock"}>{item.stockQuantity}</span>, item.barcode, <RowActions onEdit={() => { setEditing(item); setForm({ ...item }); setModal(true); }} onDelete={() => remove(item.productId)} />])} />
      {modal && <Modal title={editing ? "Update Product" : "New Product"} onClose={() => setModal(false)}><form className="form-grid two" onSubmit={save}><label>Category<select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required><option value="">Select</option>{categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></label><label>Product Name<input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} required /></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></label><label>Stock Quantity<input type="number" min="0" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} required /></label><label>Barcode<input value={form.barcode || ""} onChange={e => setForm({ ...form, barcode: e.target.value })} /></label><label>Image URL<input value={form.imageUrl || ""} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></label><label className="full">Description<textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label className="switch-line"><input type="checkbox" checked={form.status} onChange={e => setForm({ ...form, status: e.target.checked })} /> Active</label><button className="primary-btn full">Save Product</button></form></Modal>}
    </div>
  );
}

function Customers({ user }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyCustomer);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");

  const load = () => apiFetch(`/customers?query=${encodeURIComponent(query)}`).then(data => setItems(Array.isArray(data) ? data : [])).catch(err => setError(err.message));
  useEffect(load, [query]);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(editing ? `/customers/${editing.customerId}` : "/customers", { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
      setModal(false);
      setEditing(null);
      setForm(emptyCustomer);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (confirm("Delete this customer?")) {
      try {
        await apiFetch(`/customers/${id}`, { method: "DELETE" });
        load();
      } catch (err) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="panel wide">
      <Toolbar title="Customer Management" action="Add Customer" onAdd={() => { setEditing(null); setForm(emptyCustomer); setModal(true); }} />
      <div className="filters"><div className="search-box"><Search size={18} /><input placeholder="Search customer" value={query} onChange={e => setQuery(e.target.value)} /></div></div>
      {error && <div className="alert error">{error}</div>}
      <DataTable headers={["Name", "Phone", "Email", "Address", "Created", "Actions"]} rows={items.map(item => [item.name, item.phone, item.email, item.address, dateTime(item.createdAt), user?.role === "ADMIN" ? <RowActions onEdit={() => { setEditing(item); setForm(item); setModal(true); }} onDelete={() => remove(item.customerId)} /> : <button className="soft-btn" onClick={() => { setEditing(item); setForm(item); setModal(true); }}>Edit</button>])} />
      {modal && <Modal title={editing ? "Update Customer" : "New Customer"} onClose={() => setModal(false)}><form className="form-grid two" onSubmit={save}><label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label><label>Phone<input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label>Email<input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Address<input value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></label><button className="primary-btn full">Save Customer</button></form></Modal>}
    </div>
  );
}

function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discount, setDiscount] = useState("");
  const [cashPaid, setCashPaid] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardReferenceNo, setCardReferenceNo] = useState("");
  const [onlineReferenceNo, setOnlineReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [customerModal, setCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  const load = () => Promise.all([apiFetch(`/products?query=${encodeURIComponent(query)}${categoryId ? `&categoryId=${categoryId}` : ""}`), apiFetch("/categories"), apiFetch("/customers")]).then(([p, c, cu]) => { const safeProducts = Array.isArray(p) ? p : []; setProducts(safeProducts.filter(x => x?.status)); setCategories(Array.isArray(c) ? c : []); setCustomers(Array.isArray(cu) ? cu : []); }).catch(err => setError(err.message));
  useEffect(load, [query, categoryId]);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const discountValue = Math.max(0, Number(discount || 0));
  const grand = Math.max(0, subtotal - discountValue);
  const balance = paymentMethod === "CASH" ? Math.max(0, Number(cashPaid || 0) - grand) : 0;
  const cashDue = paymentMethod === "CASH" ? Math.max(0, grand - Number(cashPaid || 0)) : 0;

  function add(product) {
    if (product.stockQuantity <= 0) return;
    setCart(prev => {
      const found = prev.find(i => i.productId === product.productId);
      if (found) return prev.map(i => i.productId === product.productId ? { ...i, qty: Math.min(i.qty + 1, product.stockQuantity) } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function setQty(id, qty) {
    setCart(prev => prev.map(i => i.productId === id ? { ...i, qty: Math.max(1, Math.min(Number(qty || 1), i.stockQuantity)) } : i));
  }

  function resetPayment() {
    setCashPaid("");
    setCardHolderName("");
    setCardLastFour("");
    setCardReferenceNo("");
    setOnlineReferenceNo("");
    setNotes("");
  }

  async function checkout() {
    setError("");
    if (!cart.length) {
      setError("Cart is empty");
      return;
    }
    if (discountValue > subtotal) {
      setError("Discount cannot be greater than subtotal");
      return;
    }
    if (paymentMethod === "CASH" && Number(cashPaid || 0) < grand) {
      setError("Cash paid amount must be equal or greater than grand total");
      return;
    }
    if (paymentMethod === "CARD" && (!cardHolderName.trim() || cardLastFour.trim().length !== 4 || !cardReferenceNo.trim())) {
      setError("Card holder name, last 4 digits and reference number are required");
      return;
    }
    if (paymentMethod === "ONLINE" && !onlineReferenceNo.trim()) {
      setError("Online payment reference number is required");
      return;
    }
    try {
      const payload = {
        customerId: customerId ? Number(customerId) : null,
        discount: discountValue,
        paymentMethod,
        tenderedAmount: paymentMethod === "CASH" ? Number(cashPaid || 0) : grand,
        transactionId: paymentMethod === "ONLINE" ? onlineReferenceNo.trim() : cardReferenceNo.trim(),
        cardHolderName: paymentMethod === "CARD" ? cardHolderName.trim() : null,
        cardLastFour: paymentMethod === "CARD" ? cardLastFour.trim() : null,
        cardReferenceNo: paymentMethod === "CARD" ? cardReferenceNo.trim() : null,
        notes: notes.trim(),
        items: cart.map(i => ({ productId: i.productId, quantity: i.qty, discount: 0 }))
      };
      const data = await apiFetch("/orders", { method: "POST", body: JSON.stringify(payload) });
      setInvoice(data);
      setCart([]);
      setDiscount("");
      setCustomerId("");
      resetPayment();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveQuickCustomer(e) {
    e.preventDefault();
    setError("");
    try {
      const customer = await apiFetch("/customers", { method: "POST", body: JSON.stringify(customerForm) });
      setCustomers(prev => [customer, ...prev]);
      setCustomerId(String(customer.customerId));
      setCustomerForm(emptyCustomer);
      setCustomerModal(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pos-layout">
      <section className="panel product-zone">
        <Toolbar title="Fast Checkout" />
        <div className="filters"><div className="search-box"><Search size={18} /><input placeholder="Search product or barcode" value={query} onChange={e => setQuery(e.target.value)} /></div><select value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></div>
        {error && <div className="alert error">{error}</div>}
        <div className="product-grid">
          {products.map(product => <button key={product.productId} className="product-card" onClick={() => add(product)} disabled={product.stockQuantity <= 0}><ProductImage src={product.imageUrl} /><span>{product.categoryName}</span><strong>{product.productName}</strong><b>{money(product.price)}</b><em>{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}</em></button>)}
        </div>
      </section>
      <aside className="panel cart-zone">
        <PanelTitle icon={ShoppingCart} title="Current Cart" />
        <div className="customer-pick">
          <label>Customer
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
            </select>
          </label>
          <button className="customer-add-btn" onClick={() => setCustomerModal(true)}><UsersRound size={16} /> Add Customer</button>
        </div>
        <div className="cart-list">
          {cart.length ? cart.map(item => <div className="cart-item" key={item.productId}><div><strong>{item.productName}</strong><span>{money(item.price)}</span></div><input type="number" min="1" max={item.stockQuantity} value={item.qty} onChange={e => setQty(item.productId, e.target.value)} /><button className="icon-btn" onClick={() => setCart(cart.filter(i => i.productId !== item.productId))}><X size={16} /></button></div>) : <EmptyState text="Add products to create invoice" />}
        </div>
        <div className="totals">
          <div className="total-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <label>Discount
            <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" />
          </label>
          <label>Payment Method
            <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); resetPayment(); }}>
              <option value="CASH">Cash Payment</option>
              <option value="CARD">Card Payment</option>
              <option value="ONLINE">Online Payment</option>
            </select>
          </label>
          <PaymentFields method={paymentMethod} grand={grand} cashPaid={cashPaid} setCashPaid={setCashPaid} balance={balance} cashDue={cashDue} cardHolderName={cardHolderName} setCardHolderName={setCardHolderName} cardLastFour={cardLastFour} setCardLastFour={setCardLastFour} cardReferenceNo={cardReferenceNo} setCardReferenceNo={setCardReferenceNo} onlineReferenceNo={onlineReferenceNo} setOnlineReferenceNo={setOnlineReferenceNo} notes={notes} setNotes={setNotes} />
          <div className="grand"><span>Grand Total</span><strong>{money(grand)}</strong></div>
        </div>
        <button className="primary-btn" onClick={checkout}><ReceiptText size={18} /> Generate Invoice</button>
      </aside>
      {customerModal && <Modal title="Quick Add Customer" onClose={() => setCustomerModal(false)}><form className="form-grid two" onSubmit={saveQuickCustomer}><label>Name<input value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} required /></label><label>Phone<input value={customerForm.phone || ""} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} /></label><label>Email<input type="email" value={customerForm.email || ""} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} /></label><label>Address<input value={customerForm.address || ""} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} /></label><button className="primary-btn full">Save Customer</button></form></Modal>}
      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}

function PaymentFields({ method, grand, cashPaid, setCashPaid, balance, cashDue, cardHolderName, setCardHolderName, cardLastFour, setCardLastFour, cardReferenceNo, setCardReferenceNo, onlineReferenceNo, setOnlineReferenceNo, notes, setNotes }) {
  return <div className="payment-box">
    <div className="payment-title">{method === "CASH" ? <Banknote size={17} /> : <CreditCard size={17} />} <span>{method === "CASH" ? "Cash Payment Details" : method === "CARD" ? "Card Payment Details" : "Online Payment Details"}</span></div>
    {method === "CASH" && <div className="payment-grid">
      <label>Cash Received
        <input type="number" min="0" step="0.01" value={cashPaid} onChange={e => setCashPaid(e.target.value)} placeholder="Enter given amount" />
      </label>
      <div className={cashDue > 0 ? "payment-result due" : "payment-result success"}>
        <span>{cashDue > 0 ? "Still Due" : "Balance"}</span>
        <strong>{money(cashDue > 0 ? cashDue : balance)}</strong>
      </div>
    </div>}
    {method === "CARD" && <div className="payment-grid card-grid">
      <label>Card Holder Name
        <input value={cardHolderName} onChange={e => setCardHolderName(e.target.value)} placeholder="Name on card" />
      </label>
      <label>Last 4 Digits
        <input value={cardLastFour} inputMode="numeric" maxLength="4" onChange={e => setCardLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" />
      </label>
      <label>Reference No
        <input value={cardReferenceNo} onChange={e => setCardReferenceNo(e.target.value)} placeholder="Terminal reference" />
      </label>
      <div className="payment-result success"><span>Paid Amount</span><strong>{money(grand)}</strong></div>
    </div>}
    {method === "ONLINE" && <div className="payment-grid">
      <label>Online Reference No
        <input value={onlineReferenceNo} onChange={e => setOnlineReferenceNo(e.target.value)} placeholder="Transfer or gateway reference" />
      </label>
      <div className="payment-result success"><span>Paid Amount</span><strong>{money(grand)}</strong></div>
    </div>}
    <label>Payment Note
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional cashier note" />
    </label>
  </div>;
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = () => apiFetch("/orders").then(data => setOrders(Array.isArray(data) ? data : [])).catch(err => setError(err.message));
  useEffect(load, []);

  return (
    <div className="panel wide">
      <Toolbar title="Order History & Invoices" />
      {error && <div className="alert error">{error}</div>}
      <DataTable headers={["Invoice", "Customer", "Cashier", "Date", "Payment", "Paid", "Total", "View"]} rows={orders.map(o => [o.invoiceNo, o.customerName, o.cashierName, dateTime(o.orderDate), o.payment?.paymentMethod, money(o.payment?.tenderedAmount || o.grandTotal), money(o.grandTotal), <button className="soft-btn" onClick={() => setSelected(o)}>Invoice</button>])} />
      {selected && <InvoiceModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function InvoiceModal({ order, onClose }) {
  function printInvoice() {
    const html = document.getElementById("invoice-print").innerHTML;
    const win = window.open("", "print", "width=900,height=700");
    win.document.write(`<html><head><title>${order.invoiceNo}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}.right{text-align:right}.meta{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.total{display:grid;justify-content:end;text-align:right;gap:4px;margin-top:12px}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  }

  return <Modal title="Invoice" onClose={onClose}><div id="invoice-print" className="invoice"><div className="invoice-head"><div><h2>Retail Pro POS</h2><p>Modern Retail Management System · Sri Lanka</p></div><strong>{order.invoiceNo}</strong></div><div className="invoice-meta meta"><span>Customer: {order.customerName}</span><span>Cashier: {order.cashierName}</span><span>Date: {dateTime(order.orderDate)}</span><span>Payment: {order.payment?.paymentMethod}</span>{order.payment?.transactionId && <span>Ref: {order.payment.transactionId}</span>}{order.payment?.cardLastFour && <span>Card: **** {order.payment.cardLastFour}</span>}</div><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{order.items?.map(i => <tr key={i.orderItemId}><td>{i.productName}</td><td>{i.quantity}</td><td>{money(i.unitPrice)}</td><td>{money(i.totalPrice)}</td></tr>)}</tbody></table><div className="invoice-total total"><span>Subtotal {money(order.subTotal)}</span><span>Discount {money(order.discount)}</span><span>Paid {money(order.payment?.tenderedAmount || order.grandTotal)}</span>{Number(order.payment?.balanceAmount || 0) > 0 && <span>Balance {money(order.payment.balanceAmount)}</span>}<strong>Grand Total {money(order.grandTotal)}</strong></div></div><button className="primary-btn" onClick={printInvoice}><Printer size={18} /> Print Invoice</button></Modal>;
}

function Toolbar({ title, action, onAdd }) {
  return <div className="toolbar"><h2>{title}</h2>{action && <button className="primary-btn compact" onClick={onAdd}>{action}</button>}</div>;
}

function PanelTitle({ icon: Icon, title }) {
  return <div className="panel-title"><Icon size={19} /><h2>{title}</h2></div>;
}

function DataTable({ headers, rows }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={String(h)}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, idx) => <tr key={idx}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}><EmptyState text="No records found" /></td></tr>}</tbody></table></div>;
}

function ProductImage({ src }) {
  return <img src={src || fallbackImage} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }} />;
}

function ProductCell({ product }) {
  return <div className="product-cell"><ProductImage src={product.imageUrl} /><div><strong>{product.productName}</strong><span>{product.description}</span></div></div>;
}

function RowActions({ onEdit, onDelete }) {
  return <div className="row-actions"><button className="soft-btn" onClick={onEdit}>Edit</button><button className="danger-btn" onClick={onDelete}><Trash2 size={15} /></button></div>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop"><div className="modal-card"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>{children}</div></div>;
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function Loader() {
  return <div className="loader">Loading system data...</div>;
}

export default App;
