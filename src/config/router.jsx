import { createBrowserRouter } from "react-router";
import { ROUTES } from "./routes.jsx";

const router = createBrowserRouter(ROUTES);

export default router;

// production
// export const router = createBrowserRouter(ROUTES, {
//   basename: "/aurora-aio/store/",
// });

// export default router;
