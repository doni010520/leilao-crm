import { getProperties } from "@/lib/data/auction";
import { PropertiesClient } from "@/components/properties-client";
import { Scroll } from "@/components/scroll";

export default async function ImoveisPage() {
  const properties = await getProperties({ status: "aberto" });
  return (
    <Scroll>
      <div className="mx-auto max-w-7xl p-6">
        <PropertiesClient initialProperties={properties} />
      </div>
    </Scroll>
  );
}
