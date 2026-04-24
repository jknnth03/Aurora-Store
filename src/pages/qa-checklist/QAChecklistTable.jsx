import { useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import NoDataFound from "../../reusable-components/nodatafound/NoDataFound";
import "./QAChecklistTable.scss";

const QAChecklistTable = ({
  columns = [],
  data,
  isLoading = false,
  skeletonRows = 6,
  actions,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
}) => {
  const safeData = Array.isArray(data) ? data : [];

  const [internalSortBy, setInternalSortBy] = useState(null);
  const [internalSortOrder, setInternalSortOrder] = useState("asc");

  const activeSortBy = onSort ? sortBy : internalSortBy;
  const activeSortOrder = onSort ? sortOrder : internalSortOrder;

  const handleSort = (col) => {
    if (!col.sortable) return;
    const isActive = activeSortBy === col.key;
    const newOrder = isActive && activeSortOrder === "asc" ? "desc" : "asc";

    if (onSort) {
      onSort(col.key, newOrder);
    } else {
      setInternalSortBy(col.key);
      setInternalSortOrder(newOrder);
    }
  };

  const sortedData = onSort
    ? safeData
    : [...safeData].sort((a, b) => {
        if (!internalSortBy) return 0;
        const aVal = a[internalSortBy];
        const bVal = b[internalSortBy];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        const cmp =
          typeof aVal === "string"
            ? aVal.localeCompare(bVal)
            : aVal < bVal
              ? -1
              : aVal > bVal
                ? 1
                : 0;
        return internalSortOrder === "asc" ? cmp : -cmp;
      });

  const showActions = Boolean(actions);
  const isEmpty = !isLoading && sortedData.length === 0;

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (activeSortBy !== col.key)
      return (
        <UnfoldMoreIcon className="qact__sort-icon qact__sort-icon--idle" />
      );
    return activeSortOrder === "asc" ? (
      <ArrowUpwardIcon className="qact__sort-icon qact__sort-icon--active" />
    ) : (
      <ArrowDownwardIcon className="qact__sort-icon qact__sort-icon--active" />
    );
  };

  return (
    <div className="qact">
      {isEmpty ? (
        <NoDataFound />
      ) : (
        <div className="qact__wrap">
          <table className="qact__table">
            <thead className="qact__thead">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`qact__th${col.sortable ? " qact__th--sortable" : ""}${activeSortBy === col.key ? " qact__th--sorted" : ""}`}
                    style={{ width: col.width || "auto" }}
                    onClick={() => handleSort(col)}>
                    <span className="qact__th-inner">
                      {col.label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                {showActions && (
                  <th className="qact__th qact__th--actions">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="qact__tbody">
              {isLoading
                ? Array.from({ length: skeletonRows }).map((_, ri) => (
                    <tr
                      key={`skel-${ri}`}
                      className="qact__tr qact__tr--skeleton">
                      {columns.map((col) => (
                        <td key={col.key} className="qact__td">
                          <span
                            className="qact__skeleton"
                            style={{ width: `${55 + Math.random() * 35}%` }}
                          />
                        </td>
                      ))}
                      {showActions && (
                        <td className="qact__td qact__td--actions">
                          <span className="qact__skeleton qact__skeleton--action" />
                        </td>
                      )}
                    </tr>
                  ))
                : sortedData.map((row, ri) => (
                    <tr
                      key={row.id ?? ri}
                      className={`qact__tr${onRowClick ? " qact__tr--clickable" : ""}`}
                      onClick={() => onRowClick && onRowClick(row)}>
                      {columns.map((col) => (
                        <td key={col.key} className="qact__td">
                          {col.render
                            ? col.render(row[col.key], row)
                            : (row[col.key] ?? "—")}
                        </td>
                      ))}
                      {showActions && (
                        <td
                          className="qact__td qact__td--actions"
                          onClick={(e) => e.stopPropagation()}>
                          <div className="qact__actions">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QAChecklistTable;
