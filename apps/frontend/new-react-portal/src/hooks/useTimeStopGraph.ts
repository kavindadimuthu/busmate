/**
 * TimeStopGraph Custom Hooks
 * 
 * Contains reusable hooks for the Time-Stop Graph visualization.
 * These hooks encapsulate the stateful logic for pan/zoom, tooltips, and schedule visibility.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
    TransformState, 
    TooltipData, 
    Point,
    DEFAULT_TRANSFORM, 
    DEFAULT_TOOLTIP,
    ZOOM_CONSTRAINTS,
} from '@/services/timeStopGraph';

// ============================================================================
// Pan and Zoom Hook
// ============================================================================

export interface UsePanZoomOptions {
    initialTransform?: TransformState;
    minScale?: number;
    maxScale?: number;
}

export interface UsePanZoomReturn {
    transform: TransformState;
    isPanning: boolean;
    svgRef: React.RefObject<SVGSVGElement | null>;
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleMouseLeave: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleResetView: () => void;
}

/**
 * Hook for handling pan and zoom interactions on an SVG element
 */
export function usePanZoom(options: UsePanZoomOptions = {}): UsePanZoomReturn {
    const {
        initialTransform = DEFAULT_TRANSFORM,
        minScale = ZOOM_CONSTRAINTS.min,
        maxScale = ZOOM_CONSTRAINTS.max,
    } = options;

    const [transform, setTransform] = useState<TransformState>(initialTransform);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Mouse event handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    }, [transform]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            }));
        }
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Wheel event handler for zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(maxScale, Math.max(minScale, transform.scale * delta));
        
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
            const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
            
            setTransform({ x: newX, y: newY, scale: newScale });
        }
    }, [transform, minScale, maxScale]);

    // Add non-passive wheel event listener
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        svg.addEventListener('wheel', handleWheel, { passive: false });
        return () => svg.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setTransform(prev => ({
            ...prev,
            scale: Math.min(maxScale, prev.scale * ZOOM_CONSTRAINTS.step),
        }));
    }, [maxScale]);

    const handleZoomOut = useCallback(() => {
        setTransform(prev => ({
            ...prev,
            scale: Math.max(minScale, prev.scale / ZOOM_CONSTRAINTS.step),
        }));
    }, [minScale]);

    const handleResetView = useCallback(() => {
        setTransform(DEFAULT_TRANSFORM);
    }, []);

    return {
        transform,
        isPanning,
        svgRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
        handleZoomIn,
        handleZoomOut,
        handleResetView,
    };
}

// ============================================================================
// Tooltip Hook
// ============================================================================

export interface UseTooltipReturn {
    tooltip: TooltipData;
    handlePointMouseEnter: (point: Point, color: string, e: React.MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => void;
    handlePointMouseLeave: () => void;
    hideTooltip: () => void;
}

/**
 * Hook for handling tooltip state and interactions
 */
export function useTooltip(): UseTooltipReturn {
    const [tooltip, setTooltip] = useState<TooltipData>(DEFAULT_TOOLTIP);

    const handlePointMouseEnter = useCallback((
        point: Point, 
        color: string, 
        e: React.MouseEvent,
        containerRef: React.RefObject<HTMLDivElement | null>
    ) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setTooltip({
                visible: true,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                stopName: point.stopName,
                time: point.time,
                scheduleName: point.scheduleName,
                color,
            });
        }
    }, []);

    const handlePointMouseLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    return {
        tooltip,
        handlePointMouseEnter,
        handlePointMouseLeave,
        hideTooltip,
    };
}

// ============================================================================
// Schedule Visibility Hook
// ============================================================================

export interface UseScheduleVisibilityReturn {
    visibleSchedules: Set<number>;
    toggleScheduleVisibility: (index: number) => void;
    showAllSchedules: () => void;
    hideAllSchedules: () => void;
    isScheduleVisible: (index: number) => boolean;
}

/**
 * Hook for managing schedule visibility state
 */
export function useScheduleVisibility(scheduleCount: number): UseScheduleVisibilityReturn {
    const [visibleSchedules, setVisibleSchedules] = useState<Set<number>>(new Set());

    // Initialize visible schedules when schedule count changes
    useEffect(() => {
        setVisibleSchedules(new Set(Array.from({ length: scheduleCount }, (_, i) => i)));
    }, [scheduleCount]);

    const toggleScheduleVisibility = useCallback((index: number) => {
        setVisibleSchedules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }, []);

    const showAllSchedules = useCallback(() => {
        setVisibleSchedules(new Set(Array.from({ length: scheduleCount }, (_, i) => i)));
    }, [scheduleCount]);

    const hideAllSchedules = useCallback(() => {
        setVisibleSchedules(new Set());
    }, []);

    const isScheduleVisible = useCallback((index: number) => {
        return visibleSchedules.has(index);
    }, [visibleSchedules]);

    return {
        visibleSchedules,
        toggleScheduleVisibility,
        showAllSchedules,
        hideAllSchedules,
        isScheduleVisible,
    };
}

// ============================================================================
// Container Size Hook
// ============================================================================

export interface UseContainerSizeOptions {
    minWidth?: number;
    minHeight?: number;
    maxHeight?: number;
}

export interface UseContainerSizeReturn {
    containerRef: React.RefObject<HTMLDivElement | null>;
    containerSize: { width: number; height: number };
}

/**
 * Hook for tracking container size with ResizeObserver
 */
export function useContainerSize(options: UseContainerSizeOptions = {}): UseContainerSizeReturn {
    const {
        minWidth = 600,
        minHeight = 400,
        maxHeight = 700,
    } = options;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({
                    width: Math.max(minWidth, width),
                    height: Math.max(minHeight, Math.min(height, maxHeight)),
                });
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [minWidth, minHeight, maxHeight]);

    return {
        containerRef,
        containerSize,
    };
}
