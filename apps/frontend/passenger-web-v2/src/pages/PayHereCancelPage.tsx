import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary, noticeSecondary } from "@/components/findmybus/noticeStyles";
import { useBooking } from "@/lib/booking/BookingContext";

/** Where PayHere sends the passenger if they cancel at checkout (ADR-014). Nothing needs undoing: the held seats
 * are released by themselves after a short time. */
export default function PayHereCancelPage() {
  const [params] = useSearchParams();
  const { clear } = useBooking();
  const orderId = params.get("order_id");

  return (
    <SiteLayout>
      <PageHero>
        <h1 className="mt-4 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Payment cancelled</h1>
      </PageHero>
      <div className="relative z-[5] mx-auto -mt-[42px] max-w-xl px-3 pb-16 min-[360px]:px-4 md:px-6">
        <Notice
          role="status"
          icon={<XCircle className="h-6 w-6" />}
          title="You weren't charged"
          actions={
            <>
              <Link to="/findmybus" onClick={clear} className={noticePrimary}>Search again</Link>
              <Link to="/tickets" className={noticeSecondary}>My tickets</Link>
            </>
          }
        >
          {orderId ? `Order ${orderId} wasn't completed. ` : "The booking wasn't completed. "}
          The seats you held are released shortly, so you can book them again.
        </Notice>
      </div>
    </SiteLayout>
  );
}
