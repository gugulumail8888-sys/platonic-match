import dynamic from 'next/dynamic';

const ZoomCheckClient = dynamic(() => import('./_client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-zinc-400 text-sm">読み込み中...</p>
    </div>
  ),
});

export default function ZoomCheckPage() {
  return <ZoomCheckClient />;
}
