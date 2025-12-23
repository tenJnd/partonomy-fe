import {useCallback, useEffect, useState} from "react";

export function useZoomPan(args: { hasImage: boolean }) {
    const {hasImage} = args;

    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [dragStart, setDragStart] = useState({x: 0, y: 0});

    const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 25, 500)), []);
    const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 25, 25)), []);

    const handleResetZoom = useCallback(() => {
        setZoom(100);
        setPosition({x: 0, y: 0});
    }, []);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => !prev);
        setZoom(100);
        setPosition({x: 0, y: 0});
    }, []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (zoom > 100) {
                e.preventDefault();
                setIsDragging(true);
                setDragStart({x: e.clientX - position.x, y: e.clientY - position.y});
            }
        },
        [zoom, position.x, position.y]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isDragging && zoom > 100) {
                setPosition({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y});
            }
        },
        [isDragging, zoom, dragStart.x, dragStart.y]
    );

    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleMouseLeave = useCallback(() => setIsDragging(false), []);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (!hasImage) return;
            e.preventDefault();
            if (e.deltaY < 0) setZoom((prev) => Math.min(prev + 10, 400));
            else setZoom((prev) => Math.max(prev - 10, 25));
        },
        [hasImage]
    );

    useEffect(() => {
        if (zoom <= 100) setPosition({x: 0, y: 0});
    }, [zoom]);

    return {
        zoom,
        setZoom,
        isFullscreen,
        isDragging,
        position,

        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        toggleFullscreen,

        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
        handleWheel,
    };
}
