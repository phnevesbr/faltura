import React, { forwardRef } from 'react';
import { useGestures, GestureConfig } from '../hooks/useGestures';
import { cn } from '../lib/utils';

interface GestureWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  gestureConfig: GestureConfig;
  children: React.ReactNode;
  swipeLeftContent?: React.ReactNode;
  swipeRightContent?: React.ReactNode;
}

export const GestureWrapper = forwardRef<HTMLDivElement, GestureWrapperProps>(
  ({ gestureConfig, children, swipeLeftContent, swipeRightContent, className, ...props }, ref) => {
    const { gestureHandlers, gestureState } = useGestures(gestureConfig);

    return (
      <div 
        ref={ref}
        className={cn("relative touch-pan-y", className)}
        {...gestureHandlers}
        {...props}
      >
        {/* Swipe Left Background */}
        {swipeLeftContent && (
          <div className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity duration-200",
            gestureState.isSwipingLeft ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            {swipeLeftContent}
          </div>
        )}

        {/* Swipe Right Background */}
        {swipeRightContent && (
          <div className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-opacity duration-200",
            gestureState.isSwipingRight ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            {swipeRightContent}
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "relative z-10 transition-transform duration-200",
          gestureState.isSwipingLeft && "transform -translate-x-20",
          gestureState.isSwipingRight && "transform translate-x-20"
        )}>
          {children}
        </div>
      </div>
    );
  }
);

GestureWrapper.displayName = "GestureWrapper";