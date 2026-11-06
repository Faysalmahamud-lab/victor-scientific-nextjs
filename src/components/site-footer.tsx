import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Image
            src="/brand/footer-logo.webp"
            alt="Victor Scientific Co."
            width={190}
            height={70}
          />
          <p>
            Scientific equipment, laboratory instruments, chemicals,
            testing solutions and educational products.
          </p>
        </div>

        <div>
          <span className="eyebrow">Explore</span>
          <Link href="/shop">Shop products</Link>
          <Link href="/brands">Brands</Link>
          <Link href="/track-order">Track order</Link>
        </div>

        <div>
          <span className="eyebrow">Information</span>
          <Link href="/company">Company profile</Link>
          <Link href="/page/privacy-policy">Privacy policy</Link>
          <Link href="/page/terms-and-conditions">Terms</Link>
        </div>

        <div>
          <span className="eyebrow">Location</span>
          <p><MapPin size={15} /> {process.env.NEXT_PUBLIC_STORE_ADDRESS || "10 Hatkhola Road, Kader Tropical Heights (2nd floor), Tikatuli, Dhaka 1203"}</p>
          <Link className="footer-link" href="/site/contact-us">
            Contact the team <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Victor Scientific Co. All rights reserved.</span>
        <span>Scientific products and laboratory solutions.</span>
      </div>
    </footer>
  );
}
