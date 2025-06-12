import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { styled } from '@mui/material/styles';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

// Enhanced styling to match HTML template patterns
const HeaderContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  paddingLeft: theme.spacing(6),
  paddingRight: theme.spacing(6),
  backgroundColor: '#ffffff',
  borderBottom: `1px solid var(--color-border, #e7eef3)`,
  borderRadius: '0.75rem 0.75rem 0 0',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
}));

const HeaderContent = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '24px',
});

const TitleSection = styled(Box)({
  flex: '1 1 auto',
  minWidth: '0', // Allow text truncation
});

const ActionsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    justifyContent: 'flex-start',
  },
}));
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiBreadcrumbs-separator': {
    color: 'var(--color-copy-lighter, #8a9faa)',
  },
}));

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
}) => {
  return (
    <HeaderContainer>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <StyledBreadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography
                key={index}
                variant="body2"
                fontWeight={600}
                sx={{
                  color: 'var(--color-copy, #0e161b)',
                  fontSize: '0.875rem',
                }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                href={crumb.href}
                onClick={crumb.onClick}
                underline="hover"
                variant="body2"
                sx={{
                  color: 'var(--color-copy-light, #4e7a97)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'var(--color-primary, #1993e5)',
                  },
                }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </StyledBreadcrumbs>
      )}

      <HeaderContent>
        <TitleSection>
          <Typography
            variant="h1"
            component="h1"
            gutterBottom={!!subtitle}
            sx={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: 'var(--color-copy, #0e161b)',
              lineHeight: 1.2,
              fontFamily: '"Inter", "Noto Sans", sans-serif',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{ 
                mt: 1,
                color: 'var(--color-copy-light, #4e7a97)',
                fontSize: '1.125rem',
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </TitleSection>

        {actions && (
          <ActionsSection>
            {actions}
          </ActionsSection>
        )}
      </HeaderContent>

      {children && (
        <Box sx={{ mt: 4 }}>
          {children}
        </Box>
      )}
    </HeaderContainer>
  );
};

export default PageHeader;