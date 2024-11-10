import { useState } from "react";
import { useRouter } from "next/router";

import { isDateInFuture } from "~/utils/utils";

interface CampaignDeleteProps {
  id: string;
  s3Key: string;
  scheduleDate: string | null;
  isShowEditBtn: boolean;
  onDelete: (id: string, s3Key: string, isScheduled: boolean) => void;
}

export default function CampaignDelete({
  id,
  s3Key,
  scheduleDate,
  isShowEditBtn,
  onDelete,
}: CampaignDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const handleDelete = () => {
    setIsDeleting(true);

    let isDeleteScheduled = false;

    if (scheduleDate) {
      isDeleteScheduled = isDateInFuture(scheduleDate);
    }

    onDelete(id, s3Key, isDeleteScheduled);
    setIsDeleting(false);
  };

  const handleEdit = async () => {
    await router.push(`/campaigns/edit/${id}`);
  };

  return (
    <div className="flex items-center gap-4">
      {isShowEditBtn && (
        <button
          type="submit"
          onClick={handleEdit}
          className="rounded-lg bg-green-600 px-6 py-4 text-center text-sm font-medium text-white focus:outline-none"
          disabled={isDeleting}
        >
          Edit
        </button>
      )}
      <button
        type="submit"
        onClick={handleDelete}
        className="rounded-lg bg-red-600 px-6 py-4 text-center text-sm font-medium text-white focus:outline-none"
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
