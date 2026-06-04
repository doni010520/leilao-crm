import { getTasks } from "@/lib/data/auction";
import { TasksClient } from "@/components/tasks-client";
import { Scroll } from "@/components/scroll";

export default async function TarefasPage() {
  const pending = await getTasks({ completed: false });
  const done = await getTasks({ completed: true });
  return (
    <Scroll>
      <div className="mx-auto max-w-4xl p-6">
        <TasksClient pending={pending} done={done} />
      </div>
    </Scroll>
  );
}
