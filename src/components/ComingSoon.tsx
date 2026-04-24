import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

type Props = {
  title: string;
  description?: string;
};

export default function ComingSoon({ title, description }: Props) {
  const router = useRouter();
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Construction size={28} className="text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          {description ?? "This module is coming in a future milestone. Masters must be set up first."}
        </p>
      </div>
      <Button variant="secondary" onClick={() => router.push("/")} className="cursor-pointer">
        Back to Dashboard
      </Button>
    </div>
  );
}
