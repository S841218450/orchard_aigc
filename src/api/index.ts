import { registerApi } from "./config/register";
import { createApiCallerObject } from "./config/index";

const apiConfigList = registerApi();
const API = createApiCallerObject(apiConfigList);
export default API;
