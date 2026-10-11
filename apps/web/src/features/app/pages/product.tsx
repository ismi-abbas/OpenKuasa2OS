import { Navigate, useParams } from 'react-router';
import { PlaceholderPage } from '@/features/app/shell/placeholder-page';
import NotFoundContent from '@/components/not-found-content';
import { findItem, firstItem, getProduct } from '@/features/app/nav';
import { SCREENS } from '@/features/modules/registry';
import CrmContactsPage from '@/features/modules/crm/contacts-page';

export const AppNotFound = () => (
  <div className="grid h-full place-items-center py-16">
    <NotFoundContent />
  </div>
);

// A product root (e.g. /reach) has no page of its own: send it to the first nav item.
export function ProductRedirect() {
  const product = getProduct(useParams().product);
  const item = product && firstItem(product);
  return item ? <Navigate to={`/${product.key}/${item.slug}`} replace /> : <AppNotFound />;
}

export function ItemPage() {
  const { product: key = '', item: slug = '' } = useParams();
  const product = getProduct(key);
  const item = product && findItem(product, slug);
  if (!product || !item) return <AppNotFound />;

  if (key === 'crm' && slug === 'contacts') return <CrmContactsPage />;
  const Screen = SCREENS[`${key}/${slug}`];
  return Screen ? <Screen /> : <PlaceholderPage title={item.label} subtitle={product.name} icon={item.icon} />;
}
