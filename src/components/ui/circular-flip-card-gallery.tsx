"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Post } from "@/types"
import Image from 'next/image'

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

function FlipCardSkeleton({ className, style }: { className?: string, style?: any }) {
  return (
    <div
      className={cn("absolute -translate-x-1/2 -translate-y-1/2", className)}
      style={style}
    >
      <div className="w-24 h-32 md:w-28 md:h-36 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden">
        <div className="w-full h-full animate-pulse bg-black/5" />
      </div>
    </div>
  )
}

function FlipCard({ image, title, className, style, href }: { image: string, title: string, className?: string, style?: any, href?: string }) {
  const content = (
    <div
      className={cn("absolute -translate-x-1/2 -translate-y-1/2", className)}
      style={style}
    >
      <div className="group relative w-24 h-32 md:w-28 md:h-36 rounded-2xl transition-transform duration-300 ease-in-out hover:scale-110">
        <div className="relative w-full h-full rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)]">
          <Image 
            src={image} 
            alt={title} 
            width={200}
            height={300}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 md:p-3 pointer-events-none">
            <p className="text-white text-[10px] md:text-[11px] font-medium leading-tight line-clamp-2">
              {title}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="contents">{content}</Link>
  }
  return content
}

export default function CircularGallery({ onStartReading, posts = [] }: { onStartReading?: () => void, posts?: Post[] }) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(700)
  const [rotation, setRotation] = useState(0)
  const [isRotating, setIsRotating] = useState(true)

  const isLoading = posts.length === 0;
  
  const displayData = isLoading 
    ? Array.from({ length: 12 }) // 12 skeleton cards
    : posts.slice(0, 12).map((p: any) => ({
        image: p.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
        title: p.title,
        id: p.id
      }))

  useEffect(() => {
    const updateSize = () => { if (galleryRef.current) setSize(galleryRef.current.offsetWidth); }
    updateSize(); window.addEventListener('resize', updateSize); return () => window.removeEventListener('resize', updateSize);
  }, [])

  useEffect(() => {
    let frameId: number
    const animate = () => { if (isRotating) setRotation((r: number) => r + 0.0008); frameId = requestAnimationFrame(animate); }
    frameId = requestAnimationFrame(animate); return () => cancelAnimationFrame(frameId);
  }, [isRotating])

  const resumeTimeout = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    return () => {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setRotation((r: number) => r + e.deltaY * 0.0008);
      setIsRotating(false);
      
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
      resumeTimeout.current = setTimeout(() => {
        setIsRotating(true);
      }, 3000);
    }
    const container = containerRef.current
    if (container) container.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      container?.removeEventListener("wheel", handleWheel);
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    }
  }, [])

  const radius = size * 0.48
  const centerX = size / 2
  const centerY = size / 2

  return (
    <div 
      ref={containerRef}
      className="hivon-gallery"
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', zIndex: 0, overflow: 'hidden' }}
    >

      <div
        ref={galleryRef}
        style={{ position: 'relative', width: '100%', maxWidth: '700px', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10001, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em', lineHeight: '1.1', fontFamily: '"Instrument Serif", serif' }}>
              Think deeper.<br/>Write sharper.
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.4rem', fontWeight: '400', fontFamily: '"Inter", sans-serif' }}>
              Stories from curious minds.
            </p>
            <button
              onClick={() => onStartReading?.()}
              style={{ background: 'var(--accent)', color: 'black', padding: '1rem 2.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', transition: 'filter 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Start Reading <ArrowRight size={18} />
            </button>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6em', fontWeight: '700', marginTop: '1.5rem', fontFamily: '"Inter", sans-serif' }}>
              SCROLL TO EXPLORE
            </p>
          </div>
        </div>

        {size > 0 &&
          displayData.map((item: any, index) => {
            const angle = (index / displayData.length) * 2 * Math.PI + rotation
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            const cardRotation = (angle + Math.PI / 2) * (180 / Math.PI)
            
            if (isLoading) {
              return (
                <FlipCardSkeleton
                  key={`skeleton-${index}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) rotate(${cardRotation}deg)`,
                  }}
                />
              )
            }

            return (
              <FlipCard
                key={item.id || index}
                image={item.image}
                title={item.title}
                href={item.id ? `/posts/${item.id}` : undefined}
                className="hover:z-[10002]"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `translate(-50%, -50%) rotate(${cardRotation}deg)`,
                }}
              />
            )
          })}
      </div>
    </div>
  )
}
