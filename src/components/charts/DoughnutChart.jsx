import { Box, Flex, Text, Popover, PopoverTrigger, PopoverContent, Divider, Avatar } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';

export const DoughnutChart = ({ data, options }) => {

    return (
        <Box p={3} w="full" display="flex" alignItems="center" justifyContent="center">
            <Chart type="doughnut" data={data} options={options} />
        </Box>
    );
};
