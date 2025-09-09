import "dotenv/config";
import { App } from "./app.js";
import "./workers/orderCancelWorker.js";

const PORT = process.env.PORT || "8000";
const server = new App();
server.listen(PORT);
