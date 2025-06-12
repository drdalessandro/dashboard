import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from "@mui/icons-material";

export const Breadcrumb = ({ title }: { title: string }) => (
    <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
    >
        <Link
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center' }}
        >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            {title}
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {title}
        </Typography>
    </Breadcrumbs>
);