interface Props { bloque: string; tema: string }

export default function TopicBar({ bloque, tema }: Props) {
  return (
    <div className="text-sm text-gray-500">
      <span>{bloque}</span>
      <span className="mx-2">/</span>
      <span className="font-medium text-gray-800">{tema}</span>
    </div>
  );
}
