import { TextReveal } from "@/components/reveal/TextReveal";

export function BlankState() {
  return (
    <div className="flex h-full flex-col items-center justify-end px-6 pb-8 text-center">
      <h2 className="text-[22px] font-medium text-ink">
        <TextReveal text="What video are you making?" leadingCount={3} charDelay={24} />
      </h2>
    </div>
  );
}
