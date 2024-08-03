import { type NextApiRequest, type NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    addList: string[];
  };
}

const newSubscriberWithList = async (
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
      const { email, firstName, lastName, companyName, addList } = req.body;
      const result = await caller.subscriber.newSubscriberWithList({
        email,
        firstName,
        lastName,
        companyName,
        addList,
      });

      if (result.code === 500)
        return res
          .status(500)
          .json({ message: result.message, result: "Error" });

      res.status(200).json({ message: result.message, result: "Success" });
    } catch (cause) {
      console.error(cause);
      res.status(500).json({
        message: "Something is wrong when adding new subscriber.",
        result: "Error",
      });
    }
  } else {
    res.status(404).json({ message: "Invalid method!" });
  }
};

export default newSubscriberWithList;
