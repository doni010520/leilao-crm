import { getProperties } from "@/lib/data/auction";
import { ImoveisPageClient } from "@/components/imoveis-page-client";
import { Scroll } from "@/components/scroll";

export default async function ImoveisPage() {
  const properties = await getProperties({ status: "aberto" });
  return (
    <Scroll>
      <div className="mx-auto max-w-7xl p-6">
        <ImoveisPageClient initialProperties={properties} />
      </div>
    </Scroll>
  );
}
