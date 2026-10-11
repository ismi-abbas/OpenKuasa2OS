import { MarketingHeader } from '@/features/marketing/components/marketing-header';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { Hero } from '@/features/marketing/components/landing/hero';
import { ProductTour } from '@/features/marketing/components/landing/product-tour';
import { Connected } from '@/features/marketing/components/landing/connected';
import { OpenSource } from '@/features/marketing/components/landing/open-source';
import { FinalCta } from '@/features/marketing/components/landing/final-cta';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-mk-bg">
      <title>OpenKuasa OS</title>
      <MarketingHeader />
      <Hero />
      <ProductTour />
      <Connected />
      <OpenSource />
      <FinalCta />
      <MarketingFooter />
    </div>
  );
}
