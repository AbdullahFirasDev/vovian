import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Guard, Layout } from './components/Layout'
import { Spinner } from './components/ui'
import { useAccess } from './lib/access'
import { Login, ResetPassword } from './pages/Login'

// Route-level code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ProductsList = lazy(() => import('./pages/products/ProductsList'))
const ProductEdit = lazy(() => import('./pages/products/ProductEdit'))
const Categories = lazy(() => import('./pages/products/Categories'))
const Collections = lazy(() => import('./pages/products/Collections'))
const Inventory = lazy(() => import('./pages/Inventory'))
const OrdersList = lazy(() => import('./pages/orders/OrdersList'))
const OrderDetail = lazy(() => import('./pages/orders/OrderDetail'))
const Invoice = lazy(() => import('./pages/orders/Invoice'))
const CustomersList = lazy(() => import('./pages/customers/CustomersList'))
const CustomerDetail = lazy(() => import('./pages/customers/CustomerDetail'))
const Messages = lazy(() => import('./pages/customers/Messages'))
const Discounts = lazy(() => import('./pages/Discounts'))
const Homepage = lazy(() => import('./pages/content/Homepage'))
const Pages = lazy(() => import('./pages/content/Pages'))
const Menus = lazy(() => import('./pages/content/Menus'))
const Subscribers = lazy(() => import('./pages/content/Subscribers'))
const Settings = lazy(() => import('./pages/Settings'))
const Staff = lazy(() => import('./pages/Staff'))
const Audit = lazy(() => import('./pages/Audit'))
const Notifications = lazy(() => import('./pages/Notifications'))

export function App() {
  const { session, loading, roles } = useAccess()

  if (loading) return <div className="grid min-h-svh place-items-center"><Spinner /></div>

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      {!session || roles.length === 0 ? (
        <Route path="*" element={<Login noAccess={!!session && roles.length === 0} />} />
      ) : (
        <>
          <Route path="/orders/:id/invoice" element={<Suspense fallback={<Spinner />}><Guard permission="orders.read"><Invoice /></Guard></Suspense>} />
          <Route element={<Layout />}>
            <Route index element={<S p="dashboard.view"><Dashboard /></S>} />
            <Route path="products" element={<S p="products.read"><ProductsList /></S>} />
            <Route path="products/new" element={<S p="products.write"><ProductEdit /></S>} />
            <Route path="products/:id" element={<S p="products.read"><ProductEdit /></S>} />
            <Route path="categories" element={<S p="products.read"><Categories /></S>} />
            <Route path="collections" element={<S p="products.read"><Collections /></S>} />
            <Route path="inventory" element={<S p="inventory.read"><Inventory /></S>} />
            <Route path="orders" element={<S p="orders.read"><OrdersList /></S>} />
            <Route path="orders/:id" element={<S p="orders.read"><OrderDetail /></S>} />
            <Route path="customers" element={<S p="customers.read"><CustomersList /></S>} />
            <Route path="customers/messages" element={<Navigate to="/messages" replace />} />
            <Route path="customers/:id" element={<S p="customers.read"><CustomerDetail /></S>} />
            <Route path="messages" element={<S p="customers.read"><Messages /></S>} />
            <Route path="discounts" element={<S p="discounts.read"><Discounts /></S>} />
            <Route path="content/homepage" element={<S p="content.read"><Homepage /></S>} />
            <Route path="content/pages" element={<S p="content.read"><Pages /></S>} />
            <Route path="content/menus" element={<S p="content.read"><Menus /></S>} />
            <Route path="content/subscribers" element={<S p="content.read"><Subscribers /></S>} />
            <Route path="settings" element={<S p="settings.read"><Settings /></S>} />
            <Route path="staff" element={<S p="staff.manage"><Staff /></S>} />
            <Route path="audit" element={<S p="audit.read"><Audit /></S>} />
            <Route path="notifications" element={<Suspense fallback={<Spinner />}><Notifications /></Suspense>} />
            <Route path="*" element={<p className="py-24 text-center font-display text-3xl">Page not found</p>} />
          </Route>
        </>
      )}
    </Routes>
  )
}

function S({ p, children }: { p: Parameters<typeof Guard>[0]['permission']; children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Guard permission={p}>{children}</Guard>
    </Suspense>
  )
}
