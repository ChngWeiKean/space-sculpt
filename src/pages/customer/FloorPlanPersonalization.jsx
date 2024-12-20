import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
    Box, 
    Button, 
    Flex, 
    Heading, 
    Image, 
    Text,
    Grid,
    IconButton,
    Tooltip,
    Input,
    Tabs,
    TabList,
    TabPanels,
    TabPanel,
    Tab,
    TabIndicator,
    InputGroup,
    InputLeftElement,
    useDisclosure,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    ModalCloseButton,
    ModalFooter,
    Select,
    FormControl,
    FormLabel,
    InputLeftAddon,
    useToast,
} from '@chakra-ui/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IoMdArrowRoundBack, IoIosHeart, IoIosHeartEmpty } from "react-icons/io";
import { IoTrashOutline } from "react-icons/io5";
import { AiOutlineExport } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import { db } from "../../../api/firebase";
import { useAuth } from "../../components/AuthCtx.jsx";
import { Droppable } from '../../components/Droppable';
import { onValue, ref, get } from "firebase/database";
import { FaArrowRotateLeft, FaArrowRotateRight } from "react-icons/fa6";
import { PiStarFourLight } from "react-icons/pi";
import { BiSearchAlt2 } from "react-icons/bi";
import { CiFilter } from "react-icons/ci";
import { toPng } from 'html-to-image';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { MultiSelect } from "../../components/MultiSelect.jsx";

const FloorPlanPersonalization = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const croppedImageUrl = localStorage.getItem('croppedImageUrl');
    const width = localStorage.getItem('width');
    const length = localStorage.getItem('length');
    const rooms = JSON.parse(localStorage.getItem('rooms'));
    const walls = JSON.parse(localStorage.getItem('walls'));
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const [ isLoading, setIsLoading ] = useState(false);
    const [ gridSize, setGridSize ] = useState({ rows: 0, cols: 0 });
    const [ imageDimensions, setImageDimensions ] = useState({ width: 0, height: 0 });
    const [ furniturePositions, setFurniturePositions ] = useState([]);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ currentPosition, setCurrentPosition ] = useState({ x: 0, y: 0 });
    const [ draggedItem, setDraggedItem ] = useState(null);
    const [ hoveredItem, setHoveredItem ] = useState(null);
    const { isOpen: isOpenFilterModal, onOpen: onOpenFilterModal, onClose: onCloseFilterModal } = useDisclosure();
    const { isOpen: isOpenPreferenceModal, onOpen: onOpenPreferenceModal, onClose: onClosePreferenceModal } = useDisclosure();
    const [ searchFurnitureQuery, setSearchFurnitureQuery ] = useState('');
    const [ searchFurniturePriceQuery, setSearchFurniturePriceQuery ] = useState('');
    const [ searchFurnitureMaterialQuery, setSearchFurnitureMaterialQuery ] = useState('');
    const [ searchFurnitureColorQuery, setSearchFurnitureColorQuery ] = useState('');
    const [ filterByFavourites, setFilterByFavourites ] = useState(false);
    const [ materialFilters, setMaterialFilters ] = useState([]);
    const [ colorFilters, setColorFilters ] = useState([]);
    const [ budget, setBudget] = useState(0);
    const [ selectedMaterials, setSelectedMaterials ] = useState([]);
    const [ selectedStyles, setSelectedStyles ] = useState([]);
    const [ selectedPalette, setSelectedPalette ] = useState([]);
    const [ selectedRoomType, setSelectedRoomType ] = useState('');
    const [ categories, setCategories ] = useState([]);
    const [ overlappingCells, setOverlappingCells ] = useState([]);
    const [ recommendations, setRecommendations ] = useState([]);
    const [ selectedTags, setSelectedTags ] = useState([]);
    const priceRangeFilter = {
        "0-199": { min: 0, max: 199 },
        "200-399": { min: 200, max: 399 },
        "400-599": { min: 400, max: 599 },
        "600-799": { min: 600, max: 799 },
        "800+": { min: 800, max: 999999 }
    }
    const tagOptions = [
        "Bedroom", "Living Room", "Dining Room", "Kitchen", "Bathroom",
        "Outdoor", "Indoor", "Office", "Study", "Library",
        "Sustainable", "Ergonomic", "Compact", "Convertible", "Durable", "Eco-Friendly", "Foldable", 
        "Luxury", "Pet-Friendly", "Kid-Friendly", "Space-Saving", "Lightweight", 
        "Heavy-Duty", "Waterproof", "Fireproof", "Stain-Resistant", "UV-Resistant",
        "Recycled Materials", "Easy to Assemble", "Scratch-Resistant"
    ];
    const styleOptions = [
        "Modern", "Rustic", "Minimalist", "Vintage", "Scandinavian", "Industrial", 
        "Mid-Century Modern", "Contemporary", "Traditional", "Bohemian", "Victorian"
    ]
    const imageRef = useRef(null);
    const sidebarRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (width && length) {
            const gridRows = Math.ceil(length);
            const gridCols = Math.ceil(width);
            setGridSize({ rows: gridRows, cols: gridCols });
        }
    }, [width, length]);

    useEffect(() => {
        const fetchCategoriesAndFurniture = async () => {
            const categoryRef = ref(db, 'categories');
            const furnitureByCategory = {};
        
            onValue(categoryRef, async (categorySnapshot) => {
                const categoryPromises = [];
                const materials = [];
                const colors = [];
        
                categorySnapshot.forEach((categoryChildSnapshot) => {
                const categoryData = {
                    id: categoryChildSnapshot.key,
                    ...categoryChildSnapshot.val(),
                };

                furnitureByCategory[categoryData.id] = { ...categoryData, furniture: [] };
        
                if (categoryData.subcategories) {
                    const subcategoryPromises = categoryData.subcategories.map(async (subcategoryId) => {
                    const subcategoryRef = ref(db, `subcategories/${subcategoryId}`);
                    const subcategorySnapshot = await get(subcategoryRef);
        
                    if (subcategorySnapshot.exists()) {
                        const subcategoryData = subcategorySnapshot.val();
        
                        if (subcategoryData.furniture) {
                        const furniturePromises = subcategoryData.furniture.map(async (furnitureId) => {
                            const furnitureRef = ref(db, `furniture/${furnitureId}`);
                            const furnitureSnapshot = await get(furnitureRef);
        
                            if (furnitureSnapshot.exists()) {
                                const furnitureData = {
                                    id: furnitureSnapshot.key,
                                    ...furnitureSnapshot.val(),
                                    subcategoryName: subcategoryData.name,
                                };
                                if (!materials.includes(furnitureSnapshot.val().material)) {
                                    materials.push(furnitureSnapshot.val().material);
                                }
                                Object.values(furnitureSnapshot.val().variants).forEach((variant) => {
                                    const trimmedColor = variant.color.trim();
                                    if (!colors.includes(trimmedColor)) {
                                        colors.push(trimmedColor);
                                    }
                                });
                                furnitureByCategory[categoryData.id].furniture.push(furnitureData);
                            }
                        });
        
                        await Promise.all(furniturePromises);
                        }
                    }
                    });
        
                    categoryPromises.push(Promise.all(subcategoryPromises));
                }
                });
                await Promise.all(categoryPromises);
                setCategories(Object.values(furnitureByCategory));
                setMaterialFilters(materials);
                setColorFilters(colors);
            });
        };
      
        fetchCategoriesAndFurniture();
    }, []);

    const handleImageLoad = (event) => {
        const img = event.target;
        setImageDimensions({
            width: img.offsetWidth,
            height: img.offsetHeight,
        });
    };

    // const drawWalls = (canvasRef) => {
    //     const canvas = canvasRef.current;
    //     const canvasBoundingRect = canvas.getBoundingClientRect(); // Get the canvas's bounding box
    //     const image = imageRef.current.getBoundingClientRect(); // Get the image's bounding box
        
    //     if (canvas && image) {
    //         const context = canvas.getContext('2d');
    //         context.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas for redrawing
    //         context.strokeStyle = 'red'; // Color of the walls
    //         context.lineWidth = 2; // Thickness of the lines
    
    //         walls.forEach(wall => {
    //             // Calculate start and end points for each wall
    //             const startX = wall.x;  // Wall's x-coordinate relative to the image's left edge
    //             const startY = wall.y;   // Wall's y-coordinate relative to the image's top edge
    
    //             // Depending on the wall's dimensions (vertical/horizontal), calculate the end points
    //             const endX = wall.width > 0 ? startX + wall.width : startX;
    //             const endY = wall.height > 0 ? startY + wall.height : startY;
    
    //             // Draw the wall line on the canvas
    //             context.beginPath();
    //             context.moveTo(startX, startY);
    //             context.lineTo(endX, endY);
    //             context.stroke();
    //             context.closePath();
    //         });
    //     }
    // };
    
    // useEffect(() => {
    //     if (canvasRef.current && imageRef.current && imageDimensions.width && imageDimensions.height) {
    //         drawWalls(canvasRef);
    //     }
    // }, [canvasRef, imageRef, imageDimensions]);

    const wallPositions = useMemo(() => {
        if (imageRef.current && imageDimensions.width && imageDimensions.height) {
            const wallCells = new Map();
        
            walls.forEach(wall => {
                const wallStartX = Math.floor((wall.x) / (imageDimensions.width / gridSize.cols));
                const wallEndX = Math.ceil(((wall.x) + wall.width) / (imageDimensions.width / gridSize.cols));
                const wallStartY = Math.floor((wall.y) / (imageDimensions.height / gridSize.rows));
                const wallEndY = Math.ceil(((wall.y) + wall.height) / (imageDimensions.height / gridSize.rows));
        
                for (let row = wallStartY; row < wallEndY; row++) {
                    for (let col = wallStartX; col < wallEndX; col++) {
                        const cellKey = `${row}-${col}`;
                        if (!wallCells.has(cellKey)) {
                            wallCells.set(cellKey, []);
                        }
                        wallCells.get(cellKey).push(wall);
                    }
                }
            });
        
            return wallCells;
        }
        
        return new Map();
    }, [walls, imageDimensions, gridSize, imageRef]);    

    const getRotatedCorners = (furniture) => {
        const { x, y, width, length, rotation } = furniture;

        const gridCellWidth = imageDimensions.width / gridSize.cols;
        const gridCellHeight = imageDimensions.height / gridSize.rows;

        const furnitureWidthInMeters = width / 100;
        const furnitureLengthInMeters = length / 100;

        const furnitureWidthInPixels = furnitureWidthInMeters * gridCellWidth;
        const furnitureLengthInPixels = furnitureLengthInMeters * gridCellHeight;
    
        // Half dimensions
        const halfWidth = furnitureWidthInPixels / 2;
        const halfLength = furnitureLengthInPixels / 2;
    
        // Unrotated corner points relative to the center (x, y)
        const corners = [
            { x: x - halfWidth, y: y - halfLength }, // top-left
            { x: x + halfWidth, y: y - halfLength }, // top-right
            { x: x + halfWidth, y: y + halfLength }, // bottom-right
            { x: x - halfWidth, y: y + halfLength }  // bottom-left
        ];
    
        // Rotation function (rotates around the center)
        const rotatePoint = (cx, cy, pointX, pointY, angle) => {
            const radians = (Math.PI / 180) * angle;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);
            const dx = pointX - cx;
            const dy = pointY - cy;
    
            return {
                x: cos * dx - sin * dy + cx,
                y: sin * dx + cos * dy + cy
            };
        };
    
        const rotatedCorners = corners.map(corner => rotatePoint(x, y, corner.x, corner.y, rotation));
        return rotatedCorners;
    };
    
    const isColliding = (furnitureCorners, otherCorners) => {
        return furnitureCorners.some(corner => 
            cornerInsidePolygon(corner, otherCorners)
        );
    };
    
    // Helper function to check if a point is inside a polygon (furniture area)
    const cornerInsidePolygon = (point, polygonCorners) => {
        let isInside = false;
        let j = polygonCorners.length - 1;
        for (let i = 0; i < polygonCorners.length; j = i++) {
            const xi = polygonCorners[i].x, yi = polygonCorners[i].y;
            const xj = polygonCorners[j].x, yj = polygonCorners[j].y;
    
            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x <= (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) isInside = !isInside;
        }
        return isInside;
    };

    const isCollidingWalls = (furnitureCorners, wallCorners) => {
        const [fLeft, fRight] = [Math.min(...furnitureCorners.map(c => c.x)), Math.max(...furnitureCorners.map(c => c.x))];
        const [fTop, fBottom] = [Math.min(...furnitureCorners.map(c => c.y)), Math.max(...furnitureCorners.map(c => c.y))];
        
        const [wLeft, wRight] = [Math.min(...wallCorners.map(c => c.x)), Math.max(...wallCorners.map(c => c.x))];
        const [wTop, wBottom] = [Math.min(...wallCorners.map(c => c.y)), Math.max(...wallCorners.map(c => c.y))];
        
        // Check if rectangles overlap
        return !(fRight < wLeft || 
                 fLeft > wRight || 
                 fBottom < wTop || 
                 fTop > wBottom);
    };
    
    const checkForOverlapping = (draggedItemId, newPositions) => {
        const imageBoundingRect = imageRef.current.getBoundingClientRect();
        
        const mouseX = currentPosition.x - imageBoundingRect.left;
        const mouseY = currentPosition.y - imageBoundingRect.top;
    
        let draggedFurniturePosition = furniturePositions.find(furniture => furniture.variantId === draggedItemId);
    
        if (!draggedFurniturePosition) {
            const draggedFurniture = categories
                .flatMap(category => category.furniture)
                .find(furnitureItem => 
                    Object.entries(furnitureItem.variants).some(([variantId]) => variantId === draggedItemId.split('|')[0]) // Extract variantId
                );
    
            if (draggedFurniture) {
                draggedFurniturePosition = {
                    id: draggedItemId,
                    variantId: draggedItemId.split('|')[0], // Extract variantId
                    x: mouseX,
                    y: mouseY,
                    image: draggedFurniture.variants[draggedItemId.split('|')[0]].icon, // Use the extracted variantId
                    width: draggedFurniture.width,
                    length: draggedFurniture.length,
                    rotation: 0,
                };
            }
        }
    
        if (!draggedFurniturePosition) return false; // If the dragged furniture position is still undefined, exit
    
        const furnitureWidthInPixels = (draggedFurniturePosition.width / 100) * (imageDimensions.width / gridSize.cols);
        const furnitureLengthInPixels = (draggedFurniturePosition.length / 100) * (imageDimensions.height / gridSize.rows);
    
        const newDraggedCorners = calculateCornersFromMouse(
            mouseX, 
            mouseY, 
            furnitureWidthInPixels, 
            furnitureLengthInPixels, 
            draggedFurniturePosition.rotation
        );
    
        // Check if new dragged corners overlap with existing furniture corners
        return furniturePositions.some(furniture => {
            if (furniture.id !== draggedItemId) {
                const otherCorners = getRotatedCorners(furniture);
                return isColliding(newDraggedCorners, otherCorners);
            }
            return false;
        });
    };

    const calculateCornersFromMouse = (mouseX, mouseY, widthInPixels, lengthInPixels, rotation) => {
        // Calculate the top-left corner based on mouse position
        const topLeftX = mouseX - widthInPixels / 2;
        const topLeftY = mouseY - lengthInPixels / 2;
    
        // Calculate the corners of the unrotated furniture based on its size
        const corners = [
            { x: topLeftX, y: topLeftY },                   // top-left
            { x: topLeftX + widthInPixels, y: topLeftY },   // top-right
            { x: topLeftX, y: topLeftY + lengthInPixels },  // bottom-left
            { x: topLeftX + widthInPixels, y: topLeftY + lengthInPixels } // bottom-right
        ];
    
        // Rotation function (rotates around the center)
        const rotatePoint = (cx, cy, pointX, pointY, angle) => {
            const radians = (Math.PI / 180) * angle;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);
            const dx = pointX - cx;
            const dy = pointY - cy;
    
            return {
                x: cos * dx - sin * dy + cx,
                y: sin * dx + cos * dy + cy
            };
        };
    
        // Calculate center for rotation
        const centerX = mouseX;
        const centerY = mouseY;
    
        // Apply rotation to each corner around the center point
        const rotatedCorners = corners.map(corner => rotatePoint(centerX, centerY, corner.x, corner.y, rotation));
    
        return rotatedCorners;
    };

    const handleDrop = () => {
        if (isDragging && draggedItem) {
            console.log('Dropped item:', draggedItem);
    
            const cellWidth = imageDimensions.width / gridSize.cols;
            const cellHeight = imageDimensions.height / gridSize.rows;
    
            const imageBoundingRect = imageRef.current.getBoundingClientRect();
            const mouseX = currentPosition.x - imageBoundingRect.left;
            const mouseY = currentPosition.y - imageBoundingRect.top;
    
            // Extract the variantId from the draggedItem string
            const variantId = draggedItem.split('|')[0]; 
    
            // Find the dragged furniture variant details
            const draggedFurniture = categories
                .flatMap(category => category.furniture)
                .find(furnitureItem => 
                    Object.entries(furnitureItem.variants).some(([vId]) => vId === variantId)
                );
    
            console.log('Dropped Furniture:', draggedFurniture);
    
            if (!draggedFurniture) return; 
    
            const { width, length } = draggedFurniture;
    
            // Generate a unique ID for each new furniture copy using draggedItem
            const newId = draggedItem; 
    
            let draggedFurniturePosition = furniturePositions.find(furniture => furniture.id === newId);
    
            // Update if exists, otherwise create new position
            if (!draggedFurniturePosition) {
                console.log('Creating new furniture position...');
                draggedFurniturePosition = {
                    id: newId,  
                    variantId: variantId,  
                    x: mouseX,
                    y: mouseY,
                    image: draggedFurniture.variants[variantId].icon, 
                    width: draggedFurniture.width,
                    length: draggedFurniture.length,
                    rotation: 0,
                };
            }
    
            const furnitureWidthInPixels = (width / 100) * cellWidth;
            const furnitureLengthInPixels = (length / 100) * cellHeight;
    
            const rotatedWidthInPixels = (draggedFurniturePosition.rotation === 90 || draggedFurniturePosition.rotation === 270) ? furnitureLengthInPixels : furnitureWidthInPixels;
            const rotatedLengthInPixels = (draggedFurniturePosition.rotation === 90 || draggedFurniturePosition.rotation === 270) ? furnitureWidthInPixels : furnitureLengthInPixels;
    
            let startGridX = Math.floor(mouseX / cellWidth);
            let startGridY = Math.floor(mouseY / cellHeight);
    
            const widthInGridCells = Math.ceil(rotatedWidthInPixels / cellWidth);
            const lengthInGridCells = Math.ceil(rotatedLengthInPixels / cellHeight);
    
            if (startGridX < 0) startGridX = 0;
            if (startGridY < 0) startGridY = 0;
    
            if (startGridX + widthInGridCells > gridSize.cols) {
                startGridX = gridSize.cols - widthInGridCells;
            }
    
            if (startGridY + lengthInGridCells > gridSize.rows) {
                startGridY = gridSize.rows - lengthInGridCells;
            }
    
            let newPositions = [];
    
            for (let i = 0; i < lengthInGridCells; i++) {
                for (let j = 0; j < widthInGridCells; j++) {
                    const targetRow = startGridY + i;
                    const targetCol = startGridX + j;
    
                    if (targetRow >= 0 && targetRow < gridSize.rows && targetCol >= 0 && targetCol < gridSize.cols) {
                        newPositions.push({ row: targetRow, col: targetCol });
                    }
                }
            }

            const newDraggedCorners = calculateCornersFromMouse(mouseX, mouseY, furnitureWidthInPixels, furnitureLengthInPixels, draggedFurniturePosition.rotation);
    
            const isOverlappingWithWalls = Array.from(wallPositions.values()).some(wallsInCell => {
                return wallsInCell.some(wall => {
                    const wallCorners = [
                        { x: wall.x, y: wall.y },
                        { x: wall.x + wall.width, y: wall.y },
                        { x: wall.x + wall.width, y: wall.y + wall.height },
                        { x: wall.x, y: wall.y + wall.height }
                    ];
                    return isCollidingWalls(newDraggedCorners, wallCorners);
                });
            });

            if (isOverlappingWithWalls) {
                console.log('Overlapping with walls, cannot place furniture.');
                return;
            }
    
            const isOverlapping = furniturePositions.some(furniture => {
                if (furniture.id !== newId) {  
                    const otherCorners = getRotatedCorners(furniture);
                    return isColliding(newDraggedCorners, otherCorners);
                }
                return false;
            });
    
            if (isOverlapping) {
                return;
            }
    
            setFurniturePositions((prev) => {
                const updatedPositions = prev.map(furniture => 
                    furniture.id === newId 
                        ? { ...furniture, x: mouseX, y: mouseY, positions: newPositions }  // Update if exists
                        : furniture
                );
                
                // If it’s a new furniture position, add it to the array
                if (!prev.some(furniture => furniture.id === newId)) {
                    updatedPositions.push({
                        id: newId,  
                        x: mouseX,
                        y: mouseY,
                        variantId: variantId,  
                        image: draggedFurniture.variants[variantId].icon, 
                        width: draggedFurniture.width,
                        length: draggedFurniture.length,
                        positions: newPositions,
                        rotation: 0,
                    });
                }
    
                return updatedPositions;
            });
        }
    };
    
    const handleHover = (cellId) => {
        const [row, col] = cellId.split('-').slice(1).map(Number);
    
        const cellWidth = imageDimensions.width / gridSize.cols;
        const cellHeight = imageDimensions.height / gridSize.rows;
    
        const draggedFurniture = categories
            .flatMap(category => category.furniture)
            .find(furnitureItem =>
                Object.entries(furnitureItem.variants).some(([variantId]) => variantId === draggedItem.split('|')[0])
            );
    
        if (draggedFurniture) {
            const furnitureWidthInPixels = (draggedFurniture.width / 100) * cellWidth;
            const furnitureLengthInPixels = (draggedFurniture.length / 100) * cellHeight;
    
            const widthInGridCells = Math.ceil(furnitureWidthInPixels / cellWidth);
            const lengthInGridCells = Math.ceil(furnitureLengthInPixels / cellHeight);
    
            let newPositions = [];
    
            for (let i = 0; i < lengthInGridCells; i++) {
                for (let j = 0; j < widthInGridCells; j++) {
                    const targetRow = row + i;
                    const targetCol = col + j;
    
                    if (targetRow >= 0 && targetRow < gridSize.rows && targetCol >= 0 && targetCol < gridSize.cols) {
                        newPositions.push({ row: targetRow, col: targetCol });
                    }
                }
            }
    
            // Calculate the corners of the dragged furniture
            const newDraggedCorners = calculateCornersFromMouse(
                currentPosition.x - imageRef.current.getBoundingClientRect().left,
                currentPosition.y - imageRef.current.getBoundingClientRect().top,
                furnitureWidthInPixels,
                furnitureLengthInPixels,
                0
            );
    
            // Check for collisions with walls
            const isOverlappingWithWalls = Array.from(wallPositions.values()).some(wallsInCell => {
                return wallsInCell.some(wall => {
                    const wallCorners = [
                        { x: wall.x, y: wall.y },
                        { x: wall.x + wall.width, y: wall.y },
                        { x: wall.x + wall.width, y: wall.y + wall.height },
                        { x: wall.x, y: wall.y + wall.height }
                    ];
                    return isCollidingWalls(newDraggedCorners, wallCorners);
                });
            });
    
            // Generate a unique ID for this instance of the furniture
            const newId = draggedItem; 
    
            // Check for overlaps against existing furniture
            const isOverlapping = checkForOverlapping(newId, newPositions);
    
            if (isOverlapping || isOverlappingWithWalls) {
                setOverlappingCells(newPositions);
            } else {
                setOverlappingCells([]);
            }
        }
    };

    const handleRotate = (id, direction) => {
        setFurniturePositions((prevPositions) =>
            prevPositions.map((furniture) =>
                furniture.id === id
                    ? {
                        ...furniture,
                        rotation: direction === 'left'
                            ? (furniture.rotation || 0) - 15 // Rotate 15 degrees left
                            : (furniture.rotation || 0) + 15 // Rotate 15 degrees right
                    }
                    : furniture
            )
        );

        console.log('Rotated furniture', id);
        console.log('Furniture positions', furniturePositions);
    };

    if (!croppedImageUrl) {
        return (
            <Box textAlign="center" p={6}>
                <Heading as="h3" size="lg">No floor plan data available.</Heading>
                <Button mt={4} colorScheme="blue" onClick={() => navigate('/')}>Go Back</Button>
            </Box>
        );
    }

    const handleExportToPNG = () => {
        const container = document.querySelector('#floor-plan');
        if (!container) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    
        toPng(container)
            .then((pngDataUrl) => {
                const downloadLink = document.createElement("a");
                downloadLink.href = pngDataUrl;
                downloadLink.download = "floor-plan.png";
                console.log('Download link', downloadLink);
                downloadLink.click();
            })
            .catch((error) => {
                console.error('Error exporting canvas to PNG:', error);
            });
    };

    const toast = useToast();

    const handleSubmitPreferences = async () => {
        try {
            onClosePreferenceModal();
            setIsLoading(true);
    
            const preferences = {
                budget: budget,
                selectedStyles: selectedStyles,
                selectedMaterials: selectedMaterials,
                selectedRoomType: selectedRoomType,
                selectedPalette: selectedPalette,
                selectedTags: selectedTags
            };

            if (!preferences.budget && !preferences.selectedStyles.length && !preferences.selectedMaterials.length && !preferences.selectedRoomType && !preferences.selectedPalette.length && !preferences.selectedTags.length) {
                toast({
                    title: "No preferences selected!",
                    description: "Please select at least one preference to generate recommendations.",
                    status: "error",
                    duration: 3000,
                    position: "top",
                    isClosable: true,
                });
                setIsLoading(false);
                return;
            }
    
            const furnitureData = categories;
            furnitureData.forEach(category => {
                delete category.created_on;
                delete category.created_by;
                delete category.updated_by;
                delete category.updated_on;
                delete category.image;
                category.furniture.forEach(furniture => {
                    delete furniture.care_method;
                    delete furniture.cost;
                    delete furniture.favourites;
                    delete furniture.orders;
                    delete furniture.reviews;
                    delete furniture.subcategory;
                    delete furniture.updated_on;
                    delete furniture.updated_by;
                });
            });
            console.log("Furniture Data", furnitureData);
            console.log("Preferences", preferences);
    
            const prompt = `
                Based on the following preferences:
                - Budget: ${preferences.budget}
                - Preferred Styles: ${preferences.selectedStyles}
                - Preferred Materials: ${preferences.selectedMaterials}
                - Room Type: ${preferences.selectedRoomType}
                - Palette Preference: ${preferences.selectedPalette}
                - Tags: ${preferences.selectedTags}
            
                Recommend the best matching furniture from the available furniture data, following these rules:
                1. Recommend only items that match the user's preferred styles, budget, materials, and tags. If some preferences are not specified, prioritize the ones that are.
                2. For the selected room type, recommend furniture that fits this use case.
                3. If a color palette preference is specified, recommend furniture that has color hex codes close to the preferred palette. For accurate color matching:
                    - Calculate the color difference based on hex code similarity, and include only items with a close match.
                    - Include items with colors that match within a hex code distance threshold (e.g., a small color distance).
                    - Exclude any furniture items with variants that don't match the specified palette preferences closely enough.
                4. Ensure each recommendation includes the category, furniture name, price, style, material, and matching palette.
                5. If no perfect match exists, recommend the closest match.
                6. Return a valid JSON array of the recommended furniture in the same structure as the provided furnitureData.
                7. Exclude any furniture variants that do not match the specified preferences (styles, materials, color palettes, tags).
                8. Please ensure the response is in the correct format and follows the given structure of furnitureData.
                9. Return an array of categories, containing the recommended furniture items only.
                10. Return a valid JSON that can be parsed into JSON
            
                Furniture Data:
                ${JSON.stringify(furnitureData, null, 2)}
            `;
    
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: {"response_mime_type": "application/json"} });
            const result = await model.generateContent(prompt);
    
            const aiResponse = result.response.text();
            console.log("AI Response (raw):", aiResponse);

            try {
                const recommendations = JSON.parse(aiResponse);
                console.log("Recommendations", recommendations);
                setRecommendations(recommendations);
                toast({
                    title: "Check the recommendations tab!",
                    description: "Your furniture recommendations have been successfully generated.",
                    status: "success",
                    duration: 3000,
                    position: "top",
                    isClosable: true,
                });
                setIsLoading(false);                
            } catch (parseError) {
                console.error("Failed to parse AI response:", parseError);
                console.log("Cleaned Response:", aiResponse);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error generating recommendations:", error);
            setIsLoading(false);
        }
    };    

    return (
        <Grid templateRows="auto 1fr" w="100%" h="100%"  bg="gray.50" overflow="hidden">
            <Modal isOpen={isLoading} onClose={() => {}} size="md" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                        <DotLottieReact
                            src='src\assets\animations\gemini_loading_animation.lottie'
                            loop
                            autoplay
                        />
                        <Text
                            my={2}
                            fontSize="xl"
                            fontWeight="700"
                            style={{
                                background: 'linear-gradient(270deg, #FF007C, #590FB7, #00FF7F)',
                                backgroundSize: '400% 400%',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'gradient 2s ease infinite'
                            }}
                        >
                            Curating your preferences
                        </Text>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <style>
                {`
                    @keyframes gradient {
                        0% {
                            background-position: 0% 50%;
                        }
                        50% {
                            background-position: 100% 50%;
                        }
                        100% {
                            background-position: 0% 50%;
                        }
                    }
                `}
            </style>
            <Flex 
                direction="row" 
                w="full" 
                h="100vh" 
                overflow="hidden" 
                style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(6px)',
                    backgroundImage: 'radial-gradient(circle, rgba(255, 228, 225, 0.4) 0%, rgba(255, 228, 225, 0.4) 70%)',
                    backgroundSize: 'cover',
                }}
            >
                <Flex
                    w="25%"
                    h="full"
                    id="sidebar"
                    boxShadow="lg"
                    display="flex"
                    flexDirection="column"
                    justifyContent="flex-start"
                    style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(8px)',
                        backgroundImage: 'radial-gradient(circle, rgba(255, 182, 193, 0.5) 0%, rgba(255, 192, 203, 0.5) 25%, rgba(255, 240, 245, 0.5) 50%, rgba(255, 182, 193, 0.5) 75%)',
                        backgroundSize: '300% 300%',
                        animation: 'gradientShift 8s ease infinite',
                        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
                    }}
                    direction="column"
                    overflowX="hidden"
                    overflowY="auto"
                    sx={{
                        '&::-webkit-scrollbar': {
                            width: '7px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#092654',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                        },
                    }}
                >
                    <Tabs align='end' isFitted variant='unstyled'>
                        <TabList>
                            <Tab style={{ outline: 'none' }}>Furniture</Tab>
                            <Tab style={{ outline: 'none' }}>Recommendations</Tab>
                        </TabList>
                        <TabIndicator mt='-1.5px' height='2px' bg='blue.500' borderRadius='1px' />
                        <TabPanels>
                            <TabPanel>
                                <Flex w="full" px={2} pb={2} gap={3}>
                                    <Flex w="90%">
                                        <InputGroup>
                                            <InputLeftElement
                                                pointerEvents="none"
                                                children={<BiSearchAlt2 color="gray.300" />}
                                            />
                                            <Input
                                                placeholder="Search for furniture..."
                                                variant="flushed"
                                                size="md"
                                                border="2px black"
                                                focusBorderColor="blue.500"
                                                value={searchFurnitureQuery}
                                                onChange={(e) => setSearchFurnitureQuery(e.target.value)}
                                            />                                        
                                        </InputGroup>

                                    </Flex>
                                    <Flex w="10%" justifyContent="flex-end">
                                        <IconButton
                                            aria-label="Filter"
                                            icon={<CiFilter />}
                                            style={{ outline: 'none' }}
                                            size="sm"
                                            colorScheme="blue"
                                            onClick={onOpenFilterModal}
                                        />
                                    </Flex>
                                </Flex>

                                {imageDimensions && categories.map((category) => (
                                    <Flex
                                        key={category.id}
                                        flexDirection="column"
                                        justifyContent="flex-start"
                                        alignItems="flex-start"
                                        w="full"
                                        mb={4}
                                        overflow="hidden"
                                        p={2}
                                    >
                                        <Text fontSize="sm" fontWeight="500" mb={2} color={"gray.700"}>
                                            {category.name}
                                        </Text>

                                        <Grid templateColumns={`repeat(5, 1fr)`} gap={2}>
                                            {category.furniture
                                                .filter((furniture) => furniture.name.toLowerCase().includes(searchFurnitureQuery.toLowerCase()))
                                                .filter((furniture) => filterByFavourites ? user?.favourites?.includes(furniture.id) : true)
                                                .filter((furniture) => {
                                                    const price = Number(furniture.price);
                                                    const priceRange = priceRangeFilter[searchFurniturePriceQuery];
                                                    return priceRange ? price >= priceRange.min && price <= priceRange.max : true;
                                                })
                                                .filter((furniture) => searchFurnitureMaterialQuery === "" ? true : furniture.material === searchFurnitureMaterialQuery)
                                                .filter((furniture) =>
                                                    searchFurnitureColorQuery === "" ? true : Object.values(furniture.variants).some((variant) => variant.color === searchFurnitureColorQuery)
                                                )
                                                .map((furnitureItem) => {
                                                let gridCellWidth = imageDimensions.width / gridSize.cols;
                                                let gridCellHeight = imageDimensions.height / gridSize.rows;

                                                return Object.entries(furnitureItem.variants).map(([variantId, variant], index) => {
                                                    const furnitureWidthInPixels = (furnitureItem.width / 100) * gridCellWidth;
                                                    const furnitureLengthInPixels = (furnitureItem.length / 100) * gridCellHeight;

                                                    return (
                                                        <Flex key={variantId} direction="column" gap={1} alignItems="center">
                                                            <Box
                                                                w={`${furnitureWidthInPixels}px`}
                                                                h={`${furnitureLengthInPixels}px`}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    setIsDragging(true);
                                                                    const timestamp = Date.now();
                                                                    setDraggedItem(`${variantId}|${timestamp}`);
                                                                }}
                                                                onDrag={(e) => {
                                                                    if (isDragging && draggedItem) {
                                                                        const mouseX = e.clientX;
                                                                        const mouseY = e.clientY;
                                                                        setCurrentPosition({ x: mouseX, y: mouseY });
                                                                    }
                                                                }}
                                                                onDragEnd={(e) => {
                                                                    setIsDragging(false);
                                                                    setDraggedItem(null);
                                                                }}
                                                            >
                                                                <Image
                                                                    src={variant.icon}
                                                                    alt={`${furnitureItem.name} - Variant ${index + 1}`}
                                                                    objectFit="contain"
                                                                    boxSize="100%"
                                                                />
                                                            </Box>
                                                            <Flex direction="column">
                                                                <Text fontSize="xs" fontWeight="500" textAlign="center" textOverflow={"ellipsis"}>
                                                                    {furnitureItem.name}
                                                                </Text>
                                                                <Text fontSize="xs" fontWeight="500" textAlign="center" textOverflow={"ellipsis"} color={"gray.500"}>
                                                                    {variant.color}
                                                                </Text>
                                                            </Flex>
                                                        </Flex>
                                                    );
                                                });
                                            })}
                                        </Grid>
                                    </Flex>
                                ))}
                            </TabPanel>
                            <TabPanel>
                                {
                                    recommendations ? (
                                        recommendations?.categories?.map((recommendation) => (
                                            <Flex
                                                key={recommendation.id}
                                                flexDirection="column"
                                                justifyContent="flex-start"
                                                alignItems="flex-start"
                                                w="full"
                                                mb={4}
                                                overflow="hidden"
                                                p={2}
                                            >
                                                <Text fontSize="sm" fontWeight="500" mb={2} color={"gray.700"}>
                                                    {recommendation.name}
                                                </Text>
        
                                                <Grid templateColumns={`repeat(5, 1fr)`} gap={2}>
                                                    {recommendation.furniture
                                                        .map((furnitureItem) => {
                                                        let gridCellWidth = imageDimensions.width / gridSize.cols;
                                                        let gridCellHeight = imageDimensions.height / gridSize.rows;
        
                                                        return Object.entries(furnitureItem.variants).map(([variantId, variant], index) => {
                                                            const furnitureWidthInPixels = (furnitureItem.width / 100) * gridCellWidth;
                                                            const furnitureLengthInPixels = (furnitureItem.length / 100) * gridCellHeight;
        
                                                            return (
                                                                <Flex key={variantId} direction="column" gap={1} alignItems="center">
                                                                    <Box
                                                                        w={`${furnitureWidthInPixels}px`}
                                                                        h={`${furnitureLengthInPixels}px`}
                                                                        draggable
                                                                        onDragStart={(e) => {
                                                                            setIsDragging(true);
                                                                            const timestamp = Date.now();
                                                                            setDraggedItem(`${variantId}|${timestamp}`);
                                                                        }}
                                                                        onDrag={(e) => {
                                                                            if (isDragging && draggedItem) {
                                                                                const mouseX = e.clientX;
                                                                                const mouseY = e.clientY;
                                                                                setCurrentPosition({ x: mouseX, y: mouseY });
                                                                            }
                                                                        }}
                                                                        onDragEnd={(e) => {
                                                                            setIsDragging(false);
                                                                            setDraggedItem(null);
                                                                        }}
                                                                    >
                                                                        <Image
                                                                            src={variant.icon}
                                                                            alt={`${furnitureItem.name} - Variant ${index + 1}`}
                                                                            objectFit="contain"
                                                                            boxSize="100%"
                                                                        />
                                                                    </Box>
                                                                    <Flex direction="column">
                                                                        <Text fontSize="xs" fontWeight="500" textAlign="center" textOverflow={"ellipsis"}>
                                                                            {furnitureItem.name}
                                                                        </Text>
                                                                        <Text fontSize="xs" fontWeight="500" textAlign="center" textOverflow={"ellipsis"} color={"gray.500"}>
                                                                            {variant.color}
                                                                        </Text>
                                                                    </Flex>
                                                                </Flex>
                                                            );
                                                        });
                                                    })}
                                                </Grid>
                                            </Flex>
                                        ))
                                    ) : (
                                        <Text fontSize="sm" color="gray.500" textAlign="center">
                                            No recommendations available. Please set your preferences and submit to generate recommendations.
                                        </Text>
                                    )
                                }
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Flex>
                <Flex 
                    flex={1} 
                    justifyContent="center" 
                    alignItems="center" 
                    p={6} 
                    overflow="hidden"
                >
                    <Box
                        id="floor-plan"
                        position="relative"
                        maxW="100%"
                        maxH="100%"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Image ref={imageRef} src={croppedImageUrl} alt="Floor Plan" w="100%" h="100%" objectFit="contain" onLoad={handleImageLoad} />                   

                        {imageDimensions.width && imageDimensions.height && (
                            <Box
                                position="absolute"
                                top={0}
                                left={0}
                                width={`${imageDimensions.width}px`}
                                height={`${imageDimensions.height}px`}
                                display="grid"
                                gridTemplateRows={`repeat(${gridSize.rows}, 1fr)`}
                                gridTemplateColumns={`repeat(${gridSize.cols}, 1fr)`}
                                pointerEvents="none" 
                            >
                                {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, index) => {
                                    const row = Math.floor(index / gridSize.cols);
                                    const col = index % gridSize.cols;
                                    const cellWidth = imageDimensions.width / gridSize.cols;
                                    const cellHeight = imageDimensions.height / gridSize.rows;
                                    const cellId = `cell-${row}-${col}`;
                                    const isOverlapping = overlappingCells.some(cell => cell.row === row && cell.col === col);

                                    return (
                                        <Droppable key={cellId} id={cellId} cellWidth={cellWidth} cellHeight={cellHeight} onDrop={handleDrop} onHover={handleHover} isOverlapping={isOverlapping}>
                                            <Box
                                                bg="transparent"
                                                position="relative"
                                                zIndex={99}
                                                display="flex"
                                                justifyContent="center"
                                                alignItems="center"
                                                width={cellWidth}
                                                height={cellHeight}
                                                pointerEvents="none"
                                            >
                                            </Box>
                                        </Droppable>
                                    );
                                })}
                            </Box>
                        )}

                        <canvas 
                            ref={canvasRef} 
                            width={`${imageDimensions.width}px`}
                            height={`${imageDimensions.height}px`}
                            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                        />     

                        {furniturePositions.map((furniture) => {
                            const gridCellWidth = imageDimensions.width / gridSize.cols;
                            const gridCellHeight = imageDimensions.height / gridSize.rows;

                            const furnitureWidthInMeters = furniture.width / 100;
                            const furnitureLengthInMeters = furniture.length / 100;

                            const furnitureWidthInPixels = furnitureWidthInMeters * gridCellWidth;
                            const furnitureLengthInPixels = furnitureLengthInMeters * gridCellHeight;

                            const positionX = furniture.x;
                            const positionY = furniture.y;

                            const rotationAngle = furniture.rotation || 0;

                            const foundFurniture = categories
                                .flatMap(category => category.furniture)
                                .find(item => 
                                    Object.keys(item.variants).includes(furniture.variantId)
                                );

                            const variant = foundFurniture ? foundFurniture.variants[furniture.variantId] : null;

                            const discountedPrice = foundFurniture ? foundFurniture.price - (foundFurniture.price * foundFurniture.discount / 100) : 0;
                        
                            return (
                                <Tooltip
                                    placement='top'
                                    label={
                                        variant && foundFurniture ? (
                                            <Flex w="full" direction="column">
                                                <Flex w="full" gap={2}>
                                                    <Image src={variant.image} alt={foundFurniture.name} boxSize="40px" objectFit="contain" />
                                                    <Flex w="full" direction="column">
                                                        <Text fontSize="xs" fontWeight="500" color="white">
                                                            {foundFurniture.name} | {variant.color}
                                                        </Text>
                                                        <Text fontSize="xs" color="white">
                                                            RM {discountedPrice}
                                                        </Text>
                                                    </Flex>
                                                </Flex>
                                                <Flex w="full">
                                                    <Text fontSize="xs" color="white">Width: {foundFurniture.width} x Length: {foundFurniture.length} x Height: {foundFurniture.height}</Text>
                                                </Flex>
                                            </Flex>
                                        ) : "No variant data available"
                                    }
                                    aria-label={`Tooltip for furniture ${furniture.id}`}
                                >
                                    <Box
                                        key={furniture.id}
                                        position="absolute"
                                        left={`${positionX}px`}
                                        top={`${positionY}px`}
                                        transform={`translate(-50%, -50%) rotate(${rotationAngle}deg)`}
                                        width={`${furnitureWidthInPixels}px`} 
                                        height={`${furnitureLengthInPixels}px`}
                                        draggable
                                        onDragStart={(e) => {
                                            setIsDragging(true);
                                            setDraggedItem(furniture.id);
                                        }}
                                        onDrag={(e) => {
                                            if (isDragging && draggedItem) {
                                                const mouseX = e.clientX;
                                                const mouseY = e.clientY;
                                                setCurrentPosition({ x: mouseX, y: mouseY });
                                            }
                                        }}
                                        onDragEnd={(e) => {
                                            setIsDragging(false);
                                            setDraggedItem(null);
                                        }}
                                        onMouseEnter={() => setHoveredItem(furniture.id)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    >
                                        <Image 
                                            src={furniture.image} 
                                            alt={`Furniture ${furniture.id}`} 
                                            objectFit="contain" 
                                            boxSize="100%" 
                                        />     
                                        {hoveredItem === furniture.id && (
                                            <Flex position="absolute" top="0" bottom="0" left="50%" transform="translateX(-50%)" direction="column" alignItems="center" justifyContent="center">
                                                <IconButton
                                                    onClick={() => handleRotate(furniture.id, 'left')}
                                                    aria-label="Rotate Left"
                                                    icon={<FaArrowRotateLeft />}
                                                    variant="ghost"
                                                    outline="none"
                                                    size="xs"
                                                />
                                                <IconButton
                                                    onClick={() => handleRotate(furniture.id, 'right')}
                                                    aria-label="Rotate Right"
                                                    icon={<FaArrowRotateRight />}
                                                    variant="ghost"
                                                    outline="none"
                                                    size="xs"
                                                />
                                                <IconButton
                                                    onClick={() => { setFurniturePositions((prevPositions) => prevPositions.filter(f => f.id !== furniture.id)); }}
                                                    aria-label="Delete"
                                                    icon={<IoTrashOutline />}
                                                    variant="ghost"
                                                    outline="none"
                                                    size="xs"
                                                />
                                            </Flex>
                                        )}
                                    </Box>                                    
                                </Tooltip>
                            );
                        })}
                    </Box>
                </Flex>
                <Flex w="15%" direction="column" p={3} alignItems="center" gap={3}>
                    <Flex w="full" gap={3} alignItems="center">
                        <Tooltip label="Go Back" aria-label="Go Back" placement='top'>
                            <IconButton
                                icon={<IoMdArrowRoundBack />}
                                size="md"
                                colorScheme="blue"
                                style={{ outline: 'none' }}
                                onClick={() => window.history.back()}
                            />
                        </Tooltip>
                        <Text fontSize="md">Go Back</Text>
                    </Flex>           
                    <Flex w="full" gap={3} alignItems="center">
                        <Tooltip label="Export to PNG" aria-label="Export to PNG" placement='top'>
                            <IconButton
                                icon={<AiOutlineExport />}
                                size="md"
                                colorScheme="blue"
                                style={{ outline: 'none' }}
                                onClick={handleExportToPNG}
                            />
                        </Tooltip>
                        <Text fontSize="md">Export To PNG</Text>
                    </Flex>
                    <Flex w="full" gap={3} alignItems="center">
                        <Tooltip label="Generate Preferences" aria-label="Export to PNG" placement='top'>
                            <IconButton
                                icon={<PiStarFourLight />}
                                size="md"
                                colorScheme="blue"
                                style={{ outline: 'none' }}
                                onClick={onOpenPreferenceModal}
                            />
                        </Tooltip>
                        <Text fontSize="md">Preferences</Text>
                    </Flex>
                    <Flex w="full" gap={3} alignItems="center">
                        
                    </Flex>
                </Flex>
                <Modal isOpen={isOpenFilterModal} onClose={onCloseFilterModal} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Filter Furniture</ModalHeader>
                        <ModalCloseButton style={{ outline: 'none' }} />
                        <ModalBody>
                            <Flex>
                                <Select
                                    placeholder="Filter by Price Range"
                                    size="md"
                                    focusBorderColor="blue.500"
                                    borderRadius="lg"
                                    borderColor="gray.300"
                                    backgroundColor="white"
                                    color="gray.800"
                                    onChange={(e) => setSearchFurniturePriceQuery(e.target.value)}
                                >
                                    {Object.keys(priceRangeFilter).map((priceRange, index) => (
                                        <option key={index} value={priceRange}>RM {priceRange}</option>
                                    ))}
                                </Select>
                            </Flex>

                            <Flex mt={4}>
                                <Select
                                    placeholder="Filter by Material"
                                    size="md"
                                    focusBorderColor="blue.500"
                                    borderRadius="lg"
                                    borderColor="gray.300"
                                    backgroundColor="white"
                                    color="gray.800"
                                    onChange={(e) => setSearchFurnitureMaterialQuery(e.target.value)}
                                >
                                    {materialFilters.map((material, index) => (
                                        <option key={index} value={material}>{material}</option>
                                    ))}
                                </Select>
                            </Flex>

                            <Flex mt={4}>
                                <Select
                                    placeholder="Filter by Color"
                                    size="md"
                                    focusBorderColor="blue.500"
                                    borderRadius="lg"
                                    borderColor="gray.300"
                                    backgroundColor="white"
                                    color="gray.800"
                                    onChange={(e) => setSearchFurnitureColorQuery(e.target.value)}
                                >
                                    {colorFilters.map((color, index) => (
                                        <option key={index} value={color}>{color}</option>
                                    ))}
                                </Select>
                            </Flex>

                            <Flex mt={4}>
                            {
                                filterByFavourites ?
                                    <Button colorScheme="red" variant="solid" size="md" leftIcon={<IoIosHeart />} onClick={() => setFilterByFavourites(false)} style={{ outline: 'none' }}>
                                        Remove Filter
                                    </Button>
                                :
                                    <Button colorScheme="blue" variant="solid" size="md" leftIcon={<IoIosHeartEmpty />} onClick={() => setFilterByFavourites(true)} style={{ outline: 'none' }}>
                                        Filter by Favourites
                                    </Button>
                            }
                            </Flex>
                        </ModalBody>
                        <ModalFooter>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
                <Modal isOpen={isOpenPreferenceModal} onClose={onClosePreferenceModal} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Configure Your Preferences!</ModalHeader>
                        <ModalCloseButton style={{ outline: 'none' }} />
                        <ModalBody>
                            <FormControl mb={4}>
                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">Budget</FormLabel>
                                <InputGroup>
                                    <InputLeftAddon children="RM" />
                                    <Input
                                        type="number"
                                        placeholder="Enter your budget"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                    />
                                </InputGroup>
                            </FormControl>

                            <MultiSelect
                                label="Style Preferences"
                                placeholder="Select preferred styles"
                                options={styleOptions}
                                selectedOptions={selectedStyles}
                                setSelectedOptions={setSelectedStyles}
                            />

                            <Box mb={4}/>

                            <MultiSelect
                                label="Material Preferences"
                                placeholder="Select preferred materials"
                                options={materialFilters}
                                selectedOptions={selectedMaterials}
                                setSelectedOptions={setSelectedMaterials}
                            />

                            <Box mb={4}/>

                            <FormControl mb={4}>
                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">Room/Space Type</FormLabel>
                                <Select
                                    placeholder="Select Room Type"
                                    value={selectedRoomType}
                                    onChange={(e) => setSelectedRoomType(e.target.value)}
                                >
                                    <option value="Living Room">Living Room</option>
                                    <option value="Bedroom">Bedroom</option>
                                    <option value="Dining Room">Dining Room</option>
                                    <option value="Office">Office</option>
                                </Select>
                            </FormControl>

                            <FormControl mb={4}>
                                <FormLabel mb={2} fontSize="sm" fontWeight="medium" color="gray.900">Palette Preference</FormLabel>
                                <Select
                                    placeholder="Select Palette"
                                    value={selectedPalette}
                                    onChange={(e) => setSelectedPalette(e.target.value)}
                                >
                                    <option value="Neutral">Neutral (Whites, Beiges, Grays)</option>
                                    <option value="Warm">Warm (Reds, Oranges, Yellows)</option>
                                    <option value="Cool">Cool (Blues, Greens, Purples)</option>
                                    <option value="Earthy">Earthy (Browns, Greens, Terracottas)</option>
                                    <option value="Monochrome">Monochrome (Single-color with various shades)</option>
                                    <option value="Vibrant">Vibrant (Bright, Bold Colors)</option>
                                    <option value="Pastel">Pastel (Soft, Muted Colors)</option>
                                </Select>
                            </FormControl>

                            <MultiSelect
                                label="Tags"
                                placeholder="Select tags"
                                options={tagOptions}
                                selectedOptions={selectedTags}
                                setSelectedOptions={setSelectedTags}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={handleSubmitPreferences}>
                                Submit Preferences
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Flex>                
        </Grid>
    );
};

export default FloorPlanPersonalization;