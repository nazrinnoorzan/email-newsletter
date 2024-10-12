import { type NextApiRequest, type NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env";

type toAddressType = {
  emailAddress: string;
  subscribeId: string;
  firstName: string | null;
  lastName: string | null;
};

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    subject: string;
    bodyHtml: string;
    bodyPlainText: string;
    toAddress: toAddressType[];
  };
}

const sendEmail = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
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
      const { subject, bodyHtml, bodyPlainText, toAddress } = req.body;
      await caller.compose.sendEmail({
        subject,
        bodyHtml,
        bodyPlainText,
        toAddress,
      });
      res.status(200).json({ message: "Success!" });
    } catch (cause) {
      console.error(cause);
      res.status(500).json({ message: "Something is wrong!" });
    }
  } else {
    res.status(404).json({ message: "Invalid method!" });
  }
};

export default sendEmail;
