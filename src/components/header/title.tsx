import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";

export const Title: React.FC = () => {
    return (
        <Link to="/" style={{ textDecoration: "none" }}>
            <Box
                display="flex"
                alignItems="center"
                gap="8px"
                sx={{
                    textDecoration: "none",
                }}
            >
                <Box
                    component="img"
                    src="/assets/brand/gandall-logo.png"
                    alt="Gandall Group"
                    sx={{
                        height: "40px",
                        width: "auto",
                    }}
                />
            </Box>
        </Link>
    );
};