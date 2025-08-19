import Image from 'next/image'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Skeleton } from './skeleton'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  containerClassName?: string
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  containerClassName,
  fill = false,
  sizes,
  quality = 85,
  placeholder,
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          containerClassName,
          fill && 'absolute inset-0',
          !fill && width && height && `w-[${width}px] h-[${height}px]`
        )}
      >
        <div className="text-center p-4">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-muted-foreground">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && (
        <Skeleton 
          className={cn(
            'absolute inset-0 z-10',
            !fill && width && height && `w-[${width}px] h-[${height}px]`
          )} 
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes || (fill ? '100vw' : undefined)}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          className,
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100 transition-opacity duration-300'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

// Hero image component with optimizations
export function HeroImage({
  src,
  alt,
  className,
  containerClassName,
}: {
  src: string
  alt: string
  className?: string
  containerClassName?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={cn('object-cover', className)}
      containerClassName={cn('relative w-full h-full', containerClassName)}
    />
  )
}

// Avatar image component with optimizations
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      containerClassName={cn('rounded-full overflow-hidden', `w-[${size}px] h-[${size}px]`)}
    />
  )
}

// Card image component with optimizations
export function CardImage({
  src,
  alt,
  aspectRatio = '16/9',
  className,
  containerClassName,
}: {
  src: string
  alt: string
  aspectRatio?: string
  className?: string
  containerClassName?: string
}) {
  return (
    <div 
      className={cn('relative overflow-hidden rounded-lg', containerClassName)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={cn('object-cover', className)}
      />
    </div>
  )
}

// Thumbnail gallery component
export function ThumbnailGallery({
  images,
  className,
}: {
  images: Array<{ src: string; alt: string }>
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {images.map((image, index) => (
        <CardImage
          key={index}
          src={image.src}
          alt={image.alt}
          aspectRatio="1"
          containerClassName="hover:scale-105 transition-transform cursor-pointer"
        />
      ))}
    </div>
  )
}