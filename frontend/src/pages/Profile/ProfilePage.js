import React from "react"
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Badge,
  IconButton,
  Stack,
  Tooltip,
  Paper,
} from "@mui/material"
import { CameraAlt, Edit, Person, Notifications, Lock, HelpOutline } from "@mui/icons-material"

export default function ProfilePage() {
  const user = {
    name: "Saakshi Aayasya",
    email: "saakshi@example.com",
    avatar: "/placeholder.svg",
    bio: "Passionate about building impactful tech experiences across software and hardware domains.",
    status: "Online",
  }

  const settings = [
    { label: "Account Settings", icon: <Person fontSize="small" /> },
    { label: "Notification Preferences", icon: <Notifications fontSize="small" /> },
    { label: "Privacy & Security", icon: <Lock fontSize="small" /> },
    { label: "Help & Support", icon: <HelpOutline fontSize="small" /> },
  ]

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f8fafc, #e2e8f0)",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box maxWidth="900px" mx="auto">
        <Card elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Profile Overview
          </Typography>

          <Grid container spacing={4} alignItems="center">
            {/* Avatar with status + camera overlay */}
            <Grid item>
              <Box sx={{ position: "relative", width: 130, height: 130 }}>
                {/* Outer glowing ring */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -6,
                    left: -6,
                    right: -6,
                    bottom: -6,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(to right,rgb(34, 180, 206),rgb(39, 192, 219), #2563eb)",
                    filter: "blur(8px)",
                    opacity: 0.8,
                    zIndex: 0,
                  }}
                />

                {/* Avatar */}
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        bgcolor: "#22c55e",
                        border: "2px solid white",
                      }}
                    />
                  }
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{
                      width: 120,
                      height: 120,
                      zIndex: 1,
                      border: "4px solid white",
                      boxShadow: 3,
                    }}
                  />
                </Badge>

                {/* Camera hover overlay */}
                <Tooltip title="Change Photo">
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      bgcolor: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.3s",
                      "&:hover": {
                        opacity: 1,
                        cursor: "pointer",
                      },
                    }}
                  >
                    <CameraAlt fontSize="small" />
                  </Box>
                </Tooltip>
              </Box>
            </Grid>

            {/* User info and edit */}
            <Grid item xs>
              <Stack spacing={1}>
                <Typography variant="h5" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography color="text.secondary">{user.email}</Typography>
                <Typography color="text.secondary">{user.bio}</Typography>
              </Stack>
            </Grid>

            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                sx={{ textTransform: "none" }}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>

          <Grid container spacing={2}>
            {settings.map((setting, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    borderRadius: 2,
                    transition: "0.3s",
                    "&:hover": {
                      backgroundColor: "#f3f4f6",
                      boxShadow: 3,
                      cursor: "pointer",
                    },
                  }}
                >
                  {setting.icon}
                  <Typography>{setting.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Box>
    </Box>
  )
}
