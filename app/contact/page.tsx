import { Phone, Mail, MapPin, MessageCircle, Clock, Navigation } from 'lucide-react';
import { PublicShell } from '@/components/public-shell';

export const metadata = {
  title: 'Contact',
  description: 'Contact Kamal Agencies — wholesale distributor of pharmaceuticals and healthcare products in Ranchi.',
};

export default function ContactPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">Contact Us</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reach out for product availability, pricing, and wholesale enquiries.
          </p>
        </div>

        {/* Quick action buttons — mobile-first */}
        <div className="grid gap-3 sm:grid-cols-3">
          <a href="tel:6205259004" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Phone className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Call</p>
              <p className="truncate text-sm font-semibold text-foreground">6205259004</p>
            </div>
          </a>
          <a href="https://wa.me/918252554209" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success text-success-foreground">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">WhatsApp</p>
              <p className="truncate text-sm font-semibold text-foreground">8252554209</p>
            </div>
          </a>
          <a href="mailto:kamalagencies1996@gmail.com" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Mail className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="truncate text-sm font-semibold text-foreground">kamalagencies1996@gmail.com</p>
            </div>
          </a>
        </div>

        {/* Details */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-foreground">Visit Us</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Address</p>
                  <p className="mt-0.5 text-muted-foreground">2nd Floor, Hari Mohan Apt., Shradhanand Road, Ranchi</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Phone</p>
                  <p className="mt-0.5 text-muted-foreground">
                    <a href="tel:6205259004" className="hover:text-foreground">6205259004</a><br />
                    <a href="tel:8252554209" className="hover:text-foreground">8252554209</a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="mt-0.5 text-muted-foreground">
                    <a href="mailto:kamalagencies1996@gmail.com" className="hover:text-foreground">kamalagencies1996@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-foreground">About Kamal Agencies</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Kamal Agencies is a wholesale distributor of pharmaceuticals and healthcare products, serving customers since 1996. We distribute products from leading pharmaceutical companies with company-wise retail and wholesale discounts.
            </p>
            <div className="mt-4 flex items-start gap-3 text-sm">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Established</p>
                <p className="mt-0.5 text-muted-foreground">Since 1996</p>
              </div>
            </div>
            <a
              href="https://maps.google.com/?q=Shradhanand+Road+Ranchi"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Navigation className="h-4 w-4 text-primary" />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
