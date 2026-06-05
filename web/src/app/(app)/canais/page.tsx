import { getChannels } from "@/lib/data/channels";
import { ChannelsList } from "@/components/channels-list";
import { PageHeader, EmptyState } from "@/components/ui";
import { NewChannelDialog } from "@/components/new-channel-dialog";
import { Scroll } from "@/components/scroll";
import { Radio } from "lucide-react";

export default async function CanaisPage() {
  const channels = await getChannels();

  return (
    <Scroll>
      <PageHeader
        title="Canais WhatsApp"
        subtitle={channels.length > 0
          ? `${channels.length} canal${channels.length !== 1 ? "is" : ""} cadastrado${channels.length !== 1 ? "s" : ""}`
          : "Conecte um número de WhatsApp para a IA começar a atender"
        }
        action={<NewChannelDialog />}
      />

      {channels.length === 0 ? (
        <EmptyState
          title="Nenhum canal conectado"
          hint="Conecte seu WhatsApp Business para a IA começar a atender seus leads automaticamente."
          icon={<Radio size={32} />}
        />
      ) : (
        <ChannelsList channels={channels} />
      )}
    </Scroll>
  );
}
