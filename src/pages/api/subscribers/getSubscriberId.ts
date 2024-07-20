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

  // Create context and caller
  // const ctx = await createTRPCContext({
  //   req,
  //   res,
  //   info: {
  //     isBatchCall: false,
  //     calls: [],
  //   },
  // });
  // const caller = createCaller(ctx);

  try {
    const { email } = req.body;
    // const user = await caller.subscriber.getSubscriberId({
    //   email,
    // });
    res.status(200).json({ isEmailExist: 1, memberId: email });
  } catch (cause) {
    console.error(cause);
    res.status(500).json({ isEmailExist: 0, memberId: null });
  }
};

export default getSubscriberId;