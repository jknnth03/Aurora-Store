import React from "react";
import { MODULES } from "./modules.jsx";
import PrivateRoutes from "./index.jsx";
import PublicRoute from "./PublicRoute.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Users from "../pages/user-management/user/Users.jsx";
import Roles from "../pages/user-management/roles/Roles.jsx";
import Login from "../pages/login/Login.jsx";
import Stores from "../pages/masterlist/stores/Stores.jsx";
import ScoreRating from "../pages/masterlist/score-rating/ScoreRating.jsx";
import Checklist from "../pages/masterlist/checklist/CheckList.jsx";
import StoreChecklist from "../pages/masterlist/store-checklist/StoreChecklist.jsx";
import Region from "../pages/masterlist/region/Region.jsx";
import Area from "../pages/masterlist/area/Area.jsx";
import RegionHead from "../pages/others/RegionHead.jsx";
import AreaHead from "../pages/others/AreadHead.jsx";
import QAChecklist from "../pages/qa-checklist/QAChecklist.jsx";
import QAChecklistMonitoring from "../pages/qa-checklist-monitoring/QAChecklistMonitoring.jsx";
import SurveyApproval from "../pages/survey-approval/SurveyApproval.jsx";
import CheckListSettings from "../pages/settings/checklist-settings/CheckListSettings.jsx";
import Guidelines from "../pages/masterlist/guidelines/Guidelines.jsx";

export const ROUTES = [
  {
    id: "LOGIN",
    path: MODULES.LOGIN.path,
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },

  {
    element: <PrivateRoutes />,
    children: [
      {
        id: "DASHBOARD",
        path: MODULES.DASHBOARD.path,
        element: <Dashboard />,
        handle: { permission: MODULES.DASHBOARD.permissionId },
      },
      {
        id: "USERMANAGEMENT.USERS",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.USERS.path}`,
        element: <Users />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.USERS.permissionId,
        },
      },
      {
        id: "USERMANAGEMENT.ROLES",
        path: `${MODULES.USERMANAGEMENT.path}/${MODULES.USERMANAGEMENT.children.ROLES.path}`,
        element: <Roles />,
        handle: {
          permission: MODULES.USERMANAGEMENT.children.ROLES.permissionId,
        },
      },
      {
        id: "MASTERLIST.STORES",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.STORES.path}`,
        element: <Stores />,
        handle: { permission: MODULES.MASTERLIST.children.STORES.permissionId },
      },
      {
        id: "MASTERLIST.SCORE_RATING",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.SCORE_RATING.path}`,
        element: <ScoreRating />,
        handle: {
          permission: MODULES.MASTERLIST.children.SCORE_RATING.permissionId,
        },
      },
      {
        id: "MASTERLIST.CHECKLIST",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.CHECKLIST.path}`,
        element: <Checklist />,
        handle: {
          permission: MODULES.MASTERLIST.children.CHECKLIST.permissionId,
        },
      },
      {
        id: "MASTERLIST.STORE_CHECKLIST",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.STORE_CHECKLIST.path}`,
        element: <StoreChecklist />,
        handle: {
          permission: MODULES.MASTERLIST.children.STORE_CHECKLIST.permissionId,
        },
      },
      {
        id: "MASTERLIST.REGION",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.REGION.path}`,
        element: <Region />,
        handle: { permission: MODULES.MASTERLIST.children.REGION.permissionId },
      },
      {
        id: "MASTERLIST.AREA",
        path: `${MODULES.MASTERLIST.path}/${MODULES.MASTERLIST.children.AREA.path}`,
        element: <Area />,
        handle: { permission: MODULES.MASTERLIST.children.AREA.permissionId },
      },
      {
        id: "OTHERS.REGION_HEAD",
        path: `${MODULES.OTHERS.path}/${MODULES.OTHERS.children.REGION_HEAD.path}`,
        element: <RegionHead />,
        handle: {
          permission: MODULES.OTHERS.children.REGION_HEAD.permissionId,
        },
      },
      {
        id: "OTHERS.AREA_HEAD",
        path: `${MODULES.OTHERS.path}/${MODULES.OTHERS.children.AREA_HEAD.path}`,
        element: <AreaHead />,
        handle: {
          permission: MODULES.OTHERS.children.AREA_HEAD.permissionId,
        },
      },
      {
        id: "QA.QA_CHECKLIST",
        path: MODULES.QA.path,
        element: <QAChecklist />,
        handle: { permission: MODULES.QA.permissionId },
      },
      {
        id: "QA.QA_MONITORING",
        path: MODULES.QA_MONITORING.path,
        element: <QAChecklistMonitoring />,
        handle: { permission: MODULES.QA_MONITORING.permissionId },
      },
      {
        id: "SURVEY_APPROVAL.APPROVER_DASHBOARD",
        path: MODULES.SURVEY_APPROVAL.path,
        element: <SurveyApproval />,
        handle: { permission: MODULES.SURVEY_APPROVAL.permissionId },
      },
      {
        id: "SETTINGS.CHECKLIST_SETTINGS",
        path: `${MODULES.SETTINGS.path}/${MODULES.SETTINGS.children.CHECKLIST_SETTINGS.path}`,
        element: <CheckListSettings />,
        handle: {
          permission: MODULES.SETTINGS.children.CHECKLIST_SETTINGS.permissionId,
        },
      },
      {
        id: "SETTINGS.GUIDELINES",
        path: `${MODULES.SETTINGS.path}/${MODULES.SETTINGS.children.GUIDELINES.path}`,
        element: <Guidelines />,
        handle: {
          permission: MODULES.SETTINGS.children.GUIDELINES.permissionId,
        },
      },
    ],
  },
];
