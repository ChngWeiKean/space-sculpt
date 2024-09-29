import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { IoMdArrowRoundBack } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import { closestCenter, closestCorners, DndContext } from '@dnd-kit/core';
import { Droppable } from '../../components/Droppable';
import { Draggable } from '../../components/Draggable';

const FloorPlanPersonalization = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { croppedImageUrl, width, length } = location.state || {};
  
    const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [furniturePositions, setFurniturePositions] = useState([]);

    useEffect(() => {
        if (width && length) {
            const gridRows = Math.ceil(length);
            const gridCols = Math.ceil(width);
            setGridSize({ rows: gridRows, cols: gridCols });
            console.log("Grid size set to", gridRows, "rows and", gridCols, "columns.");
        }
    }, [width, length]);

    const handleImageLoad = (event) => {
        const img = event.target;
        setImageDimensions({
            width: img.offsetWidth,
            height: img.offsetHeight,
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
    
        // If the draggable item is dropped in the same position, do nothing
        if (active.id === over.id) return;
    
        if (over) {
            // Log the image dimensions and grid size
            console.log('Image Dimensions:', imageDimensions);
            console.log('Grid Size:', gridSize);
    
            // Calculate grid cell dimensions
            const gridCellWidth = imageDimensions.width / gridSize.cols;
            const gridCellHeight = imageDimensions.height / gridSize.rows;
    
            console.log(`Grid Cell Width: ${gridCellWidth}, Grid Cell Height: ${gridCellHeight}`);
    
            // Determine the dropped grid cell from the over element's ID
            const overCellId = over.id; // This is the ID of the cell where the item is dropped
            const [row, col] = overCellId.split('-').slice(1).map(Number); // Extract row and column
    
            // Calculate new position in terms of pixels
            const newX = col + 0.5; // Set the x position to the pixel value based on column index
            const newY = row; // Set the y position to the pixel value based on row index
    
            console.log(`Furniture ${active.id} placed at pixel position (${newX}, ${newY})`);
    
            // Update the furniture positions
            setFurniturePositions((prev) => {
                const existingFurniture = prev.find(f => f.id === active.id);
                if (existingFurniture) {
                    return prev.map(f => 
                        f.id === active.id ? { ...f, x: newX, y: newY } : f
                    );
                }
                return [
                    ...prev,
                    { id: active.id, x: newX, y: newY }, 
                ];
            });
        }
    };

    if (!croppedImageUrl) {
        return (
            <Box textAlign="center" p={6}>
                <Heading as="h3" size="lg">No floor plan data available.</Heading>
                <Button mt={4} colorScheme="blue" onClick={() => navigate('/')}>Go Back</Button>
            </Box>
        );
    }

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <Flex direction="row" w="full" h="100vh" overflow="hidden" bg="gray.50">
                <Box 
                    w="20%" 
                    h="full" 
                    p={4} 
                    boxShadow="lg"
                    display="flex" 
                    flexDirection="column" 
                    justifyContent="flex-start"
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)', 
                        backdropFilter: 'blur(10px)',
                        backgroundImage: 'linear-gradient(68.6deg, rgb(252, 165, 241) 1.8%, rgb(181, 255, 255) 100.5%)',
                        backgroundSize: '400% 400%',
                        animation: 'gradient 15s ease infinite'
                    }}
                >
                    <Flex w="full" gap={3} alignItems="center" justifyContent="center">
                        <IoMdArrowRoundBack size="30px" onClick={() => window.history.back()} />
                        <Text fontSize="lg" fontWeight="700">Back</Text>
                    </Flex>
                    
                    <Draggable id="1"> <Image src="src/processing/danderyd_oak_veneer-top.png" alt="Furniture 1" w="50px" h="auto" zIndex={33}/> </Draggable>
                    <Draggable id="2"> <Image src="src/processing/danderyd_black-top.png" alt="Furniture 2" w="50px" h="auto" zIndex={33}/> </Draggable>
                </Box>

                <Flex 
                    flex={1} 
                    justifyContent="center" 
                    alignItems="center" 
                    p={6} 
                    overflow="hidden"
                >
                    <Box
                        position="relative"
                        maxW="100%"
                        maxH="100%"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Image
                            src={croppedImageUrl}
                            alt="Floor Plan"
                            w="100%"
                            h="100%"
                            objectFit="contain"
                            onLoad={handleImageLoad}
                        />

                        {imageDimensions.width && imageDimensions.height && (
                            <Box
                                position="absolute"
                                top={0}
                                left={0}
                                width={`${imageDimensions.width}px`}
                                height={`${imageDimensions.height}px`}
                                display="grid"
                                border="1px solid rgba(0, 0, 0, 0.2)"
                                gridTemplateRows={`repeat(${gridSize.rows}, 1fr)`}
                                gridTemplateColumns={`repeat(${gridSize.cols}, 1fr)`}
                                pointerEvents="none" 
                            >
                                {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, index) => {
                                    const row = Math.floor(index / gridSize.cols);
                                    const col = index % gridSize.cols;

                                    // Create a unique ID for each grid cell
                                    const cellId = `cell-${row}-${col}`;

                                    // Calculate the width and height of each cell
                                    const cellWidth = imageDimensions.width / gridSize.cols;
                                    const cellHeight = imageDimensions.height / gridSize.rows;

                                    return (
                                        <Droppable key={cellId} id={cellId} cellWidth={cellWidth} cellHeight={cellHeight}>
                                            <Box
                                                bg="transparent"
                                                position="relative"
                                                zIndex={99}
                                            >
                                            </Box>
                                        </Droppable>
                                    );
                                })}
                            </Box>
                        )}

                        {furniturePositions.map((furniture) => (
                            <Box
                                key={furniture.id}
                                position="absolute"
                                left={`${(furniture.x / gridSize.cols) * 100}%`}
                                top={`${(furniture.y / gridSize.rows) * 100}%`}
                                transform="translate(-50%, -50%)"
                                w="50px"
                                h="50px"
                            >
                                <Image 
                                    src={`src/processing/danderyd_oak_veneer-top.png`} 
                                    alt={`Furniture ${furniture.id}`} 
                                    objectFit="contain" 
                                    boxSize="100%"
                                />
                            </Box>
                        ))}
                    </Box>
                </Flex>
            </Flex>
        </DndContext>
    );
};

export default FloorPlanPersonalization;