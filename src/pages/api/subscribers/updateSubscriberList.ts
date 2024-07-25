import { type NextApiRequest, type NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    subscriberId: string;
    addList: string[];
    removeList: string[];
  };
}

const updateSubscriberList = async (
  req: ExtendedNextApiRequest,
  res: NextApiResponse,
) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== env.X_API_KEY) {
    res.status(500).json({ message: "Invalid API key!" });
  }

  if (req.method === "POST") {
    // Create context and caller
    const ctx = await createTRPCContext({
      req,
      res,
      info: {
        isBatchCall: false,
        calls: [],
      },
    });
    const caller = createCaller(ctx);

    try {
      const { subscriberId, addList, removeList } = req.body;
      const result = await caller.subscriber.updateSubscriberList({
        subscriberId,
        addList,
        removeList,
      });

      if (result.code === 404)
        return res
          .status(404)
          .json({ message: result.message, result: "Error" });

      res.status(200).json({ message: result.message, result: "Success" });
    } catch (cause) {
      console.error(cause);
      res.status(500).json({
        message: "Something is wrong when updating subscriber's list.",
        result: "Error",
      });
    }
  } else {
    res.status(404).json({ message: "Invalid method!" });
  }
};

export default updateSubscriberList;
