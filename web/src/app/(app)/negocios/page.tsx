import { getDeals } from "@/lib/data/auction";
import { DealsClient } from "@/components/deals-client";
import { Scroll } from "@/components/scroll";

export default async function NegociosPage() {
  const deals = await getDeals();
  return (
    <Scroll>
      <div className="mx-auto max-w-6xl p-6">
        <DealsClient initialDeals={deals} />
      </div>
    </Scroll>
  );
}
