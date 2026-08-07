import { Skeleton, Box, Stack } from '@mui/material';

export default function LoadingSpinner({ fullscreen = true, layout = 'dashboard' }) {
  if (!fullscreen) layout = 'inline';

  const wrapperProps = {
    sx: { width: '100%', p: { xs: 2, sm: 3, md: 4 }, boxSizing: 'border-box', maxWidth: 1080, mx: 'auto' }
  };

  if (layout === 'dashboard') {
    return (
      <Box {...wrapperProps}>
        {/* Header Skeleton */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rectangular" width="30%" height={32} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width="50%" sx={{ fontSize: '1rem' }} />
        </Box>
        {/* Stats Grid Skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 4 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: 3 }} />)}
        </Box>
        {/* Content Area Skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }, gap: 3 }}>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
          <Stack spacing={2}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 3 }} />)}
          </Stack>
        </Box>
      </Box>
    );
  }

  if (layout === 'list') {
    return (
      <Box {...wrapperProps}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" sx={{ mb: 4 }} />
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rounded" height={70} sx={{ borderRadius: 2 }} />)}
        </Stack>
      </Box>
    );
  }

  if (layout === 'map') {
    return (
      <Box sx={{ width: '100%', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Skeleton variant="rounded" width="100%" sx={{ flexGrow: 1, borderRadius: 3 }} />
      </Box>
    );
  }

  if (layout === 'form') {
    return (
      <Box {...wrapperProps} sx={{ ...wrapperProps.sx, maxWidth: 640 }}>
        <Skeleton variant="text" width="50%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" sx={{ mb: 4 }} />
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" height={160} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />
        </Stack>
      </Box>
    );
  }

  // inline
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stack spacing={2}>
        <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '30%' }} />
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={60} />
      </Stack>
    </Box>
  );
}
