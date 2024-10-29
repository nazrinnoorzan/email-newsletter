import { useState } from "react";

interface CampaignDeleteProps {
  id: string;
  s3Key: string;
  scheduleDate: string | null;
  onDelete: (id: string, s3Key: string, isScheduled: boolean) => void;
}

export default function CampaignDelete({
  id,
  s3Key,
  scheduleDate,
  onDelete,
}: CampaignDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);

    let isDeleteScheduled = false;

    if (scheduleDate) {
      const targetDate = new Date(scheduleDate);

      // Get the current time in Malaysia (UTC+8)
      const currentDateMalaysia = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kuala_Lumpur",
      });
      const currentDate = new Date(currentDateMalaysia);

      if (targetDate > currentDate) {
        isDeleteScheduled = true;
      }
    }

    onDelete(id, s3Key, isDeleteScheduled);
    setIsDeleting(false);
  };

  return (
    <button
      type="submit"
      onClick={handleDelete}
      className="rounded-lg bg-red-600 px-6 py-4 text-center text-sm font-medium text-white focus:outline-none"
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
