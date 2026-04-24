import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import StarRateIcon from "@mui/icons-material/StarRate";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetScoreRatingByIdQuery,
  useCreateScoreRatingMutation,
  useUpdateScoreRatingMutation,
} from "../../../features/api/masterlist/scoreRatingApi";
import "./ScoreRatingModal.scss";

const schema = yup.object({
  rating: yup
    .number()
    .typeError("Rating must be a number")
    .required("Rating is required")
    .min(1, "Rating must be at least 1"),
  score: yup
    .number()
    .typeError("Score must be a number")
    .required("Score is required")
    .min(0, "Score must be at least 0"),
});

const SkeletonLoader = () => (
  <div className="srm__skeleton-wrap">
    {[50, 75].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="srm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const ViewField = ({ label, value }) => (
  <div className="srm__field">
    <div className="srm__input-wrap srm__input-wrap--disabled">
      <label className="srm__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const ScoreRatingModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");

  const { data: scoreRatingDetail, isFetching: scoreRatingLoading } =
    useGetScoreRatingByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });
  const rowData = scoreRatingDetail?.data ?? null;

  const [createScoreRating, { isLoading: isCreating }] =
    useCreateScoreRatingMutation();
  const [updateScoreRating, { isLoading: isUpdating }] =
    useUpdateScoreRatingMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { rating: "", score: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        reset({ rating: "", score: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      reset({
        rating: rowData.rating ?? "",
        score: rowData.score ?? "",
      });
    }
  }, [rowData, open, selectedId, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateScoreRating({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Score rating updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createScoreRating(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Score rating created successfully.",
          {
            variant: "success",
          },
        );
      }
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      const apiErrors = err?.data?.errors;
      const errorMessage =
        apiErrors?.[0]?.detail ?? "Something went wrong. Please try again.";
      window.__snackbar__?.enqueueSnackbar(errorMessage, {
        variant: apiErrors ? "warning" : "error",
      });
    }
  };

  const headerIcon = {
    add: <StarRateIcon className="srm__header-icon" />,
    view: <RemoveRedEyeIcon className="srm__header-icon" />,
    edit: <EditIcon className="srm__header-icon" />,
  };
  const headerTitle = {
    add: "Add Score Rating",
    view: "View Score Rating",
    edit: "Edit Score Rating",
  };
  const isView = mode === "view";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "srm__paper" }}>
      <div className="srm__header">
        <div className="srm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="srm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="srm__content">
        {scoreRatingLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="srm__group">
              <p className="srm__group-label">Score Rating Details</p>
              <div className="srm__stack">
                <ViewField label="Rating" value={rowData?.rating} />
                <ViewField label="Score" value={rowData?.score} />
              </div>
            </div>

            <div className="srm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
                modalVariant={true}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="srm__group">
              <p className="srm__group-label">Score Rating Details</p>
              <div className="srm__stack">
                <div className="srm__field">
                  <div
                    className={`srm__input-wrap${errors.rating ? " srm__input-wrap--error" : ""}`}>
                    <label className="srm__label">
                      Rating <span className="srm__required">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("rating")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.rating && (
                    <p className="srm__error">
                      <ReportProblemIcon />
                      {errors.rating?.message}
                    </p>
                  )}
                </div>

                <div className="srm__field">
                  <div
                    className={`srm__input-wrap${errors.score ? " srm__input-wrap--error" : ""}`}>
                    <label className="srm__label">
                      Score <span className="srm__required">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("score")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.score && (
                    <p className="srm__error">
                      <ReportProblemIcon />
                      {errors.score?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="srm__footer">
              {selectedId && <BackButton onClick={() => setMode("view")} />}
              <ConfirmButton
                label={
                  isLoading ? "Saving..." : mode === "edit" ? "Update" : "Save"
                }
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
              />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScoreRatingModal;
