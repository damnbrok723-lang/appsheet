import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "User", ...props }, ref) => {
    return (
      <div className={cn("relative h-10 w-10 overflow-hidden rounded-full", className)} ref={ref} {...props}>
        {src ? <img src={src} alt={alt} className="aspect-square h-full w-full" /> : <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground"><span className="text-xs">{alt.charAt(0).toUpperCase()}</span></div>}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, ...props }, ref) => {
    return <img className={cn("aspect-square h-full w-full", className)} ref={ref} {...props} />;
  }
);
AvatarImage.displayName = "AvatarImage";

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground", className)} ref={ref} {...props} />;
  }
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
