import { Card } from "@/components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  bullets: string[];
};

export function ModulePage({ title, description, bullets }: ModulePageProps) {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-1 text-zinc-600">{description}</p>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Estado del modulo</h2>
        <ul className="space-y-2 text-sm text-zinc-700">
          {bullets.map((item) => (
            <li key={item} className="rounded-md bg-zinc-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
