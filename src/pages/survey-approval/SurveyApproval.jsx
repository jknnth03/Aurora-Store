import { useState } from "react";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import { useGetSurveyApprovalsQuery } from "../../features/api/survey-approval/surveyApprovalApi";
import SurveyApprovalModal from "./SurveyApprovalModal";
import "./SurveyApproval.scss";
import { useChipColors } from "../../components/accountmenu/ChipColorPickerDialog";

const currentDate = new Date();

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_LABELS = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

const buildColumns = () => [
  {
    key: "store",
    label: "Store",
    sortable: true,
    align: "left",
    render: (_, row) => row?.name ?? "—",
  },
  {
    key: "region",
    label: "Region",
    sortable: true,
    align: "left",
    render: (_, row) => row?.region?.name ?? "—",
  },
  {
    key: "area",
    label: "Area",
    sortable: true,
    align: "left",
    render: (_, row) => row?.area?.name ?? "—",
  },
  {
    key: "location",
    label: "Location",
    sortable: true,
    align: "left",
    render: (_, row) => row?.name ?? "—",
  },
  {
    key: "month",
    label: "Month",
    sortable: false,
    align: "left",
    render: (_, row) => {
      const month = row?.store_checklist?.[0]?.weekly_record?.[0]?.month;
      return month ? MONTHS[month - 1] : "—";
    },
  },
  {
    key: "week",
    label: "Week",
    sortable: false,
    align: "left",
    render: (_, row) => {
      const week = row?.store_checklist?.[0]?.weekly_record?.[0]?.week;
      return week ? (WEEK_LABELS[week] ?? `Week ${week}`) : "—";
    },
  },
  {
    key: "checklist",
    label: "Checklist",
    sortable: true,
    align: "left",
    render: (_, row) => {
      const checklistObj = row?.store_checklist?.[0]?.checklist;
      return (
        (typeof checklistObj === "object"
          ? checklistObj?.name
          : checklistObj) || "—"
      );
    },
  },
];

const SurveyApproval = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useChipColors();

  const { data, isFetching, error } = useGetSurveyApprovalsQuery({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  const tableData = error ? [] : (data?.data?.data ?? []);
  const total = error ? 0 : (data?.data?.total ?? 0);
  const isEmpty = !isFetching && (tableData.length === 0 || !!error);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleActionSuccess = () => {
    handleClose();
  };

  return (
    <>
      <PageContainer
        isEmpty={isEmpty}
        actions={
          <span className="survey-approval__page-title">
            <span className="survey-approval__page-icon">
              <AssignmentTurnedInIcon fontSize="inherit" />
            </span>
            Survey Approval
          </span>
        }
        pagination={
          <TablePagination
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPage}
          />
        }>
        <div className="survey-approval__table-wrapper">
          <UniversalTable
            columns={buildColumns()}
            data={tableData}
            isLoading={isFetching}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={handleRowClick}
          />
        </div>
      </PageContainer>

      <SurveyApprovalModal
        open={modalOpen}
        onClose={handleClose}
        onActionSuccess={handleActionSuccess}
        rowData={selectedRow}
      />
    </>
  );
};

export default SurveyApproval;
