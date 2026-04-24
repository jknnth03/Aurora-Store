import React from "react";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import GamepadIcon from "@mui/icons-material/Gamepad";
import ListAltIcon from "@mui/icons-material/ListAlt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SettingsIcon from "@mui/icons-material/Settings";
import StarRateIcon from "@mui/icons-material/StarRate";
import ChecklistIcon from "@mui/icons-material/Checklist";
import TuneIcon from "@mui/icons-material/Tune";
import MapIcon from "@mui/icons-material/Map";
import PublicIcon from "@mui/icons-material/Public";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";

export const iconStyles = {
  main: { fontSize: "22px" },
  mainMedium: { fontSize: "24px" },
  mainLarge: { fontSize: "26px" },
  mainExtraLarge: { fontSize: "28px" },
  child: { fontSize: "18px" },
  button: { fontSize: "18px" },
  sync: { fontSize: "20px" },
};

export const imageStyles = {
  noData: { width: "120px", height: "120px" },
};

export const MODULES = {
  LOGIN: {
    name: "Login",
    permissionId: "login",
    displayName: "Login",
    path: "/login",
    icon: null,
    children: null,
  },

  DASHBOARD: {
    name: "Dashboard",
    permissionId: "dashboard",
    displayName: "Dashboard",
    path: "/",
    icon: <SpaceDashboardIcon sx={iconStyles.main} />,
    children: null,
  },

  USERMANAGEMENT: {
    name: "User Management",
    permissionId: "usermanagement",
    displayName: "User Management",
    path: "/usermanagement",
    icon: <ManageAccountsIcon sx={iconStyles.main} />,
    children: {
      USERS: {
        name: "Users",
        permissionId: "usermanagement.users",
        displayName: "Users",
        path: "users",
        icon: <PersonAddIcon sx={iconStyles.child} />,
      },
      ROLES: {
        name: "Roles",
        permissionId: "usermanagement.roles",
        displayName: "Roles",
        path: "roles",
        icon: <GamepadIcon sx={iconStyles.child} />,
      },
    },
  },

  MASTERLIST: {
    name: "Masterlist",
    permissionId: "masterlist",
    displayName: "Masterlist",
    path: "/masterlist",
    icon: <ListAltIcon sx={iconStyles.main} />,
    children: {
      STORES: {
        name: "Stores",
        permissionId: "masterlist.stores",
        displayName: "Stores",
        path: "stores",
        icon: <StorefrontIcon sx={iconStyles.child} />,
      },
      SCORE_RATING: {
        name: "Score Rating",
        permissionId: "masterlist.score_rating",
        displayName: "Score Rating",
        path: "score-rating",
        icon: <StarRateIcon sx={iconStyles.child} />,
      },
      CHECKLIST: {
        name: "Checklist",
        permissionId: "masterlist.checklist",
        displayName: "Checklist",
        path: "checklist",
        icon: <ChecklistIcon sx={iconStyles.child} />,
      },
      STORE_CHECKLIST: {
        name: "Store Checklist",
        permissionId: "masterlist.store_checklist",
        displayName: "Store Checklist",
        path: "store-checklist",
        icon: <AssignmentIcon sx={iconStyles.child} />,
      },
      REGION: {
        name: "Region",
        permissionId: "masterlist.region",
        displayName: "Region",
        path: "region",
        icon: <PublicIcon sx={iconStyles.child} />,
      },
      AREA: {
        name: "Area",
        permissionId: "masterlist.area",
        displayName: "Area",
        path: "area",
        icon: <MapIcon sx={iconStyles.child} />,
      },
    },
  },

  OTHERS: {
    name: "Others",
    permissionId: "others",
    displayName: "Others",
    path: "/others",
    icon: <FolderSpecialIcon sx={iconStyles.main} />,
    children: {
      REGION_HEAD: {
        name: "Region Head",
        permissionId: "others.region_head",
        displayName: "Region Head",
        path: "region-head",
        icon: <GroupsIcon sx={iconStyles.child} />,
      },
      AREA_HEAD: {
        name: "Area Head",
        permissionId: "others.area_head",
        displayName: "Area Head",
        path: "area-head",
        icon: <PersonIcon sx={iconStyles.child} />,
      },
    },
  },

  QA: {
    name: "QA Checklist",
    permissionId: "qa.qa_checklist",
    displayName: "QA Checklist",
    path: "/qa/checklist",
    icon: <FactCheckIcon sx={iconStyles.main} />,
    children: null,
  },

  QA_MONITORING: {
    name: "QA Monitoring",
    permissionId: "qa.qa_monitoring",
    displayName: "QA Monitoring",
    path: "/qa/monitoring",
    icon: <MonitorHeartIcon sx={iconStyles.main} />,
    children: null,
  },

  SURVEY_APPROVAL: {
    name: "Survey Approval",
    permissionId: "survey_approval.approver_dashboard",
    displayName: "Survey Approval",
    path: "/survey-approval/approver-dashboard",
    icon: <AssignmentTurnedInIcon sx={iconStyles.main} />,
    children: null,
  },

  SETTINGS: {
    name: "Settings",
    permissionId: "settings",
    displayName: "Settings",
    path: "/settings",
    icon: <SettingsIcon sx={iconStyles.main} />,
    children: {
      CHECKLIST_SETTINGS: {
        name: "Checklist Settings",
        permissionId: "settings.checklist_settings",
        displayName: "Checklist Settings",
        path: "checklist-settings",
        icon: <TuneIcon sx={iconStyles.child} />,
      },
    },
  },
};
