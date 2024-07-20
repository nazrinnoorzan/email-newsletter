import { type NextApiRequest, type NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    email: string;
  };
}

const getSubscriberId = async (
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
      const { email } = req.body;
      const user = await caller.subscriber.getSubscriberId({
        email,
      });
      res.status(200).json({ isEmailExist: 1, memberId: user.id });
    } catch (cause) {
      console.error(cause);
      res.status(500).json({ isEmailExist: 0, memberId: null });
    }
  } else {
    res.status(404).json({ message: "Invalid method!" });
  }
};

export default getSubscriberId;
