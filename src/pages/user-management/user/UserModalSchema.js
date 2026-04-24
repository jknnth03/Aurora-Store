import * as yup from "yup";

export const addSchema = yup.object({
  role_id: yup.number().required("Role is required"),
  first_name: yup.string().required("First name is required"),
  middle_name: yup.string().nullable(),
  last_name: yup.string().required("Last name is required"),
  suffix: yup.string().nullable(),
  mobile_number: yup.string().nullable(),
  gender: yup.string().required("Gender is required"),
  one_charging_id: yup.number().required("One Charging is required"),
  username: yup.string().required("Username is required"),
  employee_id: yup.string().required("Employee ID is required"),
});

export const editSchema = yup.object({
  role_id: yup.number().required("Role is required"),
  first_name: yup.string().required("First name is required"),
  middle_name: yup.string().nullable(),
  last_name: yup.string().required("Last name is required"),
  suffix: yup.string().nullable(),
  mobile_number: yup.string().nullable(),
  gender: yup.string().required("Gender is required"),
  one_charging_id: yup.number().required("One Charging is required"),
  username: yup.string().required("Username is required"),
  employee_id: yup.string().required("Employee ID is required"),
});
