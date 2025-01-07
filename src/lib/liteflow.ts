import Liteflow from "@liteflow/sdk";

const liteflowKey = process.env.NEXT_PUBLIC_LITEFLOW_API_KEY;
if (!liteflowKey)
  throw new Error("NEXT_PUBLIC_LITEFLOW_API_KEY is not defined");

const liteflow = new Liteflow(liteflowKey, {
  baseUrl: "http://localhost:3000/api/v1",
});
export default liteflow;
