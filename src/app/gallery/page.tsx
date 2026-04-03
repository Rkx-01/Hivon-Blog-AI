import CircularGallery from "@/components/ui/circular-flip-card-gallery";
import Link from "next/link";

export default function GalleryPage() {
  return (
    <div className="page" style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', minHeight: '100vh', overflow: 'hidden' }}>
      <div className="container" style={{ maxWidth: '1200px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 'auto', display: 'flex', justifyContent: 'center' }}>
          <CircularGallery />
        </div>
      </div>
    </div>
  );
}
